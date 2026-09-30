"""Bounded local application service. Only release() builds public envelopes.

In-memory store is intentionally single-process/local. Authorization is checked by
Django before EVERY call, including retries. Replace store atomically for production.
"""
import asyncio
import hashlib
import json
import threading
import time
from collections import deque
from copy import deepcopy
from uuid import uuid4
from pydantic import ValidationError
from .schemas import MessageV1, AgentDraftV1, GuardDecisionV1, Claim
from .rules import minimize, safe_text, valid_evidence
from .context import build_context
from . import projection
from .fairness import equality_draft

FALLBACKS = {
    'auth': 'A conversa requer autenticação e autorização. Entre pelo canal configurado; não envie dados pessoais aqui.',
    'schema': 'Envie uma mensagem de até 2.000 caracteres usando o contrato da conversa, sem campos extras.',
    'not_found': 'Conversa indisponível para esta sessão. Inicie uma nova conversa.',
    'conflict': 'Este identificador já foi usado para outra mensagem. Inicie um novo envio.',
    'limit': 'Limite temporário da conversa atingido. Aguarde antes de tentar novamente.',
    'technical': 'Não consegui concluir a resposta agora. Tente novamente em instantes.',
    'denied': 'Não posso ajudar com acesso a dados de terceiros ou uma finalidade prejudicial. Posso ajudar a formular uma alternativa respeitosa e segura.',
    'clarify': 'Pode explicar o objetivo da pergunta, sem enviar dados de outras pessoas? Assim posso ajudar com a parte segura.',
    'demo': 'Demonstração local: esta resposta é fixa, não foi gerada por IA. O i-agora pode apoiar orçamento, reserva e prevenção de dívidas. Nenhum dado bancário foi consultado. Para experimentar respostas do Gemini, o responsável deve habilitar o modo de teste autorizado no servidor.',
}


class ConversationService:
    def __init__(self, gateway=None, *, context_builder=build_context, timeout=75,
                 principal_context_builder=None, on_commitment_proposed=None, principal_opening_builder=None,
                 max_turns=20, max_sessions=100, ttl=1800, clock=time.monotonic, requests_per_minute=6):
        self.gateway, self.context_builder = gateway, context_builder
        self.principal_context_builder = principal_context_builder
        self.principal_opening_builder = principal_opening_builder
        self.on_commitment_proposed = on_commitment_proposed
        self.timeout, self.max_turns, self.max_sessions = timeout, max_turns, max_sessions
        self.ttl, self.clock = ttl, clock
        self.audit = deque(maxlen=1000)  # enums only; no prompts, identifiers or raw exceptions
        self.sessions, self.created, self.cache = {}, {}, {}
        self.proposals = {}
        self.rates, self.requests_per_minute = {}, requests_per_minute
        self.lock = threading.Lock()

    def release(self, *, code='auth', conversation_id=None, http_status=401,
                draft=None, cached=None, citations=None):
        candidate = cached['reply'] if cached else (draft.reply if draft else FALLBACKS[code])
        if not safe_text(candidate):
            cached = draft = None
            code, http_status, citations = 'technical', 503, []
        self.audit.append({'event': 'release', 'code': code})
        if cached:
            return deepcopy(cached), http_status
        status = {'denied': 'safe_redirect', 'clarify': 'needs_clarification', 'demo': 'ok'}.get(code, 'unavailable')
        return {
            'schema_version': '1.0', 'conversation_id': conversation_id,
            'message_id': str(uuid4()), 'status': draft.status if draft else status,
            'reply': draft.reply if draft else FALLBACKS[code],
            'citations': citations or [], 'request_id': str(uuid4()),
        }, http_status

    async def start(self,principal,request_id):
        import re
        if not isinstance(request_id,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,60}',request_id):
            return self.release(code='schema',http_status=400)
        return await self.send(principal,{'schema_version':'1.0','conversation_id':None,'client_message_id':'open-'+request_id,'message':'Inicie a análise contextual deste perfil selecionado. Explique um achado relevante e faça uma pergunta específica, sem definir nem salvar metas.'},_opening_event=True)

    async def send(self, principal, payload, *, _opening_event=False):
        if not principal:
            return self.release()
        try:
            request = MessageV1.model_validate(payload)
            if not request.message.strip():
                raise ValueError('empty')
        except (ValidationError, ValueError):
            return self.release(code='schema', http_status=400)
        if not self.lock.acquire(blocking=False):
            return self.release(code='limit', http_status=429)
        try:
            return await self._send(principal, request, opening_event=_opening_event)
        finally:
            self.lock.release()

    def forget(self,principal):
        with self.lock:
            for mapping in (self.sessions,self.created,self.proposals,self.cache):
                for key in list(mapping):
                    if key[0]==principal:del mapping[key]

    def _expire(self):
        for key, created in list(self.created.items()):
            if self.clock() - created >= self.ttl:
                del self.created[key]
                del self.sessions[key]
                self.proposals.pop(key, None)
        for key, (_, response, _) in list(self.cache.items()):
            if (key[0], response['conversation_id']) not in self.sessions:
                del self.cache[key]
        for principal, stamps in list(self.rates.items()):
            self.rates[principal] = [s for s in stamps if self.clock() - s < 60]
            if not self.rates[principal]:
                del self.rates[principal]

    async def _send(self, principal, request, opening_event=False):
        self._expire()
        cid = request.conversation_id
        if cid and (principal, cid) not in self.sessions:
            return self.release(code='not_found', http_status=404)
        key = (principal, cid, request.client_message_id)
        digest = hashlib.sha256(json.dumps({**request.model_dump(),'opening_event':opening_event}, sort_keys=True).encode()).hexdigest()
        if key in self.cache:
            previous_digest, response, status = self.cache[key]
            if previous_digest != digest:
                return self.release(code='conflict', http_status=409)
            return self.release(code='cache', cached=response, http_status=status)
        if len(self.rates.get(principal, [])) >= self.requests_per_minute:
            return self.release(code='limit', conversation_id=cid, http_status=429)
        if cid is None:
            if len(self.sessions) >= self.max_sessions or sum(p == principal for p, _ in self.sessions) >= 5:
                return self.release(code='limit', http_status=429)
            cid = str(uuid4())
            opening=self.principal_opening_builder(principal) if self.principal_opening_builder and not opening_event else None
            self.sessions[(principal, cid)] = [{'role':'model','text':opening}] if opening else []
            self.created[(principal, cid)] = self.clock()
        history = self.sessions[(principal, cid)]
        if len(history) >= self.max_turns * 2:
            return self.release(code='limit', conversation_id=cid, http_status=429)
        message = minimize(request.message)
        stamps = self.rates.setdefault(principal, [])
        stamps.append(self.clock())
        try:
            result = await asyncio.wait_for(self._pipeline(message, history[-12:], cid, (principal, cid), opening_event=opening_event), self.timeout)
        except (Exception, asyncio.CancelledError) as error:
            import logging
            logging.getLogger(__name__).warning('conversation_failure type=%s code=%s', type(error).__name__, getattr(error, 'code', None))
            # Cache uncertain outcome. No automatic regeneration/double billing.
            self.audit.append({'event': 'provider_failure'})
            result = self.release(code='technical', conversation_id=cid, http_status=503)
        if not opening_event:history.append({'role':'user','text':message})
        history.append({'role':'model','text':result[0]['reply']})
        self.cache[key] = (digest, deepcopy(result[0]), result[1])
        return result

    async def _pipeline(self, message, history, cid, session_key=None, opening_event=False):
        if self.gateway is None:
            return self.release(code='demo', conversation_id=cid, http_status=200)
        pending = self.proposals.pop(session_key, None)
        decision = GuardDecisionV1.model_validate(await self.gateway.input_guard(message, history))
        self.audit.append({'event': 'input_guard', 'decision': decision.decision})
        counter_speech = equality_draft(message, {'sources': []})
        if decision.decision == 'deny' and (counter_speech is None or 'privacy' in decision.reason_codes):
            return self.release(code='denied', conversation_id=cid, http_status=200)
        if decision.decision == 'clarify' and counter_speech is None:
            return self.release(code='clarify', conversation_id=cid, http_status=200)
        if decision.decision not in ('allow', 'constrain', 'deny', 'clarify'):
            raise ValueError('Invalid input decision')
        context = self.principal_context_builder(session_key[0]) if self.principal_context_builder and session_key else self.context_builder()
        counter_speech = equality_draft(message, context) if counter_speech else None
        context['user_reported_history'] = deepcopy(history)
        context['opening_event']=opening_event
        if opening_event:context.pop('guided_opening',None)
        user_statements=[h['text'] for h in history if h['role']=='user']+([] if opening_event else [message])
        context['user_statements']=[{'id':i+1,'text':text} for i,text in enumerate(user_statements)]
        next_proposal = None
        next_case = None
        if counter_speech is not None:
            draft = counter_speech
        elif pending and projection.is_confirmation(message):
            result = projection.project(pending['current_spending'], pending['target_spending'])
            self.audit.append({'event': 'projection_calculated'})
            calculated = {**pending, **result}
            context['facts'].extend({'id':'PROJECTION:'+k, 'value':str(v), 'origin':'deterministic_confirmed_projection'}
                                    for k,v in calculated.items() if v is not None)
            context['projection'] = {'inputs_confirmed_by_user':pending, 'calculated':result,
                'rates_are_hypotheses':True,'rates':{'r_5':'0.05','r_8':'0.08'},'formula':'G(n)=G_atual*(1-r)^n',
                'currency':'BRL','periodicity':'monthly','commitment_saved':False}
            draft = AgentDraftV1(reply=projection.explain(pending,result), status='ok', capabilities=['orcamento'],
                claims=[Claim(kind='financial',evidence_id='PROJECTION:'+k,text=k,value=str(v))
                        for k,v in calculated.items() if v is not None and k in ('current_spending','target_spending','reference_month','n_5','n_8')], missing_data=[])
        else:
            draft = AgentDraftV1.model_validate(await self.gateway.generate(message, context, history, decision.constraints))
            if opening_event and (draft.commitment_proposal or draft.projection_proposal):
                raise ValueError('Opening cannot create proposals')
            if draft.commitment_proposal:
                from . import commitments
                from agent_backend.planning.domain import draft_for_case
                try:
                    if draft.projection_proposal:raise ValueError('Simulação e compromisso são etapas separadas.')
                    reported=[h['text'] for h in history if h['role']=='user']+[message]
                    next_case=commitments.validate_case(draft.commitment_proposal.model_dump(),reported,context.get('financial_period'))
                    state=context['goal_state']
                    if state['confirmed']:raise ValueError('Já existe uma meta aprovada. Recomece explicitamente para substituir o plano.')
                    validated_plan=draft_for_case(state['draft'],next_case)
                except (ValueError,KeyError):
                    next_case=None
                    draft=AgentDraftV1(reply='Antes de propor um compromisso, vamos entender o que cabe na sua vida. Qual mudança concreta você considera viável, sem comprometer seus gastos essenciais?',status='needs_clarification',capabilities=['orcamento'],claims=[],missing_data=['commitment_context'])
                else:
                    context['commitment_case']={'user_reported':next_case,'baseline':state['draft'],'validated_proposal':validated_plan,'awaiting_explicit_approval':True}
                    context['facts'].append({'id':'CASE:monthly_amount','value':next_case['monthly_amount'],'origin':'user_chosen_unconfirmed'})
                    draft=AgentDraftV1(reply=commitments.explain(next_case,state['draft']),status='needs_clarification',capabilities=['orcamento'],claims=[Claim(kind='financial',evidence_id='CASE:monthly_amount',text='meta mensal proposta',value=next_case['monthly_amount'])],missing_data=['commitment_approval'])
            elif draft.projection_proposal:
                try:
                    reported = [h['text'] for h in history if h['role']=='user'] + [message]
                    if context.get('financial_input_basis'):
                        reported.append(context['financial_input_basis'])
                    next_proposal = projection.validate_proposal(draft.projection_proposal.model_dump(), reported)
                except ValueError:
                    draft = AgentDraftV1(reply='Para projetar com segurança, preciso dos valores mensais comparáveis e do mês de referência, sem inventar dados. Qual informação você quer corrigir ou completar?',
                        status='needs_clarification',capabilities=['orcamento'],claims=[],missing_data=['projection_inputs'])
                else:
                    context['projection'] = {'proposal_reported_by_user':next_proposal,'awaiting_confirmation':True}
                    context['facts'].extend({'id':'PROPOSAL:'+k,'value':v,'origin':'user_reported_unconfirmed'} for k,v in next_proposal.items())
                    draft = AgentDraftV1(reply=projection.confirmation(next_proposal),status='needs_clarification',capabilities=['orcamento'],claims=[],missing_data=['confirmation'])
        if not safe_text(draft.reply) or not valid_evidence(draft, context):
            return self.release(code='technical', conversation_id=cid, http_status=503)
        check = GuardDecisionV1.model_validate(await self.gateway.output_guard(message, draft.model_dump(), context))
        self.audit.append({'event': 'output_guard', 'decision': check.decision, 'reason_codes': check.reason_codes})
        if check.decision != 'release':
            import logging
            logging.getLogger(__name__).warning('output_guard_replaced reasons=%s', check.reason_codes)
            return self.release(code='technical', conversation_id=cid, http_status=503)
        if next_proposal is not None:
            self.proposals[session_key] = next_proposal

        if next_case is not None and self.on_commitment_proposed and session_key:
            state=context['goal_state']
            self.on_commitment_proposed(session_key[0],next_case,state['planId'],state['version'])
        sources = {s['id']: s for s in context['sources']}
        citations = [dict(id=i, url=sources[i]['url'], excerpt=sources[i]['text'],
                          limitations=sources[i]['limitations'], status=sources[i]['status'])
                     for i in dict.fromkeys(c.evidence_id for c in draft.claims) if i in sources]
        return self.release(code='approved', conversation_id=cid, http_status=200, draft=draft, citations=citations)

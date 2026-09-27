"""Observed cash-flow situations and explicit goal calculations; no personality score."""
from decimal import Decimal, InvalidOperation
from datetime import datetime, timezone
from copy import deepcopy
from uuid import uuid4
import re
import json
from pathlib import Path

MONEY=('income','expenses','deliveryCurrent','deliveryTarget','shoppingCurrent','shoppingTarget','otherCut','reserveTarget')
CATEGORIES=('delivery','shopping','other','reserve')
_NOMES=json.loads((Path(__file__).with_name('nomes_por_id.json')).read_text(encoding='utf-8'))
NOMES,NOMES_SELO=_NOMES['nomes'],_NOMES['selo']  # generated names keyed by id_usuario
MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']


def dec(v):
    if isinstance(v,bool): raise ValueError('Valor monetário inválido.')
    try: d=Decimal(str(v))
    except InvalidOperation: raise ValueError('Valor monetário inválido.') from None
    if not d.is_finite() or d<0 or d>Decimal('1000000000') or d!=d.quantize(Decimal('.01')):
        raise ValueError('Use valores não negativos, com até duas casas decimais.')
    return d


def period_label(p):
    if not re.fullmatch(r'20\d\d-(0[1-9]|1[0-2])',p): raise ValueError('Mês de referência inválido.')
    y,m=map(int,p.split('-')); return f'{MONTHS[m-1]} / {y}'


def validate_plan(plan):
    if not isinstance(plan,dict) or set(plan)-set(MONEY)-{'selected','period'} or any(k not in plan for k in MONEY):
        raise ValueError('Plano incompleto ou campos não permitidos.')
    result={k:float(dec(plan[k])) for k in MONEY}
    selected=plan.get('selected')
    if not isinstance(selected,list) or len(selected)!=len(set(selected)) or any(s not in CATEGORIES for s in selected):
        raise ValueError('Categorias inválidas.')
    result['selected']=selected
    if 'period' in plan: period_label(plan['period']); result['period']=plan['period']
    return result


def totals(p):
    d={k:dec(p[k]) for k in MONEY};selected=p['selected']
    delivery=max(Decimal(0),d['deliveryCurrent']-d['deliveryTarget']) if 'delivery' in selected else Decimal(0)
    shopping=max(Decimal(0),d['shoppingCurrent']-d['shoppingTarget']) if 'shopping' in selected else Decimal(0)
    other=d['otherCut'] if 'other' in selected else Decimal(0)
    released=delivery+shopping+other; initial=d['income']-d['expenses'];available=initial+released
    reserve=d['reserveTarget'] if 'reserve' in selected else Decimal(0)
    return {k:float(v) for k,v in dict(deliveryCut=delivery,shoppingCut=shopping,otherCut=other,released=released,initial=initial,available=available,reserve=reserve,after=available-reserve).items()}


def draft_for_case(baseline,case):
    p=deepcopy(baseline);category=case['category'];amount=dec(case['monthly_amount'])
    if category not in CATEGORIES:raise ValueError('Categoria não suportada.')
    field={'delivery':'deliveryTarget','shopping':'shoppingTarget','other':'otherCut','reserve':'reserveTarget'}[category]
    p.update({field:float(amount),'selected':[category]})
    if category in ('delivery','shopping') and amount>=dec(p[category+'Current']):
        raise ValueError('O alvo de redução precisa ser menor que o gasto observado.')
    if category in ('other','reserve') and amount<=0:raise ValueError('Defina uma mudança mensal positiva.')
    remaining=dec(p['expenses'])-dec(p['deliveryCurrent'])-dec(p['shoppingCurrent'])
    if category=='other' and amount>max(Decimal(0),remaining):raise ValueError('A redução supera os outros gastos observados.')
    if category=='reserve' and amount>max(Decimal(0),dec(p['income'])-dec(p['expenses'])):
        raise ValueError('A reserva não cabe no fluxo observado. Precisamos discutir primeiro como criar espaço.')
    return validate_plan(p)


def from_snapshot(s):
    # Incoming normalized snapshot already separates inflows from recurring income.
    p=s['reference_month'];period_label(p);y,m=map(int,p.split('-'));next_period=f'{y+1}-01' if m==12 else f'{y}-{m+1:02d}'
    incoming,outgoing=dec(s['inflows']),dec(s['outflows'])
    cat={k.casefold():dec(v) for k,v in s['categories'].items()}
    delivery=sum((v for k,v in cat.items() if k in ('delivery','restaurantes','alimentação fora','alimentacao fora')),Decimal(0))
    shopping=sum((v for k,v in cat.items() if k in ('lojas e sites','compras','shopping')),Decimal(0))
    draft={ 'income':float(incoming),'expenses':float(outgoing),'deliveryCurrent':float(delivery),'deliveryTarget':float(delivery),
        'shoppingCurrent':float(shopping),'shoppingTarget':float(shopping),'otherCut':0,'reserveTarget':0,'selected':[],'period':next_period}
    # Identity is the real id_usuario (the session key). The table has no name, so the name is the one
    # generated for that id in nomes_por_id.json (owner 10:22, sealed as generated); gender is never served.
    ref=str(s['client_ref'])
    nome=NOMES.get(ref)
    person={'id':s.get('index',1),'idUsuario':ref,'nome':nome,'primeiroNome':nome,'genero':None,'nomeSelo':NOMES_SELO if nome else None,'plan':deepcopy(draft),
        'referenceLabel':period_label(p),'planPeriodLabel':period_label(next_period),'sourceAvailable':True,'sourceLabel':s['seal']['source']}
    situation='fluxo_negativo' if outgoing>incoming else 'fluxo_equilibrado' if outgoing==incoming else 'sobra_observada'
    return {'planId':str(uuid4()),'version':1,'stage':'intro','draft':draft,'confirmed':None,'confirmedAt':None,'phraseIndex':0,
        'profile':{'person':person,'referencePeriod':{'label':period_label(p),'anomes':int(p.replace('-','')),'income':float(incoming),'expenses':float(outgoing),'balance':float(incoming-outgoing),'seal':s['seal']},
                   'planPeriod':{'label':period_label(next_period),'anomes':int(next_period.replace('-',''))},'situation':situation,'arrears':None,'debt':None,'recurringIncome':None},
        'snapshot':s,'totals':totals(draft)}

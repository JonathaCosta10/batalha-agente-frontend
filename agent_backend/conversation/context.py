"""Small, explicit evidence collection; hashes prove integrity, not legal authenticity."""
import hashlib
import json
import re
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path

KNOWLEDGE = Path(__file__).parent / 'knowledge'


def financial_summary(inflows: str, outflows: str):
    if not all(isinstance(v, str) and re.fullmatch(r'\d{1,12}\.\d{2}', v) for v in (inflows, outflows)):
        raise ValueError('Use nonnegative decimal strings with two decimal places')
    return {'inflows': inflows, 'outflows': outflows,
            'cash_flow': str(Decimal(inflows) - Decimal(outflows)),
            'balance': None, 'debt': None, 'arrears': None, 'income': None}


def build_context(*, reference_date=None, demo=False):
    today = reference_date or datetime.now(timezone.utc).date()
    sources = []
    index = json.loads((KNOWLEDGE / 'indice.json').read_text())
    for record in index['documentos']:
        raw = (KNOWLEDGE / record['arquivo']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != record['sha256']:
            raise ValueError('Evidence integrity mismatch')
        doc = json.loads(raw)
        start = date.fromisoformat(record['inicio_vigencia_declarado'])
        for article in doc['artigos']:
            status = 'future' if today < start else 'current_according_to_research'
            if today >= date(2027, 7, 1):
                status = 'historical_requires_revalidation' if doc['id'] == 'RC-08-2023' else 'requires_revalidation'
            if today < date.fromisoformat(doc['identificacao']['data_ato']):
                continue
            sources.append({'id': article['id'], 'text': article['texto'], 'status': status,
                            'valid_from': start.isoformat(), 'url': doc['proveniencia']['url_registro_oficial'],
                            'limitations': doc['proveniencia']['limitacoes']})
    sources.extend(json.loads((KNOWLEDGE / 'institutional.json').read_text())['sources'])
    facts = []
    if demo:
        facts = [{'id': k, 'value': v, 'origin': 'synthetic_server_fixture', 'period': '2025-12'}
                 for k, v in financial_summary('1000.20', '1100.30').items()]
    return {'schema_version': '1.0', 'as_of': datetime.now(timezone.utc).isoformat(),
            'reference_date': today.isoformat(), 'financial_period': '2025-12' if demo else None,
            'currency': 'BRL', 'snapshot_version': 'synthetic-v1' if demo else None,
            'facts': facts, 'sources': sources,
            'missing_data': ['saldo', 'divida', 'atraso', 'renda_recorrente', 'catalogo_de_produtos'],
            'limitations': ['Base parcial; não certifica conformidade nem autenticidade legal.',
                            'PENDENTE não comprova fato institucional. Revalidar versões antes de uso material.',
                            'Nenhuma consulta bancária realizada. Relatos são informados pelo usuário, não dados bancários confirmados.']}

"""Deterministic minimization/release checks; semantic review remains mandatory.
These patterns are defense in depth, NOT a complete DLP or compliance system.
"""
import re
import unicodedata

SENSITIVE = re.compile(
    r'AIza[\w-]{20,}|(?:sk|ghp|gho)_[\w-]{16,}|Bearer\s+[\w.\-]+|'
    r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|'
    r'\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b|'
    r'\b(?:\d[ -]?){13,19}\b|'
    r'(?i:senha|password|api[_ -]?key|token)\s*[:=]\s*\S+'
)


def minimize(text):
    return SENSITIVE.sub('[DADO_REMOVIDO]', text)


def folded(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))


def safe_text(text):
    if not text.strip() or len(text) > 4000 or SENSITIVE.search(text):
        return False
    # URLs only in server-resolved citations; UI renders plain text, never HTML.
    if re.search(r'https?://|www\.|<[^>]+>|system_prompt|system_instruction|api_key|traceback|```', text, re.I):
        return False
    t = folded(text)
    if re.search(r'pre[- ]?aprovad|(?:transferencia|contratacao|pagamento)\s+(?:realizad|efetuad)|rentabilidade garantida', t):
        return False
    if re.search(r'\d[\d.,]*\s*%\s*(?:a\.?\s*[am]\.?|ao mes|ao ano)', t):
        return False
    return True


def valid_evidence(draft, context):
    evidence = {item['id']: item for item in context.get('sources', []) + context.get('facts', [])}
    for claim in draft.claims:
        item = evidence.get(claim.evidence_id)
        if not item or item.get('status') == 'pending':
            return False
        if claim.value is not None and claim.value != item.get('value'):
            return False
    return True

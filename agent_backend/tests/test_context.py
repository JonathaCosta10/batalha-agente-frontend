from datetime import date
from decimal import Decimal
import pytest


def test_context_keeps_financial_and_legal_dates_distinct_and_future_law_labelled():
    from agent_backend.conversation.context import build_context
    context = build_context(reference_date=date(2026, 9, 27), demo=True)
    assert context['reference_date'] == '2026-09-27'
    assert context['financial_period'] == '2025-12'
    sources = {s['id']: s for s in context['sources']}
    assert sources['RC-20-2026:art-1']['status'] == 'future'
    assert sources['RC-08-2023:art-3']['status'] == 'current_according_to_research'
    facts = {f['id']: f['value'] for f in context['facts']}
    assert facts['cash_flow'] == '-100.10'
    assert facts['balance'] is None and facts['arrears'] is None and facts['income'] is None
    assert 'gender' not in str(context) and 'score' not in str(context)


def test_after_amendment_requires_revalidation_not_old_consolidation():
    from agent_backend.conversation.context import build_context
    context = build_context(reference_date=date(2027, 7, 1))
    assert not context['facts']
    sources = {s['id']: s for s in context['sources']}
    assert sources['RC-08-2023:art-3']['status'] == 'historical_requires_revalidation'
    assert sources['RC-20-2026:art-1']['status'] == 'requires_revalidation'
    assert all(s['status'] != 'pending' for s in context['sources'])


def test_decimal_oracle_does_not_promote_inflows_to_income():
    from agent_backend.conversation.context import financial_summary
    facts = financial_summary('0.30', '0.20')
    assert facts['cash_flow'] == '0.10'
    assert facts['income'] is None
    with pytest.raises(ValueError):
        financial_summary(float('nan'), '1.00')

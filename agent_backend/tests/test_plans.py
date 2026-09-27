import pytest
from decimal import Decimal

SNAPSHOT={'client_ref':'synthetic-a','reference_month':'2025-11','inflows':'3000.00','outflows':'3200.00','categories':{'Delivery':'600.00','Lojas e sites':'450.00'},'seal':{'source':'TEST_FIXTURE','nature':'sintetica','measuredAt':'2026-09-27T00:00:00Z','cache':False}}


def test_plan_confirmation_persists_replays_and_isolates(tmp_path):
    from agent_backend.planning.store import PlanStore, Conflict
    from agent_backend.planning.domain import from_snapshot
    db=tmp_path/'plans.sqlite3'
    store=PlanStore(db)
    state=store.open('owner-a',from_snapshot(SNAPSHOT))
    assert state['confirmed'] is None
    plan={**state['draft'],'deliveryTarget':350,'selected':['delivery']}
    confirmed=store.confirm('owner-a','request1',state['version'],plan)
    assert confirmed['state']['confirmed']['deliveryTarget']==350
    assert confirmed['state']['totals']['released']==250
    assert confirmed['state']['totals']['initial']==-200
    assert PlanStore(db).get('owner-a')['confirmed']==plan
    assert store.get('other-owner') is None
    assert store.confirm('owner-a','request1',state['version'],plan)['replayed'] is True
    with pytest.raises(Conflict): store.confirm('owner-a','request1',state['version'],{**plan,'deliveryTarget':300})


def test_segmentation_is_explicit_situation_not_gender_or_credit():
    from agent_backend.planning.domain import from_snapshot
    result=from_snapshot(SNAPSHOT)
    assert result['profile']['situation']=='fluxo_negativo'
    assert result['profile']['arrears'] is None
    assert result['profile']['person']['genero'] is None  # no gender source in the table: absent, not a sentinel
    assert result['profile']['referencePeriod']['anomes']==202511
    assert result['profile']['planPeriod']['anomes']==202512
    assert result['draft']['selected']==[]
    assert result['draft']['deliveryTarget']==600  # no involuntary imposed reduction


@pytest.mark.parametrize('value',[-1, float('nan'),float('inf'),1.234])
def test_invalid_money_cannot_be_saved(value):
    from agent_backend.planning.domain import validate_plan
    with pytest.raises(ValueError): validate_plan({'deliveryTarget':value})


def test_confirm_rejects_client_change_of_observed_baseline(tmp_path):
    from agent_backend.planning.store import PlanStore
    from agent_backend.planning.domain import from_snapshot
    store=PlanStore(tmp_path/'plans.db'); s=store.open('a',from_snapshot(SNAPSHOT))
    with pytest.raises(ValueError): store.confirm('a','r',s['version'],{**s['draft'],'income':99999,'selected':['delivery']})


def test_consent_is_separate_from_projection(tmp_path):
    from agent_backend.planning.store import PlanStore
    from agent_backend.planning.domain import from_snapshot
    store=PlanStore(tmp_path/'plans.db');s=store.open('a',from_snapshot(SNAPSHOT))
    changed=store.adjust('a',s['version'],{'deliveryTarget':350,'selected':['delivery']})
    assert changed['stage']=='confirm' and changed['confirmed'] is None

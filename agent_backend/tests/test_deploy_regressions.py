import pytest

def test_guard_policy_version_is_server_owned_not_generated():
 from agent_backend.conversation.schemas import GuardJudgment,GuardDecisionV1
 wire=GuardJudgment.model_json_schema()
 assert 'policy_version' not in wire['properties']
 judgment=GuardJudgment.model_validate({'decision':'release','reason_codes':[],'constraints':[]})
 full=GuardDecisionV1(**judgment.model_dump(),policy_version='1.0')
 assert full.policy_version=='1.0'
 with pytest.raises(ValueError):GuardJudgment.model_validate({'decision':'release','reason_codes':[],'constraints':[],'policy_version':'anything'})

def test_old_confirmation_does_not_restore_reset_plan(tmp_path):
 from .test_plans import SNAPSHOT
 from agent_backend.planning.domain import from_snapshot
 from agent_backend.planning.store import PlanStore,Conflict
 store=PlanStore(tmp_path/'state.db');s=store.open('a',from_snapshot(SNAPSHOT));p={**s['draft'],'shoppingTarget':300,'selected':['shopping']}
 store.confirm('a','old',s['version'],p);store.reset('a')
 with pytest.raises(Conflict):store.confirm('a','old',s['version'],p)
 assert store.get('a')['confirmed'] is None

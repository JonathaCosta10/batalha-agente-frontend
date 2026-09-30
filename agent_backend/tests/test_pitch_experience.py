import asyncio
from .test_service import FakeGateway,payload
from agent_backend.conversation.service import ConversationService


def test_generated_opening_is_cached_and_never_counts_as_user_intent():
 g=FakeGateway('Vamos entender as compras desse período. Houve alguma compra pontual?')
 svc=ConversationService(gateway=g)
 r,status=asyncio.run(svc.start('a','open-test'))
 assert status==200
 assert svc.sessions[('a',r['conversation_id'])]==[{'role':'model','text':r['reply']}]
 generated=next(c for c in g.calls if c[0]=='generate')
 assert generated[1]['opening_event'] is True
 assert generated[1]['user_statements']==[]
 assert generated[1]['user_reported_history']==[]
 before=len(g.calls)
 again,status=asyncio.run(svc.start('a','open-test'))
 assert again['message_id']==r['message_id'] and len(g.calls)==before
 assert asyncio.run(svc.send('b',payload(cid=r['conversation_id'])))[1]==404


def test_demo_names_are_stable_unique_and_not_financial_features():
 from agent_backend.planning.names import demo_name
 names=[demo_name(i) for i in range(1,1001)]
 assert len(set(names))==1000
 assert all('Pessoa' not in n and not any(c.isdigit() for c in n) for n in names)
 assert demo_name(12)==names[11]

import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEMO_SEAL, isDemoReply } from './demoReply';
import { MessageItem } from '../components/chat/MessageItem';

const FIXED='Demonstração local: esta resposta é fixa, não foi gerada por IA.';

test('demo reply is detected by session mode, reply mode/status/codigo or the fixed backend text',()=>{
  assert.equal(isDemoReply({reply:'Olá'},'demo'),true);
  assert.equal(isDemoReply({reply:'Olá',mode:'demo'},'demo_live'),true);
  assert.equal(isDemoReply({reply:'Olá',status:'demo'}),true);
  assert.equal(isDemoReply({reply:FIXED,status:'ok'},'demo_live'),true);
  // Negative proof: a live reply is not sealed.
  assert.equal(isDemoReply({reply:'Em dezembro suas saídas foram R$ 9.273,27.',status:'ok'},'demo_live'),false);
  assert.equal(isDemoReply(null,null),false);
});

test('a demo bot message shows the seal; a normal one does not',()=>{
  const demo=renderToStaticMarkup(createElement(MessageItem,{message:{id:'1',by:'bot',text:FIXED,demo:true}}));
  assert.ok(demo.includes(DEMO_SEAL));assert.ok(demo.includes('seal-demo-reply'));
  const live=renderToStaticMarkup(createElement(MessageItem,{message:{id:'2',by:'bot',text:'Olá'}}));
  assert.ok(!live.includes(DEMO_SEAL));
});

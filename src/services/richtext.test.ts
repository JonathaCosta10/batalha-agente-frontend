import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBlocks} from '../components/chat/RichText';

test('model markdown becomes paragraphs and lists',()=>{
 const b=parseBlocks(['Boa pergunta!','','**Sobras:**','- reserve 10%','- quite dívidas','1. primeiro','2. segundo'].join('\n'));
 assert.deepEqual(b.map(x=>x.kind),['p','p','ul','ol']);
 assert.deepEqual(b[2].lines,['reserve 10%','quite dívidas']);
});

test('negative: plain text stays one paragraph and markup is kept as text, not parsed as HTML',()=>{
 const b=parseBlocks('<b>oi</b> tudo bem');
 assert.equal(b.length,1);assert.equal(b[0].kind,'p');assert.equal(b[0].lines[0],'<b>oi</b> tudo bem');
});

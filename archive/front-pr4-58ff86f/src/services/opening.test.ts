import test from 'node:test';
import assert from 'node:assert/strict';
import {openingReply} from './backend';

test('first message uses server-grounded observation and directed question',()=>{
 const message='Em novembro de 2025, suas saídas ficaram R$ 200,00 acima das entradas. Esse gasto foi de rotina ou excepcional?';
 assert.equal(openingReply({opening:{message,phase:'understand_spending'}}),message);
});
test('missing source never creates a financial diagnosis or an open-ended goal question',()=>{
 const message=openingReply({});
 assert.ok(!message.includes('acima')&&!message.includes('R$'));
 assert.ok(!message.includes('gostaria de'));
 assert.ok(message.includes('dados'));
});

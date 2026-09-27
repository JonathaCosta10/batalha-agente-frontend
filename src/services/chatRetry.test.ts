import test from 'node:test';
import assert from 'node:assert/strict';
import { retryMessageId, autoRetryDelayMs } from './chatRetry';

test('a message the server answered with 503 is resent with a new client_message_id (the backend caches the failure)',()=>{
 assert.equal(retryMessageId({status:503},'m1',()=> 'm2'),'m2');
 assert.equal(retryMessageId({status:429},'m1',()=> 'm2'),'m2');
});

test('negative: without an answer (timeout/network) the same id is kept, so a finished reply comes back from the cache',()=>{
 assert.equal(retryMessageId({status:0},'m1',()=> 'm2'),'m1');
 assert.equal(retryMessageId({status:-1},'m1',()=> 'm2'),'m1');
});

test('busy with a short Retry-After retries once, after the wait the server asked for',()=>{
 assert.equal(autoRetryDelayMs({kind:'busy',retryAfterS:10},false),10000);
 assert.equal(autoRetryDelayMs({kind:'busy',retryAfterS:null},false),5000);
});

test('negative: no automatic resend twice, for long waits, or for refusals',()=>{
 assert.equal(autoRetryDelayMs({kind:'busy',retryAfterS:10},true),null);
 assert.equal(autoRetryDelayMs({kind:'busy',retryAfterS:300},false),null);
 assert.equal(autoRetryDelayMs({kind:'refused',retryAfterS:null},false),null);
});

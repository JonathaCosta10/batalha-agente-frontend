import test from 'node:test';
import assert from 'node:assert/strict';
import { chatView } from './chatView';

const base={stage:'intro' as const,openingWaiting:false,typing:false,revealing:false,hasError:false};

test('negative: before the "i agora" click the opening sentence is not shown, even when it already loaded',()=>{
 const v=chatView(base);
 assert.equal(v.showMessages,false);
 assert.equal(v.panel,'actions');
 assert.equal(v.composerLocked,true);
});

test('after the click: loading panel while the opening is not ready',()=>{
 assert.deepEqual(chatView({...base,stage:'invite',openingWaiting:true}),{showMessages:false,panel:'opening',composerLocked:true});
});

test('after the click with the opening ready: short typing, then the sentence and the composer are released',()=>{
 assert.deepEqual(chatView({...base,stage:'invite',revealing:true}),{showMessages:false,panel:'typing',composerLocked:true});
 assert.deepEqual(chatView({...base,stage:'invite'}),{showMessages:true,panel:'actions',composerLocked:false});
});

test('a chat failure after release shows the error panel with the messages',()=>{
 assert.deepEqual(chatView({...base,stage:'invite',hasError:true}),{showMessages:true,panel:'error',composerLocked:false});
});

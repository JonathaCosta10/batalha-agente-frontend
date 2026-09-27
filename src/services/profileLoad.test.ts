import test from 'node:test';
import assert from 'node:assert/strict';
import {Backend,ApiError} from './backend';
import {PROFILE_TIMEOUT_MS,loadingText,sealLabel} from './profileLoad';

test('timer text counts whole elapsed seconds and never goes negative',()=>{
 assert.equal(loadingText(0),'Carregando os registros do perfil de demonstração… 0s');
 assert.equal(loadingText(5.9),'Carregando os registros do perfil de demonstração… 5s');
 assert.equal(loadingText(-1),'Carregando os registros do perfil de demonstração… 0s');
});

test('seal shows source and date, and says NAO_MEDIDO when the date is missing',()=>{
 assert.equal(sealLabel({source:'proj.ds.transacoes',measuredAt:'2026-09-27T15:00:00Z'}),'proj.ds.transacoes · 27/09/2026');
 assert.equal(sealLabel({source:'proj.ds.transacoes'}),'proj.ds.transacoes · data NAO_MEDIDO');
 assert.equal(sealLabel(null),'');
});

test('profile call is aborted at the profile timeout and reported as NAO_MEDIDO, not as data',async()=>{
 let seen:AbortSignal|undefined;
 const hanging=((_:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_r,reject)=>{seen=init?.signal||undefined;init?.signal?.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));})) as typeof fetch;
 const api=new Backend(hanging,()=> '',5);
 await assert.rejects(()=>api.profile(),(e:unknown)=> e instanceof ApiError && e.status===0 && e.message.includes('NAO_MEDIDO'));
 assert.equal(seen?.aborted,true);
 assert.equal(PROFILE_TIMEOUT_MS,20000);
});

test('other calls keep the long timeout, so a slow chat reply is not cut at 20 s',async()=>{
 let aborted=false;
 const slow=((_:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>(resolve=>{init?.signal?.addEventListener('abort',()=>{aborted=true;});setTimeout(()=>resolve(new Response('{"state":null}',{status:200})),20);})) as typeof fetch;
 const api=new Backend(slow,()=> '',5);
 await api.state();
 assert.equal(aborted,false);
});

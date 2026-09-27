import test from 'node:test';
import assert from 'node:assert/strict';
import {Backend,ApiError} from './backend';

test('confirmation sends stable id, cookie identity and CSRF, not a customer ID',async()=>{
 const calls:Array<{url:string;init:RequestInit}>=[];
 const transport=(async(url:RequestInfo|URL,init?:RequestInit)=>{calls.push({url:String(url),init:init||{}});return new Response(JSON.stringify({state:{},replayed:false}),{status:201});}) as typeof fetch;
 const api=new Backend(transport,()=> 'csrftoken=testcsrf');
 await api.confirm(4,{} as never,'fixed-id');await api.confirm(4,{} as never,'fixed-id');
 assert.equal(calls[0].init.body,calls[1].init.body);
 assert.equal(calls[0].init.credentials,'same-origin');
 assert.equal((calls[0].init.headers as Record<string,string>)['X-CSRFToken'],'testcsrf');
 assert.ok(!String(calls[0].init.body).includes('customer_id'));
});

test('source failure is not replaced by invented demo values',async()=>{
 const api=new Backend((async()=>new Response(JSON.stringify({erro:'Fonte indisponível'}),{status:503})) as typeof fetch,()=> '');
 await assert.rejects(()=>api.profile(),(e:unknown)=> e instanceof ApiError && e.status===503);
});

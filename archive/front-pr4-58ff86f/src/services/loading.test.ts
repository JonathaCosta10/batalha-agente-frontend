import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiError} from './backend';
import {isAuthError,isCompleteProfile,PROFILE_LOADING} from '../hooks/usePlanConversation';

const complete={draft:{},profile:{person:{id:1},referencePeriod:{label:'Dezembro / 2025'},situation:'fluxo_negativo'}} as never;

test('complete profile is accepted',()=>{assert.equal(isCompleteProfile(complete),true);});

test('incomplete profile is rejected, never shown as loaded',()=>{
 assert.equal(isCompleteProfile(null),false);
 assert.equal(isCompleteProfile({} as never),false);
 assert.equal(isCompleteProfile({...(complete as object),profile:{person:{id:1},referencePeriod:{label:''},situation:'x'}} as never),false);
 assert.equal(isCompleteProfile({...(complete as object),draft:undefined} as never),false);
});

test('refresh button is reserved for auth failures',()=>{
 assert.equal(isAuthError(new ApiError('x',401)),true);
 assert.equal(isAuthError(new ApiError('x',403)),true);
 assert.equal(isAuthError(new ApiError('x',503)),false);
 assert.equal(isAuthError(new Error('network')),false);
});

test('loader never flashes and gives up after bounded retries',()=>{
 assert.ok(PROFILE_LOADING.minVisibleMs>0&&PROFILE_LOADING.slowAfterMs>PROFILE_LOADING.minVisibleMs);
 assert.ok(PROFILE_LOADING.retryDelaysMs.length<=3);
});

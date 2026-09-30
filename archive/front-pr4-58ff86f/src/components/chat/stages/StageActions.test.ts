import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {StageActions} from './StageActions';
import type {Saved} from '../../../types';
const plan={income:3000,expenses:3200,deliveryCurrent:600,deliveryTarget:600,shoppingCurrent:450,shoppingTarget:450,otherCut:0,reserveTarget:0,selected:[]};
const saved={person:{id:1,nome:'Teste',primeiroNome:'Teste',genero:'NAO_INFORMADO',plan},stage:'confirm',draft:plan,confirmed:null,messages:[],phraseIndex:0} as Saved;
const noop=()=>{};
const handlers={onEnterAgora:noop,onStartCommitments:noop,onAssume:noop,onAdjust:noop,onDraft:noop,onSaveCard:noop,onNextPhrase:noop,onBackHome:noop};
test('legacy confirm stage without conversational case does not show approval',()=>{
 const html=renderToStaticMarkup(React.createElement(StageActions,{saved,exporting:false,handlers}));
 assert.ok(!html.includes('button-assume-commitments'));
});
test('starting dialogue has no shortcut to an empty goal form',()=>{
 const html=renderToStaticMarkup(React.createElement(StageActions,{saved:{...saved,stage:'invite'},exporting:false,handlers}));
 assert.ok(!html.includes('button-start-plan'));
 assert.ok(!html.includes('button-assume-commitments'));
});

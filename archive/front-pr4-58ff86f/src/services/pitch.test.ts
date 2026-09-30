import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TypingIndicator} from '../components/chat/TypingIndicator';
import {DemoDisclosure} from '../components/ui/DemoDisclosure';

test('pending analysis explains what is happening',()=>{
 const html=renderToStaticMarkup(React.createElement(TypingIndicator,{label:'Analisando os movimentos de Marina…'}));
 assert.ok(html.includes('Analisando os movimentos de Marina'));
 assert.ok(html.includes('role="status"'));
});
test('disclosure remains available as a discreet footer',()=>{
 const html=renderToStaticMarkup(React.createElement(DemoDisclosure));
 assert.ok(html.includes('footer-caption'));
 assert.ok(html.includes('nomes ilustrativos'));
 assert.ok(!html.includes('class="notice"'));
});

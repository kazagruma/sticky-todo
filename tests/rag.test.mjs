import test from 'node:test';
import assert from 'node:assert/strict';
import {cosine,evidence} from '../rag.mjs';
test('意味検索のベクトル距離計算',()=>{assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);});
test('存在しない資料と捏造引用を拒否する',()=>{
 const sources=[{id:'demo#1',source:'demo.md',text:'Web版は端末内のブラウザ保存領域に保存します。',score:1}];
 assert.throws(()=>evidence([{text:'回答',sourceId:'unknown',quote:'ブラウザ保存領域'}],sources),/invalid_evidence/);
 assert.throws(()=>evidence([{text:'回答',sourceId:'demo#1',quote:'サーバーに全件を保存します'}],sources),/invalid_evidence/);
 assert.equal(evidence([{text:'回答',sourceId:'demo#1',quote:'端末内のブラウザ保存領域'}],sources)[0].quote,sources[0].text);
});

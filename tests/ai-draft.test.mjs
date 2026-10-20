import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../ai-server.mjs';
const input={text:'ダミーの作業',categories:['ウェブ']};
test('不正な入力はAPI呼び出し前に拒否',async()=>{
  const original=global.fetch;
  global.fetch=()=>{throw new Error('unexpected API call');};
  try{await assert.rejects(generate({text:'',categories:['ウェブ']}),/invalid_input/);}finally{global.fetch=original;}
});
test('構造化出力を検証し、実在しない日付を拒否',async()=>{
  const original=global.fetch;
  process.env.OPENAI_API_KEY='test-only';
  let draft={title:'テスト',body:'',category:'ウェブ',dueDate:null,priority:'並'};
  global.fetch=async()=>({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(draft)}]}]})});
  try{assert.deepEqual(await generate(input),{...draft,body:input.text});draft={...draft,dueDate:'2026-02-30'};await assert.rejects(generate(input),/invalid_output/);}finally{global.fetch=original;}
});
test('残高不足を一時的な回数制限と区別',async()=>{
  const original=global.fetch;
  global.fetch=async()=>({ok:false,status:429,json:async()=>({error:{code:'credit_balance_exhausted',type:'insufficient_quota'}})});
  try{await assert.rejects(generate(input),/insufficient_quota/);}finally{global.fetch=original;}
});

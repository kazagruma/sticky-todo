import { useState } from 'react';
import type { TaskDraft } from './types';
export default function AIEntry(){
  const [open,setOpen]=useState(false),[text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [draft,setDraft]=useState<TaskDraft|null>(null);
  const generate=async()=>{setBusy(true);setError('');setDraft(null);try{
    const categories=Array.from(document.querySelectorAll('.lane-name')).map(x=>x.textContent||'').filter(Boolean);
    if(!categories.length)throw new Error('ボードを開いてから利用してください。');
    const r=await fetch('/api/ai/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,categories}),signal:AbortSignal.timeout(35000)});
    const data=await r.json();if(!r.ok)throw new Error(data.error||'生成できませんでした。');setDraft(data.draft);
  }catch(e){setError(e instanceof Error?e.message:'生成できませんでした。');}finally{setBusy(false);}};
  return <><button className="primary" style={{position:'fixed',right:24,bottom:24,zIndex:20}} onClick={()=>setOpen(true)}>AIで付箋の下書き</button>{open&&<div className="modal-backdrop"><section className="editor"><h2>AIで付箋の下書き</h2><p>入力文とカテゴリ名をOpenAIへ送信します。結果を確認・編集してから保存してください。</p><textarea aria-label="AIへ送る文章" maxLength={2000} value={text} onChange={e=>{setText(e.target.value);setDraft(null);}} placeholder="2026年10月20日までにウェブのトップページを修正。優先度は急。"/><button disabled={busy||!text.trim()} onClick={generate}>{busy?'下書き作成中…':'下書きを作る'}</button>{error&&<p role="alert">{error}</p>}{draft&&<><h3>構造化された下書き（JSON）</h3><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(draft,null,2)}</pre><button className="primary" onClick={()=>{window.dispatchEvent(new CustomEvent('ai-todo-draft',{detail:draft}));setOpen(false);setDraft(null);}}>確認して編集画面へ</button></>}<button disabled={busy} onClick={()=>setOpen(false)}>閉じる</button></section></div>}</>;
}

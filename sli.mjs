import { performance } from 'node:perf_hooks';
import { mkdir, appendFile, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function summarize(rows) {
  const success = rows.filter(r => r.ok).length;
  const durations = rows.map(r => r.durationMs).sort((a,b) => a-b);
  return { samples: rows.length, success, failures: rows.length-success,
    availability: rows.length ? success / rows.length * 100 : null,
    p95Ms: rows.length ? durations[Math.ceil(rows.length*.95)-1] : null };
}
export async function probe(url, fetcher=fetch) {
  const start=performance.now(); let status=null, reason=null, ok=false;
  try {
    const r=await fetcher(url,{signal:AbortSignal.timeout(10000),redirect:'error',cache:'no-store'});
    status=r.status; const body=await r.text();
    ok=status===200 && body.includes('Sticky ToDo');
    if(!ok)reason=status!==200?'http_status':'missing_app_marker';
  } catch(e) { reason=e.name==='TimeoutError'?'timeout':'network_error'; }
  return { at:new Date().toISOString(),status,ok,reason,durationMs:Math.round((performance.now()-start)*100)/100 };
}
export function report(rows) {
 const s=summarize(rows), pct=s.availability===null?'未計測':s.availability.toFixed(2)+'%';
 return `<!doctype html><html lang="ja"><meta charset="utf-8"><title>Sticky ToDo SLI</title><style>body{font:18px system-ui;background:#f2f7f5;color:#153c32;margin:40px}main{max-width:1100px;margin:auto}section{background:white;padding:24px;margin:20px 0;border-radius:16px}h1{font-size:32px}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}.big{font-size:36px;font-weight:bold}</style><main><h1>Sticky ToDo｜信頼性の計測</h1><section><h2>SLO（提案）</h2>30日間の観測成功率99.5%以上／成功応答の95%以上が2秒以内<p>15分間隔の観測。欠測は成功扱いせず、別途調査。時間稼働率や保存機能の正常性を保証する指標ではありません。</p></section><section><h2>SLI（今回の観測）</h2><div class="big">成功率 ${pct}</div><p>${s.samples}回中 ${s.success}回成功・${s.failures}回失敗／全観測のp95 ${s.p95Ms??'—'} ms</p><p>短時間の疎通確認です。30日SLOの達成判定には使えません。</p></section><section><h2>観測ログ（最新20件・JST）</h2><table><tr><th>日時</th><th>HTTP</th><th>結果</th><th>応答ms</th></tr>${rows.slice(-20).map(r=>`<tr><td>${new Date(r.at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}</td><td>${Number.isInteger(r.status)?r.status:'—'}</td><td>${r.ok?'成功':r.reason==='timeout'?'タイムアウト':r.reason==='http_status'?'HTTPエラー':r.reason==='missing_app_marker'?'内容不一致':'通信失敗'}</td><td>${Number(r.durationMs)}</td></tr>`).join('')}</table></section><section><h2>運用ルール</h2>2回連続失敗なら別回線・ブラウザで再確認→Actions・Cloudflareの状態と直近デプロイを確認。直近変更が原因なら承認のうえ既知の正常版へ戻す。修復後は3回連続成功を確認し記録。<p>直近24時間で失敗率0.5%超、または成功応答の5%超が2秒超なら調査開始。通知連携は既存Actionsを利用し、通知到達は別途確認が必要です。</p></section></main></html>`;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const count=Number(process.argv[2]||3);if(!Number.isInteger(count)||count<1||count>10)throw Error('count must be 1..10');
 const dir=new URL('.sli-output/',import.meta.url);await mkdir(dir,{recursive:true});
 for(let i=0;i<count;i++){const row=await probe('https://sticky-todo.pages.dev/');await appendFile(new URL('observations.jsonl',dir),JSON.stringify(row)+'\n');console.log(JSON.stringify(row));}
 const rows=(await readFile(new URL('observations.jsonl',dir),'utf8')).trim().split('\n').map(JSON.parse).filter(r=>Date.parse(r.at)>=Date.now()-30*86400000);
 await writeFile(new URL('report.html',dir),report(rows));console.log(JSON.stringify(summarize(rows)));
}

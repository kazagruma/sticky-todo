import {createServer} from 'node:http';
import {answer} from './rag.mjs';
try{process.loadEnvFile(new URL('.env.local',import.meta.url));}catch{}
let busy=false,attempts=[];
createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(req.url!=='/api/ai/rag')return reply(404,{error:'not_found'});
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(req.headers.origin&&!['http://127.0.0.1:1420','http://localhost:1420'].includes(req.headers.origin))return reply(403,{error:'origin_not_allowed'});
 if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'json_required'});
 attempts=attempts.filter(t=>Date.now()-t<60000);if(busy||attempts.length>=5)return reply(429,{error:'少し待って再試行してください。'});busy=true;attempts.push(Date.now());
 try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>10000){reply(413,{error:'入力が大きすぎます。'});return;}chunks.push(c);}const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));reply(200,await answer(input.question));}
 catch(e){console.error('RAG failed:',/^provider_\d+$|^invalid_evidence$|^insufficient_quota$/.test(e.message)?e.message:e.name);reply(502,{error:e.message==='insufficient_quota'?'API残高が不足しています。':e.message==='provider_401'?'APIキーが失効している可能性があります。':'根拠つき回答を作成できませんでした。入力・資料・API設定を確認してください。'});}finally{busy=false;}
}).listen(4176,'127.0.0.1',()=>console.log('Sticky ToDo local RAG: http://127.0.0.1:4176'));

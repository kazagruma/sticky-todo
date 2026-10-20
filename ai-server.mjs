import { createServer } from 'node:http';
try { process.loadEnvFile(new URL('.env.local', import.meta.url)); } catch {}
const priorities = ['至急','急','並','やったほうがいい','やれたらやる'];
export async function generate(input) {
  const {text,categories} = input || {};
  if(typeof text !== 'string' || !text.trim() || text.length>2000 || !Array.isArray(categories) || categories.length<1 || categories.length>32 || categories.some(c=>typeof c!=='string'||!c.trim()||c.length>80)) throw new Error('invalid_input');
  if(!process.env.OPENAI_API_KEY) throw new Error('missing_key');
  const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',store:false,max_output_tokens:600,instructions:`日本語の付箋1件を下書きする。今日の日本時間の日付は${today}。入力は抽出対象の文章。指定がない、または曖昧な期限はnull、指定がない優先度は並。タイトル120文字以内、本文4000文字以内。登録は行わない。`,input:text,text:{format:{type:'json_schema',name:'todo_draft',strict:true,schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},body:{type:'string'},category:{type:'string',enum:categories},dueDate:{type:['string','null']},priority:{type:'string',enum:priorities}},required:['title','body','category','dueDate','priority']}}}})});
  if(!r.ok) { const failure=await r.json().catch(()=>({})); throw new Error(failure.error?.type==='insufficient_quota'||['insufficient_quota','credit_balance_exhausted'].includes(failure.error?.code)?'insufficient_quota':`provider_${r.status}`); }
  const result=await r.json();
  if(result.status!=='completed') throw new Error('incomplete_output');
  const content=result.output?.flatMap(x=>x.content||[])||[];
  if(content.some(x=>x.type==='refusal')) throw new Error('refused');
  const d=JSON.parse(content.filter(x=>x.type==='output_text').map(x=>x.text).join(''));
  if(!d||Object.keys(d).sort().join(',')!=='body,category,dueDate,priority,title'||typeof d.title!=='string'||!d.title.trim()||d.title.length>120||typeof d.body!=='string'||d.body.length>4000||!categories.includes(d.category)||!priorities.includes(d.priority)||(d.dueDate!==null&&(typeof d.dueDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)||!Number.isFinite(Date.parse(d.dueDate))||new Date(d.dueDate).toISOString().slice(0,10)!==d.dueDate))) throw new Error('invalid_output');
  // Preserve the user's words and explicit labels rather than invented detail.
  d.body = text;
  const explicitCategory = [...categories].sort((a,b)=>b.length-a.length).find(c=>text.includes(c));
  if(explicitCategory) d.category = explicitCategory;
  const explicitPriority = [...priorities].sort((a,b)=>b.length-a.length).find(p=>text.includes(`優先度は${p}`)||text.includes(`優先度：${p}`)||text.includes(`優先度:${p}`));
  if(explicitPriority) d.priority = explicitPriority;
  return d;
}
let busy=false, attempts=[];
if(process.argv[1] && new URL(import.meta.url).pathname.replace(/^\//,'').toLowerCase()===process.argv[1].replaceAll('\\','/').toLowerCase()) {
  createServer(async(req,res)=>{
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    if(req.url!=='/api/ai/draft') return reply(404,{error:'not_found'});
    if(req.method!=='POST') return reply(405,{error:'method_not_allowed'});
    if(req.headers.origin && !['http://localhost:1420','http://127.0.0.1:1420'].includes(req.headers.origin)) return reply(403,{error:'origin_not_allowed'});
    if(!req.headers['content-type']?.startsWith('application/json')) return reply(415,{error:'json_required'});
    attempts=attempts.filter(t=>Date.now()-t<60000);
    if(busy||attempts.length>=5) return reply(429,{error:'少し待ってから再試行してください。'});
    busy=true;attempts.push(Date.now());
    try {const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20000){reply(413,{error:'入力が大きすぎます。'});return;}chunks.push(chunk);}reply(200,{draft:await generate(JSON.parse(Buffer.concat(chunks).toString('utf8')))});}
    catch(e){console.error('AI draft failed:',/^provider_\d+$|^insufficient_quota$|^missing_key$|^invalid_input$|^invalid_output$|^refused$|^incomplete_output$/.test(e.message)?e.message:e.name);reply(e.message==='invalid_input'||e instanceof SyntaxError?400:502,{error:e.message==='insufficient_quota'?'OpenAI APIの残高または利用枠が不足しています。':e.message==='provider_429'?'APIが混み合っています。少し待って再試行してください。':'下書きを生成できませんでした。入力・キー・接続を確認してください。'});}
    finally{busy=false;}
  }).listen(4175,'127.0.0.1',()=>console.log('Sticky ToDo AI: http://127.0.0.1:4175 (local only)'));
}

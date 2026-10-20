import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

// Deliberate allowlist: never serialize requests, URLs, headers or bodies.
export function auditEvent({ requestId, method, status, elapsed, completed }) {
  return { event:'http_request', at:new Date().toISOString(), requestId,
    actor:'unauthenticated', method:['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(method)?method:'OTHER',
    status:Number.isInteger(status)&&status>=100&&status<=599?status:null,
    durationMs:Math.max(0,Math.round(elapsed*100)/100), outcome:completed?'completed':'aborted' };
}
export function attachAudit(request,response,sink=line=>console.log(line)) {
  const requestId=randomUUID(), started=performance.now();let emitted=false;
  response.setHeader('X-Request-ID',requestId);
  const emit=completed=>{if(emitted)return;emitted=true;sink(JSON.stringify(auditEvent({requestId,method:request.method,status:completed?response.statusCode:null,elapsed:performance.now()-started,completed})));};
  response.once('finish',()=>emit(true));response.once('close',()=>emit(false));
  return requestId;
}

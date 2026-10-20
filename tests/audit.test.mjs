import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {attachAudit,auditEvent} from '../audit.mjs';
test('audit fields do not include request secrets or spoofed identity',()=>{
 const row=auditEvent({requestId:'server-id',method:'GET\nforged',status:200,elapsed:2,completed:true,authorization:'secret',body:'private',actor:'admin'});
 assert.equal(row.actor,'unauthenticated');assert.equal(row.method,'OTHER');assert.ok(!JSON.stringify(row).includes('secret'));assert.ok(!JSON.stringify(row).includes('private'));
});
test('server assigns id; finish plus close emits only once',()=>{
 const response=new EventEmitter(),headers={};response.statusCode=400;response.setHeader=(k,v)=>headers[k]=v;const logs=[];
 const id=attachAudit({method:'GET',url:'/?token=secret',headers:{authorization:'secret','x-request-id':'forged'}},response,x=>logs.push(x));
 response.emit('finish');response.emit('close');assert.equal(logs.length,1);assert.equal(headers['X-Request-ID'],id);assert.notEqual(id,'forged');assert.equal(JSON.parse(logs[0]).status,400);assert.ok(!logs[0].includes('secret'));
});
test('aborted request not recorded as success',()=>{const response=new EventEmitter();response.setHeader=()=>{};const logs=[];attachAudit({method:'GET'},response,x=>logs.push(JSON.parse(x)));response.emit('close');assert.equal(logs[0].outcome,'aborted');assert.equal(logs[0].status,null);});

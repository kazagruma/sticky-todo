import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probe,summarize,report} from '../sli.mjs';
test('success rate and p95, empty not success',()=>{assert.equal(summarize([]).availability,null);const s=summarize([{ok:true,durationMs:10},{ok:false,durationMs:20}]);assert.equal(s.availability,50);assert.equal(s.p95Ms,20);});
test('200 requires app marker; HTTP and network failures recorded',async()=>{
 assert.equal((await probe('test',async()=>new Response('Sticky ToDo'))).ok,true);
 assert.equal((await probe('test',async()=>new Response('other'))).reason,'missing_app_marker');
 assert.equal((await probe('test',async()=>new Response('',{status:503}))).reason,'http_status');
 assert.equal((await probe('test',async()=>{throw Error('private details');})).reason,'network_error');
});
test('report labels limits and avoids injecting raw log fields',()=>{assert.ok(report([]).includes('30日SLOの達成判定には使えません'));assert.ok(!report([{at:new Date().toISOString(),status:null,ok:false,reason:'<script>',durationMs:1}]).includes('<script>'));});

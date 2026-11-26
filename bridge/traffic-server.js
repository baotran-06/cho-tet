import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {TikTokBridge} from './tiktok.js';
const root=fileURLToPath(new URL('../frontend/',import.meta.url)),port=3210,host='127.0.0.1';
let state='disconnected',events=[],seq=0,epoch=0,logs=[],username='',lastGift=null;
const bridge=new TikTokBridge(e=>{if(e.type==='gift')lastGift={id:e.giftId,name:e.giftName};events.push({...e,seq:++seq});if(events.length>2000)events.shift()},s=>state=s,m=>{logs.unshift(String(m));logs=logs.slice(0,10)});
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const mime={'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.js':'text/javascript','.css':'text/css'};
const server=http.createServer(async(req,res)=>{try{
if(req.headers.host!==host+':'+port)return json(res,403,{error:'Local only'});
const u=new URL(req.url,'http://'+host+':'+port);
if(u.pathname==='/api/traffic/status'&&req.method==='GET')return json(res,200,{state,username,epoch,seq,logs,lastGift,evidence:bridge.evidence()});
if(u.pathname==='/api/traffic/events'&&req.method==='GET')return json(res,200,{state,epoch,seq,events:events.filter(e=>e.seq>Number(u.searchParams.get('after')||0))});
if(['/api/traffic/connect','/api/traffic/disconnect'].includes(u.pathname)&&req.method==='POST'){
if(req.headers.origin!=='http://'+host+':'+port||req.headers['content-type']!=='application/json')return json(res,403,{error:'Local control only'});
let data='';for await(const c of req){data+=c;if(data.length>4096)return json(res,413,{error:'Too large'})}
const body=JSON.parse(data||'{}');
if(u.pathname.endsWith('/disconnect')){await bridge.stop();return json(res,200,{ok:true})}
const name=String(body.username||'').replace(/^@/,'');if(!/^[a-zA-Z0-9_.]{1,40}$/.test(name))return json(res,400,{error:'Username không hợp lệ'});
if(bridge.cooldownUntil>Date.now())return json(res,429,{error:'Nguồn đang giới hạn kết nối'});
username=name;epoch++;events=[];lastGift=null;state='connecting';void bridge.start(name).catch(e=>{state='error';logs.unshift(String(e.message||e))});return json(res,202,{ok:true})}
if(req.method!=='GET')return json(res,405,{error:'Method'});
let p=resolve(root,u.pathname==='/'?'index.html':u.pathname==='/admin'?'admin.html':'.'+decodeURIComponent(u.pathname));if(!p.startsWith(resolve(root)+sep))return json(res,403,{error:'Path'});
const data=await readFile(p);res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
}catch(e){json(res,404,{error:'Không tìm thấy hoặc yêu cầu không hợp lệ'})}});
server.listen(port,host,()=>console.log('KET XE: http://127.0.0.1:3210/admin'));
for(const sig of ['SIGINT','SIGTERM'])process.once(sig,async()=>{try{await bridge.stop()}finally{server.close();process.exit(0)}});

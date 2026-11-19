import {readdir,readFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';
async function scan(p){for(const e of await readdir(p,{withFileTypes:true})){if(e.name==='node_modules')continue;const f=p+'/'+e.name;if(e.isDirectory())await scan(f);else if(/\.(js|mjs)$/.test(f)){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status)throw Error(r.stderr);}else if(f.endsWith('.json'))JSON.parse(await readFile(f,'utf8'));}}
await scan('frontend/js');await scan('frontend/config');await scan('bridge');console.log('Syntax and JSON OK');

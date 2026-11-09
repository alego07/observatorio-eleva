// Prueba de navegación realista con DOM simulado, sin dependencias externas.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const ids=['panorama','expedientes','interpretacion','seguimiento','contraste','historial','peru','fuentes','metodologia'];
const elements=new Map();
const classes={add(){},remove(){},toggle(){return true}};
function element(id){
 if(!elements.has(id))elements.set(id,{
  id:id.replace(/^#/,''),
  innerHTML:'',textContent:'',value:id==='#monthArchive'?'2026-11':'',
  classList:classes,dataset:{},querySelectorAll(){return[]},
  focus(){},setSelectionRange(){},
 });
 return elements.get(id);
}
const requested=[];
const environment={
 document:{
  body:{classList:classes},
  querySelector:element,
  querySelectorAll(sel){return sel==='.view'?ids.map(v=>element('#view-'+v)):[]}
 },
 window:{addEventListener(){}},
 location:{hash:'#panorama'},
 fetch:async url=>{
  const p=String(url).split('?')[0];
  requested.push(p);
  const file=path.resolve(ROOT,p);
  if(!file.startsWith(ROOT+path.sep))throw Error('Ruta invalida: '+p);
  if(!fs.existsSync(file))return{ok:false,status:404};
  return{ok:true,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
 },
 console,Intl,Date
};
const context=vm.createContext(environment);
const src=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
assert.match(src,/boot\(\);\s*$/);
vm.runInContext(src.replace(/boot\(\);\s*$/,'globalThis.__ready=boot();'),context,{filename:'app.js',timeout:5000});
(async()=>{
 await context.__ready;
 assert.equal(requested.filter(x=>x.startsWith('data/archive/')).length,0,
  'La pagina inicial no debe descargar archivos mensuales');
 for(const route of ids){
  vm.runInContext('state.tab='+JSON.stringify(route)+';switchView()',context,{timeout:5000});
  assert.ok(element('#view-'+route).innerHTML.length>100,'Vista vacia: '+route);
 }
 await Promise.resolve();
 await Promise.resolve();
 assert.ok(requested.includes('data/archive/2026-11.json'),'Historial no carga al abrir su pestaña');
 const m=JSON.parse(fs.readFileSync(path.join(ROOT,'data/manifest.json')));
 assert.ok(m.last_successful_feeds>0,'No hay RSS funcionando');
 assert.ok(m.months.includes('2026-11'),'Falta archivo mensual reciente');
 const events=JSON.parse(fs.readFileSync(path.join(ROOT,'data/eventos/recientes.json')));
 assert.ok(Array.isArray(events.events)&&events.events.length>0,'No hay acontecimientos recientes');
 const library=JSON.parse(fs.readFileSync(path.join(ROOT,'data/analisis/referencias.json')));
 assert.ok(Array.isArray(library)&&library.length>0,'Biblioteca analitica vacia');
 console.log('ELEVA: 9 vistas renderizadas; carga historica diferida; datos y fuentes coherentes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
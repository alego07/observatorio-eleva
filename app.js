/* ELEVA — portal público de seguimiento documental; se distingue análisis editorial de RSS. */
const $=s=>document.querySelector(s);
const state={data:[],sources:[],health:{results:[]},manifest:{},events:[],editorial:[],seguimiento:{temas:[]},tab:'panorama',filter:'Todos',search:'',selected:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(href,label)=>`<a href="${esc(/^https:\/\//.test(href||'')?href:'#')}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const date=v=>{try{const z=/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v+'T12:00:00-05:00':v;return new Date(z).toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Lima'})}catch{return esc(v)}};
const time=v=>{try{return new Date(v).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'})}catch{return 'Sin actualización'}};
const badge=(v,c='')=>`<span class="badge ${c}">${esc(v)}</span>`;
const box=(title,body)=>`<section class="panel"><h3>${esc(title)}</h3><div class="prose">${body}</div></section>`;
const item=(label,val)=>`<div class="fact"><div class="fact-label">${esc(label)}</div><div>${esc(val)}</div></div>`;
const none=`<div class="empty">No hay información suficiente para esta sección. El Observatorio no inventa hechos ni atribuye intereses sin evidencia.</div>`;

// El formato de los expedientes es flexible: la evidencia determina su extensión.
const prose=v=>String(v||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p.trim())}</p>`).join('');
function citations(c,refs){return refs?.length?`<div class="support-refs"><span>Documentos:</span> ${refs.filter(i=>Number.isInteger(i)&&c.fuentes[i]).map(i=>link(c.fuentes[i].url,'['+(i+1)+'] '+c.fuentes[i].organismo)).join(' · ')}</div>`:'';}
function extendedBox(c,title,body,refs=[]){return box(title,prose(body)+citations(c,refs));}
function detailList(c,arr){return (arr||[]).map(x=>`<section class="sub-analysis"><h4>${esc(x.titulo)}</h4>${prose(x.texto)}${citations(c,x.fuentes)}</section>`).join('');}
function sourceCoverage(c){return `<p class="evidence-info">La amplitud de la explicación corresponde a ${c.fuentes?.length||0} documentos citados y al número de antecedentes verificables. Los apartados interpretativos son hipótesis razonadas y no manifestaciones de intención de los actores.</p>`;}
function readableReports(c){const n=c.noticias||[];return n.slice(0,6).map(a=>`<section class="report-excerpt"><h4>${esc(a.fuente)} · ${date(a.fecha)}</h4><p>${esc(a.titulo_es||a.titulo_original||'Sin título disponible')}</p>${a.resumen_es||a.resumen_original?`<blockquote>${esc(a.resumen_es||a.resumen_original)}</blockquote>`:''}<small>${a.resumen_es?'Resumen traducido automáticamente.':'Texto del canal original.'} No ha sido contrastado independientemente.</small>${link(a.url,'Abrir publicación')}</section>`).join('')||none;}

const regionList=['Todos','Perú','Estados Unidos','China','Rusia-Ucrania','Oriente Medio','Europa','América Latina','Asia-Pacífico','África','Internacional'];
function sourceStatus(id){const s=state.sources.find(x=>x.id===id),r=state.health.results.find(x=>x.source_id===id);return !s?.rss?'En directorio, sin conexión RSS':r?.status==='ok'?'RSS operativo':r?.status==='error'?'RSS con error':'RSS pendiente de prueba'}
function initNav(){document.querySelectorAll('[data-tab]').forEach(a=>a.addEventListener('click',()=>{state.tab=a.dataset.tab;switchView()}));$('#menu').onclick=()=>$('#sidebar').classList.toggle('open');$('#close-detail').onclick=closeDetail;$('#overlay').onclick=e=>{if(e.target.id==='overlay')closeDetail()};window.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail()});window.addEventListener('hashchange',()=>{state.tab=location.hash.slice(1)||'panorama';switchView()});}
function switchView(){const tab=state.tab;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hidden',v.id!==`view-${tab}`));document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));$('#page-title').textContent=({panorama:'Tu panorama internacional',expedientes:'Expedientes para estudiar',interpretacion:'Análisis de IA · ELEVA',seguimiento:'Seguimiento de procesos geopolíticos',contraste:'Contraste de posiciones y fuentes',historial:'Archivo histórico',peru:'Intereses del Perú',fuentes:'Directorio auditado de fuentes',metodologia:'Metodología del Observatorio'})[tab]||'Panorama';$('#page-subtitle').textContent=({panorama:'Informarte en 15 minutos y elegir qué estudiar con profundidad.',expedientes:'Hechos, antecedentes, posiciones, interpretación y evidencias.',interpretacion:'Evidencia, hipótesis de intereses y teoría aplicada: lee cómo se llega a una interpretación.',seguimiento:'Detecta nuevas publicaciones en procesos continuos; identifica sus antecedentes.',contraste:'La declaración oficial documenta lo que se dijo; no demuestra necesariamente que sea cierto.',historial:'Recupera las publicaciones y los análisis por fecha.',peru:'Distingue consecuencias comprobadas, riesgos posibles e hipótesis.',fuentes:'El directorio no equivale a una conexión de recopilación activa.',metodologia:'La extensión depende de la complejidad y de la evidencia disponible.'})[tab];$('#crumb').textContent=tab.toUpperCase();$('#sidebar').classList.remove('open');renderAll()}
function renderAll(){renderPanorama();renderExpedientes();renderInterpretacion();renderSeguimiento();renderContraste();renderHistorial();renderPeru();renderFuentes();renderMetodologia()}
function filters(){return `<div class="toolbar"><input id="find" type="search" placeholder="Buscar acontecimiento, Estado o palabra clave" value="${esc(state.search)}"><select id="regionFilter" aria-label="Filtrar por región">${regionList.map(r=>`<option ${state.filter===r?'selected':''}>${esc(r)}</option>`).join('')}</select></div>`}
function bindFilters(){const f=$('#find'),r=$('#regionFilter');if(f)f.oninput=e=>{state.search=e.target.value;renderPanorama();const current=$('#find');current?.focus();current?.setSelectionRange(current.value.length,current.value.length)};if(r)r.onchange=e=>{state.filter=e.target.value;renderPanorama()}}
function match(g){const terms=(g.titulo_fuente||g.titulo||'')+' '+(g.actores_mencionados||g.actores||[]).map(x=>typeof x==='string'?x:x.nombre).join(' ')+' '+(g.region||'')+' '+(g.temas||[]).join(' ');return (state.filter==='Todos'||(g.region||'')===state.filter||g.actores_mencionados?.includes(state.filter))&&terms.toLowerCase().includes(state.search.toLowerCase())}
function card(g,editorial=false){
 const title=editorial?g.titulo:(g.noticias?.[0]?.titulo_es||g.titulo_fuente);
 const n=g.noticias?.length||g.fuentes?.length||0;
 const reasons=editorial?'':(g.motivos_seleccion||[]).slice(0,2).map(esc).join(' · ');
 return `<article class="story" tabindex="0" role="button" data-open="${esc(g.id)}" data-editorial="${editorial?'1':'0'}"><div class="story-head">${badge(editorial&&g.analisis_ia?'Análisis con IA y fuentes':editorial?'Investigación fundamentada':'Noticia por contrastar',editorial?'verified':'unverified')} ${badge(date(g.fecha))}</div><h3>${esc(title)}</h3><p>${esc(editorial?g.importancia:'Varias publicaciones pueden describir un mismo acontecimiento. Examina sus afirmaciones y fuentes originales antes de formular conclusiones.')}</p>${reasons?`<p class="candidate-reason"><strong>Motivos para revisarla:</strong> ${reasons}</p>`:''}<div class="story-foot"><span>${esc(g.region)}</span><span>${editorial?`${g.fuentes.length} documentos citados`:`${g.fuentes_independientes} fuente(s) · ${n} publicación(es)`}</span><strong>Leer →</strong></div></article>`;
}
function dailyChoice(){
 const selected=[],perRegion={},perActor={};
 for(const e of state.events.filter(match)){
  const actor=e.actores_mencionados?.[0]||e.region||'Internacional',region=e.region||'Internacional';
  if(selected.length>=7)break;
  if((perActor[actor]||0)>=2 || (perRegion[region]||0)>=3)continue;
  selected.push(e);perActor[actor]=(perActor[actor]||0)+1;perRegion[region]=(perRegion[region]||0)+1;
 }
 return selected.length?selected:state.events.filter(match).slice(0,7);
}
function renderPanorama(){
 const root=$('#view-panorama');if(!root)return;
 const ok=state.health.results.filter(x=>x.status==='ok').length, configured=state.sources.filter(x=>x.rss).length;
 const choices=dailyChoice(),cases=state.editorial.filter(match);
 const published=state.manifest.last_attempt_utc;
 root.innerHTML=`
 <div class="learning-lanes" aria-label="Rutas de lectura del Observatorio">
  <a class="learning-lane" href="#panorama"><span>01 · INFORMARME</span><strong>Lo esencial de la actualidad</strong><small>Selección orientativa de publicaciones relevantes; su contenido sigue pendiente de corroboración.</small></a>
  <a class="learning-lane" href="#expedientes"><span>02 · FORMARME</span><strong>Explicaciones documentadas</strong><small>Contexto histórico, actores, intereses, teoría de RR. II. y relevancia para Perú.</small></a>
  <a class="learning-lane" href="#seguimiento"><span>03 · DAR SEGUIMIENTO</span><strong>Continuidad en el tiempo</strong><small>Novedades y archivo por proceso geopolítico, conservando fuentes y fechas.</small></a>
 </div>
 <div class="status-grid"><div><small>Fuentes registradas</small><strong>${state.sources.length}</strong></div><div><small>Canales consultados</small><strong>${configured}</strong></div><div><small>Canales que respondieron</small><strong>${ok}</strong></div><div><small>Publicaciones recopiladas</small><strong>${state.data.length}</strong></div></div>
 <div class="section-title"><div><h2>1. Informe de actualidad · selección para tu lectura</h2><p>Primero se priorizan temas diplomáticos y estratégicos, actores relevantes y diversidad de acontecimientos. <strong>La prioridad es orientativa:</strong> ninguna noticia se presenta como verificada solo por aparecer aquí.</p></div></div>
 ${filters()}
 <div class="stories">${choices.map(g=>card(g,false)).join('')||none}</div>
 <div class="section-title study-head"><div><h2>2. Estudia un acontecimiento a fondo</h2><p>Expedientes investigados por separado: hechos, antecedentes, posturas, interpretación y fuentes. No confundimos un titular reciente con una investigación completa.</p></div></div>
 <div class="stories">${cases.map(g=>card(g,true)).join('')||none}</div>
 <div class="section-title study-head"><div><h2>3. Sigue lo que cambió desde ayer</h2><p>Registro de nuevas publicaciones en procesos continuos. Un aumento de titulares <strong>no equivale</strong> a un cambio comprobado de posición estatal.</p></div></div>
 <div class="tracking-strip">${(state.seguimiento.temas||[]).filter(x=>x.cantidad_archivada).slice(0,4).map(t=>`<a href="#seguimiento" class="tracking-mini"><strong>${esc(t.titulo)}</strong><span>${t.nuevas_24h} publicaciones en 24 h · ${t.cantidad_archivada} archivadas</span></a>`).join('')||'<p>Aún no hay series de seguimiento disponibles. Se generarán durante la próxima actualización.</p>'}</div>
 <div class="method-stamp">Último intento de recopilación: ${published?time(published):'Sin datos'}. La investigación editorial no se actualiza automáticamente con cada RSS. ${link('https://github.com/alego07/observatorio-eleva','Consultar metodología y código')}</div>`;
 bindFilters();bindCards(root);
}
function renderSeguimiento(){
 const el=$('#view-seguimiento');if(!el)return;
 const themes=state.seguimiento.temas||[];
 el.innerHTML=`<div class="notice muted"><strong>Seguimiento verificable:</strong> aquí se cuentan y conservan publicaciones relacionadas con grandes procesos. No se afirma que un Gobierno cambió de posición solo porque aparecieron noticias nuevas. Los cambios de posturas deberán documentarse mediante fuentes primarias.</div>
 <div class="track-list">${themes.map(t=>`<section class="track-card"><div class="track-heading"><h3>${esc(t.titulo)}</h3><span>${badge(t.nuevas_24h+' entradas / 24 h')}</span></div><p>${t.cantidad_archivada} publicaciones históricas en ${t.dias_con_registros} día(s) con registros. Fecha más reciente: ${t.fecha_ultima?date(t.fecha_ultima):'Sin datos'}.</p><details><summary>Ver cronología de publicaciones y fuentes</summary><div class="timeline">${t.publicaciones?.length?t.publicaciones.map(e=>`<article><small>${date(e.fecha)} · ${esc(e.fuente)}</small><div>${esc(e.titulo)}${!e.traducida?'<span class="langflag"> Idioma original</span>':''}</div>${link(e.url,'Fuente original')}</article>`).join(''):'<p>Aún no hay registros asociados.</p>'}</div></details></section>`).join('')||none}</div>`;
}
function bindCards(root){root.querySelectorAll('[data-open]').forEach(el=>{const fn=()=>openCase(el.dataset.open,el.dataset.editorial==='1');el.onclick=fn;el.onkeydown=e=>{if(e.key==='Enter')fn()}})}

// Los análisis editoriales son redactados y comprobados durante una sesión de investigación.
// El sitio estático NO ejecuta un modelo generativo en cada consulta ni todos los días.
function inferenceBlocks(c){
 const arr=c.analisis_ia?.conclusiones||[];
 if(!arr.length)return '';
 return `<section class="ai-interpretation"><div class="ai-heading"><div><small>INTERPRETACIÓN DE ELEVA · ASISTENCIA DE IA</small><h3>Más allá del titular: argumentos y mecanismos</h3></div>${badge('Análisis editorial fechado','verified')}</div><p class="ai-disclosure">${esc(c.analisis_ia.autor||'Análisis editorial asistido por IA')}. Revisión: ${esc(c.analisis_ia.actualizado||c.actualizado||'fecha no disponible')}. Estas hipótesis no se regeneran automáticamente al llegar una noticia.</p>${arr.map((a,i)=>`<article class="ai-argument"><h4>${i+1}. ${esc(a.titulo)}</h4><dl><dt>¿Qué evidencia tenemos?</dt><dd>${esc(a.evidencia)}</dd><dt>¿Qué interpretación plantea ELEVA?</dt><dd><strong>${esc(a.inferencia)}</strong></dd><dt>¿Por qué creemos que es plausible?</dt><dd>${esc(a.fundamento)}</dd><dt>¿Qué teoría ayuda a explicarlo?</dt><dd>${esc(a.teoria)}</dd><dt>¿Hasta dónde llega la conclusión?</dt><dd>${esc(a.limite)}</dd></dl>${citations(c,a.fuentes)}</article>`).join('')}</section>`;
}
function renderInterpretacion(){
 const root=$('#view-interpretacion');if(!root)return;
 const docs=state.editorial.filter(c=>(c.analisis_ia?.conclusiones||[]).length);
 root.innerHTML=`<div class="notice muted"><strong>Qué significa IA en ELEVA:</strong> estos análisis fueron redactados con asistencia de IA y revisión de documentos concretos. Se publican con fecha, evidencia y límites. No equivale a afirmar que todas las noticias RSS reciben investigación automática cada mañana.</div><div class="section-title"><div><h2>Razonamientos sustentados, no opiniones sin contexto</h2><p>Cada argumento parte de un indicio, construye una hipótesis, expone el mecanismo causal y señala qué no puede demostrarse.</p></div></div><div class="stories">${docs.map(c=>card(c,true)).join('')||none}</div>`;
 bindCards(root);
}
function relatedEditorial(c){
 const text=[c.titulo_fuente,...(c.noticias||[]).map(n=>n.titulo_original||'')].join(' ').toLowerCase();
 return state.editorial.find(ed=>(ed.match_keywords||[]).some(k=>text.includes(k.toLowerCase())))||null;
}

/**
 * Complemento desde el archivo ya recogido. No es búsqueda abierta ni
 * verificación independiente: solo muestra más documentos rastreables.
 * Exige coincidencia de un proceso específico, no solo un país aislado.
 */
function relatedArchiveReports(c){
 const title=[c.titulo_fuente,...(c.noticias||[]).map(n=>n.titulo_original)].join(' ');
 const patterns=[
  {label:'negociación y guerra Rusia–Ucrania',re:/ukrain|ucrani|zelensk|putin.*(?:trump|xi|summit)|trump.*putin/i},
  {label:'estrecho de Taiwán',re:/taiwan|taiw[aá]n|taipei/i},
  {label:'diplomacia e incidentes en Cisjordania',re:/west bank|cisjord|settlers|colonos/i},
  {label:'relaciones comerciales China–Estados Unidos',re:/china.*(?:tariff|trade|trump)|(?:tariff|trade|trump).*china/i},
  {label:'negociación y seguridad en Oriente Medio',re:/iran|ir[aá]n|gaza|israel|palestin/i},
  {label:'política exterior del Perú',re:/per[uú]|peruvian/i}
 ];
 const pattern=patterns.find(p=>p.re.test(title));if(!pattern)return '';
 const present=new Set((c.noticias||[]).map(x=>x.url));
 const first=(c.noticias?.[0]?.fecha||'').slice(0,10);
 const prior=state.data.filter(n=>n.url&&!present.has(n.url)&&pattern.re.test(n.title||'')&&n.published_utc&&n.published_utc.slice(0,10)<=first);
 const dedup=[],seen=new Set();
 for(const n of prior){
  const k=(n.title||'').toLowerCase().replace(/[^a-z\d]/g,'').slice(0,42);
  if(seen.has(k))continue;seen.add(k);
  dedup.push(n);if(dedup.length===4)break;
 }
 if(!dedup.length)return '';
 return box('Antecedentes periodísticos relacionados: '+pattern.label,
  '<p>Estos artículos permiten seguir el mismo proceso internacional. No son necesariamente pruebas del episodio actual y sus afirmaciones deben evaluarse por separado.</p><ul>'+
  dedup.map(n=>'<li><strong>'+esc(date(n.published_utc))+' · '+esc(n.source_name)+':</strong> '+
  esc(n.title_es||n.title)+'. '+link(n.url,'Consultar antecedente')+'</li>').join('')+'</ul>');
}
function documentedContext(c,related){
 if(!related)return '';
 return '<section class="ai-interpretation ai-link"><div class="ai-heading"><div><small>INVESTIGACIÓN COMPLEMENTARIA DE ELEVA</small><h3>Qué significa este acontecimiento</h3></div>'+
 badge('Análisis documentado','verified')+'</div>'+
 '<p><strong>'+esc(related.titulo)+'</strong></p>'+
 '<p>'+esc(related.importancia)+'</p>'+
 '<p><strong>Contexto y antecedentes:</strong></p>'+prose(related.antecedentes)+
 '<p><strong>Lectura geopolítica:</strong></p>'+prose(related.lectura)+
 '<p><strong>Posible efecto en el Perú:</strong></p>'+prose(related.peru)+
 '<p><small>El expediente fue investigado y fechado por separado: sus conclusiones no se actualizan automáticamente con cada titular nuevo.</small></p>'+
 citations(related,[0,1,3])+
 '<button class="open-analisis" data-editorial-case="'+esc(related.id)+'">Abrir expediente y análisis completo →</button></section>';
}

// Guía analítica de reglas: no simula comprensión automática de la noticia.
function candidateHypothesis(c){
 const t=[c.titulo_fuente,...(c.noticias||[]).map(x=>x.titulo_original||'')].join(' ').toLowerCase();
 const patterns=[
 {re:/sanction|sancion|tariff|arancel|embargo/,label:'Coerción económica',idea:'Las restricciones económicas pueden funcionar como instrumento de presión, pero también generan costos para el Estado que las impone y para terceros compradores.',because:'El mecanismo a evaluar es la modificación de incentivos económicos mediante limitaciones de acceso a bienes, pagos o mercados.',theory:'Interdependencia compleja y negociación coercitiva.',check:'Qué norma se aprobó, qué excepciones existen, qué actores soportan los costos y si la conducta del objetivo cambia.'},
 {re:/militar|missile|drone|navy|naval|ship|attack|strike|tropas|armad|buques|ataque|guerra|helicopter|helicópter/,label:'Seguridad y disuasión',idea:'Podría existir una competencia por disuadir al adversario, mostrar capacidad o preservar control territorial; otra posibilidad es una operación puntual sin cambio estratégico.',because:'Los despliegues y ataques pueden comunicar capacidad e intención, pero un titular no permite identificar quién ordenó la acción ni su finalidad.',theory:'Realismo, dilema de seguridad y señalización estratégica.',check:'Información operativa primaria, continuidad temporal, posición de ambas partes y cambios verificables sobre el terreno.'},
 {re:/negotiat|diplomat|talks|summit|acuerd|cumbre|negocia|diálogo|meeting|reuni/,label:'Negociación diplomática',idea:'Los participantes podrían buscar reducir incertidumbre, preservar canales de comunicación o intercambiar concesiones sin renunciar a sus objetivos centrales.',because:'Los contactos diplomáticos reducen costos de coordinación, pero la reunión por sí sola no acredita un acuerdo ni convergencia de intereses.',theory:'Institucionalismo liberal y negociación en dos niveles.',check:'Agenda, texto de acuerdos, concesiones documentadas y cumplimiento posterior.'},
 {re:/trade|export|import|comerci|growth|econom|economic|inflation|energy|oil|petrole|diesel|diesel|mercad/,label:'Interdependencia y costos',idea:'La situación podría responder a una redistribución de incentivos económicos entre productores, compradores, empresas y gobiernos.',because:'Los precios, las cadenas de suministro y el acceso a mercados crean ganadores y perdedores con preferencias diferentes.',theory:'Economía política internacional e interdependencia.',check:'Cifras, canales de transmisión, exposición real de Perú y efecto observado sobre comercio o precios.'},
 {re:/election|electoral|elecci|parlament|protest|oposic|democrac|referendum/,label:'Legitimidad política',idea:'El episodio podría reflejar competencia por legitimidad interna o por reglas de acceso al poder, con repercusiones diplomáticas según el resultado.',because:'Los incentivos electorales y la presión de grupos domésticos pueden condicionar decisiones exteriores.',theory:'Negociación en dos niveles e institucionalismo.',check:'Normas electorales aplicables, posiciones de instituciones, actores que intervienen y evidencia de efectos externos.'}
 ];
 const item=patterns.find(p=>p.re.test(t));if(!item)return null;
 return `<section class="preliminary-interpretation"><h3>Interpretación orientativa · ${esc(item.label)}</h3><p><strong>Hipótesis condicional:</strong> ${esc(item.idea)}</p><p><strong>¿Por qué sería plausible?</strong> ${esc(item.because)}</p><p><strong>Marco teórico:</strong> ${esc(item.theory)}</p><p><strong>Qué falta verificar:</strong> ${esc(item.check)}</p><small>Esta guía usa reglas temáticas sobre títulos y resúmenes, NO un modelo de IA que investigó el acontecimiento. No atribuye intereses concretos a actores sin pruebas documentales.</small></section>`;
}

function renderExpedientes(){const el=$('#view-expedientes');if(!el)return;const selection=state.editorial.map(g=>card(g,true));el.innerHTML=`<div class="notice muted"><strong>Expediente ≠ titular.</strong> Solo se publica como análisis un caso con fuentes y razonamiento identificado. Los RSS sin corroborar están en el panorama como candidatos.</div><div class="stories">${selection.join('')||none}</div><h2 class="subheading">Acontecimientos recientes multifuente</h2><div class="stories">${state.events.filter(e=>e.fuentes_independientes>=2).slice(0,25).map(e=>card(e)).join('')||none}</div>`;bindCards(el)}
function renderContraste(){const el=$('#view-contraste');if(!el)return;el.innerHTML=`<div class="notice muted">Comparar narrativas exige más que artículos semejantes. Aquí se muestran posiciones documentadas; nunca se equipara automáticamente declaración con verdad.</div>${state.editorial.map(g=>`<article class="panel"><h2>${esc(g.titulo)}</h2><div class="actors-grid">${g.actores.map(a=>`<div class="actor"><h3>${esc(a.nombre)}</h3>${item('Posición documentada',a.posicion)}${item('Interés posible · inferencia',a.interes)}<small>${esc(a.evidencia)}</small></div>`).join('')}</div><p>${esc(g.lectura)}</p><p>${link(g.fuentes[0].url,'Examinar comunicado original')}</p></article>`).join('')}`}
function timelineRows(arr){return `<div class="timeline">${arr.slice(0,300).map(x=>`<article><small>${date(x.published_utc)} · ${esc(x.source_name)}</small><div>${esc(x.title_es||x.title)}${!x.title_es?'<span class="langflag"> Idioma original</span>':`<span class="langflag"> Traducción automática</span>`}</div><div>${link(x.url,'Fuente original')}</div></article>`).join('')||none}</div>`}
function renderHistorial(){const el=$('#view-historial');if(!el)return;const months=state.manifest.months||[];el.innerHTML=`<div class="notice muted">Archivo documental histórico, organizado por meses; mantiene enlaces originales. Los titulares no constituyen corroboración.</div><div class="toolbar"><select id="monthArchive" aria-label="Seleccionar mes del archivo">${months.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select><span id="archiveStatus">Seleccione un mes para recuperar las publicaciones.</span></div><div id="archiveRows">${timelineRows(state.data)}</div>`;const sel=$('#monthArchive');if(sel){sel.onchange=async()=>{const m=sel.value;if(!/^\d{4}-\d{2}$/.test(m))return;$('#archiveStatus').textContent='Cargando '+m+'…';const rows=await readJSON(`data/archive/${m}.json`,[]);$('#archiveRows').innerHTML=timelineRows(rows);$('#archiveStatus').textContent=rows.length+' publicaciones archivadas de '+m;}; if(months.length)sel.onchange();}}
function renderPeru(){const el=$('#view-peru');if(!el)return;el.innerHTML=`<div class="notice muted">Un acontecimiento internacional no afecta necesariamente al Perú. Se exigen mecanismos causales plausibles, datos y fuentes para afirmar consecuencias directas.</div>${state.editorial.map(g=>box(g.titulo,`<p><strong>¿Por qué importa?</strong> ${esc(g.peru)}</p><p><strong>Límite de lo conocido:</strong> ${esc(g.limitaciones)}</p>${link(g.fuentes[0].url,'Ver documento oficial')}`)).join('')} ${box('Otros procesos internacionales','<p>Los acontecimientos automáticos permanecen en evaluación. No se les atribuyen impactos concretos sin evidencia.</p>')}`}
function renderFuentes(){const el=$('#view-fuentes');if(!el)return;const failed=state.health.results.filter(x=>x.status==='error');el.innerHTML=`<div class="notice muted"><strong>Auditoría:</strong> ${state.sources.length} fuentes registradas; ${state.sources.filter(x=>x.rss).length} RSS configurados; ${state.health.results.filter(x=>x.status==='ok').length} operativos en el último intento. Una fuente sin RSS sigue disponible para consulta manual, pero no aparece automáticamente.</div>${failed.length?`<div class="panel"><h3>Canales con error en la última ejecución</h3>${failed.map(x=>`<p><strong>${esc(x.source_name)}:</strong> ${esc(x.message||'Error de consulta')}</p>`).join('')}</div>`:''}<div class="source-list">${state.sources.map(s=>`<article><div><strong>${esc(s.nombre)}</strong><small>${esc(s.pais)} · ${s.tipo==='oficial'?'Institucional / oficial':'Periodístico'}</small></div><div class="source-right">${badge(sourceStatus(s.id),sourceStatus(s.id)==='RSS operativo'?'verified':'unverified')}${link(s.web,'Sitio')}</div></article>`).join('')}</div>`}
function renderMetodologia(){const el=$('#view-metodologia');if(!el)return;el.innerHTML=`${box('1. El hecho y la prueba','La coincidencia de titulares no equivale a corroboración independiente. El RSS solo aporta publicaciones y enlaces. Para afirmar hechos se requieren fuentes primarias y contraste específico.')}${box('2. Actores y posiciones','Se diferencia lo que declara un Estado, lo que publican los medios de su sociedad y las inferencias sobre objetivos estratégicos. No se atribuyen motivaciones a un Gobierno sin evidencia.')}${box('3. Teorías de relaciones internacionales','Realismo, institucionalismo, constructivismo e interdependencia son herramientas interpretativas: deben explicar un mecanismo, no convertirse en etiquetas automáticas.')}${box('4. Efectos sobre el Perú','Se distinguen consecuencias acreditadas, riesgos plausibles y asuntos que todavía no tienen una conexión identificable con el Perú.')}${box('5. Lengua y actualización','La interfaz está en español. Los textos extranjeros solo figuran en español si hay traducción automática identificada o un análisis editorial; en caso contrario se indica el idioma original. La hora es la del último intento, no una promesa de entrega.')}${box('6. Integridad documental','Se enlaza al documento periodístico u oficial original, se archivan metadatos y no se reproduce íntegramente contenido protegido. Los expedientes editoriales indican sus limitaciones.')}${box('7. Interpretación con IA y guía automatizada','Los análisis con IA son textos elaborados en una revisión editorial identificada, con evidencias, inferencias y límites. GitHub Actions no ejecuta un modelo generativo diariamente. Para las fichas solo RSS, la guía temática se genera mediante reglas transparentes de palabras clave; sus hipótesis son condicionales y deben investigarse.')}`}
function openCase(id,ed){
 const c=ed?state.editorial.find(g=>g.id===id):state.events.find(g=>g.id===id);if(!c)return;
 state.selected=c;
 const title=ed?c.titulo:(c.noticias?.[0]?.titulo_es||c.titulo_fuente);
 const sources=ed?c.fuentes.map((f,i)=>`<li><strong>[${i+1}]</strong> ${link(f.url,f.organismo)} · ${esc(f.tipo)}</li>`).join(''):c.noticias.map(f=>`<li>${link(f.url,f.fuente)} · ${date(f.fecha)} · ${esc(f.pais)}${!f.titulo_es?' · título en idioma original':''}</li>`).join('');
 let content=`<div class="case-head">${badge(ed?'Análisis documentado':'Publicaciones pendientes de corroboración',ed?'verified':'unverified')} ${badge(date(c.fecha))}<h2>${esc(title)}</h2></div>`;
 if(ed){
  content+=`<div class="reading-tools"><div><strong>Lectura adaptada a la evidencia</strong><small>${(c.profundidad==='profundo')?'Análisis extenso: múltiples antecedentes, posiciones y fuentes.':'La profundidad depende de las fuentes disponibles.'}</small></div><button type="button" id="toggle-depth" aria-expanded="true">Mostrar solo síntesis</button></div>`;
  content+=extendedBox(c,'En síntesis · ¿qué significa este acontecimiento?',c.importancia||c.hecho,[0]);
  content+=inferenceBlocks(c);
  content+=`<div id="deep-analisis" class="deep-analisis">`;
  content+=extendedBox(c,'1. Los hechos: ¿qué ocurrió exactamente?',c.hecho,[0,1,2]);
  content+=extendedBox(c,'2. Antecedentes: ¿cómo se llegó a esta situación?',c.antecedentes,[4,5]);
  if(c.cronologia?.length)content+=box('3. Secuencia cronológica documentada',`<ol class="case-timeline">${c.cronologia.map(t=>`<li><time>${esc(t.fecha)}</time><p>${esc(t.evento)}</p>${citations(c,t.fuentes)}</li>`).join('')}</ol>`);
  if(c.detalles?.length)content+=box('4. Detalles que explican la controversia',detailList(c,c.detalles));
  content+=`<h3>5. Actores: posiciones e intereses</h3><div class="actors-grid">${c.actores.map(a=>`<section class="actor"><h3>${esc(a.nombre)}</h3>${item('Posición oficial documentada',a.posicion)}${item('Interés analizado · inferencia',a.interes)}<small>${esc(a.evidencia)}</small></section>`).join('')}</div>`;
  if(c.juridico?.length)content+=box('6. Dimensión jurídica y normativa',detailList(c,c.juridico));
  content+=extendedBox(c,'7. Interpretación geopolítica: ¿por qué importa?',c.lectura,[2,3]);
  if(c.teorias?.length)content+=box('8. Teorías de relaciones internacionales aplicables',c.teorias.map(t=>`<section class="sub-analysis"><h4>${esc(t.nombre)}</h4>${prose(t.explicacion)}${citations(c,t.fuentes)}</section>`).join(''));
  else if(c.teoria)content+=extendedBox(c,'8. Teoría aplicable · '+c.teoria.nombre,c.teoria.aplicacion);
  content+=extendedBox(c,'9. ¿Cómo afecta al Perú? Consecuencias y mecanismos',c.peru,[0,2]);
  content+=extendedBox(c,'Qué no podemos afirmar todavía',c.limitaciones);
  if(c.preguntas_abiertas?.length)content+=box('Qué debemos vigilar en las próximas actualizaciones',`<ul class="open-questions">${c.preguntas_abiertas.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`);
  content+='</div>';
  content+=sourceCoverage(c);
 }else{
  content+=box('1. ¿Qué han publicado las fuentes?',`<p>Esta ficha reúne publicaciones que parecen abordar un mismo acontecimiento. Las siguientes notas representan lo que afirma cada medio, sin constituir una comprobación del hecho.</p>${readableReports(c)}`);
  const related=relatedEditorial(c);
  if(related)content+=documentedContext(c,related);
  // Muestra material previo del mismo proceso, con fecha y enlace verificable.
  content+=relatedArchiveReports(c);
  if(!related){const suggested=candidateHypothesis(c);if(suggested)content+=suggested;}
  if(c.actores_mencionados?.length){content+=box('Actores mencionados en las publicaciones',`<p>${c.actores_mencionados.map(esc).join(', ')}. La mención permite orientar una investigación, pero no acredita participación, responsabilidad ni intereses propios.</p>`);}
  if(!related)content+=box('Qué sigue sin acreditarse',`<p>Esta ficha utiliza noticias recopiladas y antecedentes archivados, no una búsqueda independiente de documentos oficiales sobre este episodio. Para afirmar causas, efectos o resultados concretos será necesario contrastar las declaraciones de los protagonistas.</p>`);
 }
 content+=box('Documentos y publicaciones originales',`<ul>${sources}</ul>`);
 $('#detail').innerHTML=content;
 $('#overlay').classList.remove('hidden');document.body.classList.add('no-scroll');
 const relatedButton=$('#detail [data-editorial-case]');if(relatedButton){relatedButton.onclick=()=>openCase(relatedButton.dataset.editorialCase,true);}
 const toggle=$('#toggle-depth');if(toggle){toggle.onclick=()=>{const panel=$('#deep-analisis');const hidden=panel.classList.toggle('collapsed');toggle.textContent=hidden?'Leer análisis completo':'Mostrar solo síntesis';toggle.setAttribute('aria-expanded',String(!hidden));};}
}
function closeDetail(){$('#overlay').classList.add('hidden');document.body.classList.remove('no-scroll')}
async function readJSON(url,fallback){try{const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}catch{return fallback}}
async function boot(){initNav();[state.sources,state.data,state.manifest,state.health,state.editorial]=await Promise.all([readJSON('sources.json',[]),readJSON('data/current.json',[]),readJSON('data/manifest.json',{}),readJSON('data/health.json',{results:[]}),readJSON('editorial.json',[])]);const [e,follow]=await Promise.all([readJSON('data/eventos/recientes.json',{events:[]}),readJSON('data/seguimiento.json',{temas:[]})]);state.events=e.events||[];state.seguimiento=follow;const latest=state.manifest.last_attempt_utc;const hoy=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const fechaReporte=(state.manifest.last_attempt_lima||'').slice(0,10);const alDia=fechaReporte===hoy&&(state.manifest.last_successful_feeds||0)>0;$('#last-time').textContent=latest?time(latest):'Pendiente';$('#top-status').textContent=alDia?'Noticias actualizadas hoy':'Actualización de hoy pendiente';$('#clock').textContent='Hora del Perú';$('#notice').classList.toggle('stale',!alDia);$('#notice').innerHTML=alDia?`<strong>Noticias recopiladas hoy, ${esc(hoy)}.</strong> Última consulta: ${esc(time(latest))}. ${state.manifest.last_successful_feeds} de ${state.manifest.feed_count} RSS respondieron. Los análisis geopolíticos se actualizan separadamente y las publicaciones RSS requieren contrastación.`:`<strong>Actualización diaria pendiente: ${esc(hoy)}.</strong> Última consulta: ${latest?esc(time(latest)):'no disponible'}. GitHub no ha publicado una recopilación válida de hoy. Se intentará recuperar automáticamente; mientras tanto se muestra el archivo histórico, no noticias verificadas de hoy.`;state.tab=location.hash.slice(1)||'panorama';switchView()}
boot();
#!/usr/bin/env python3
"""Agrupación conservadora y etiquetas orientativas. No crea hechos o motivaciones."""
import datetime as dt, json, pathlib, re, unicodedata, hashlib
from collections import defaultdict
ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'
STOP={'the','and','this','that','from','with','about','after','before','amid','says','said','news','live','update','latest','over','into','for','are','more','when','como','para','entre','sobre','segun','desde','contra','have','will','says','guerre','dans','pour','avec','une','des','les','que','sur','par','del','los','las','una','noticias','what','know','today','his','her','their','has','been','not','was','who','its','than','says','report','from'}
ACTORS={
 'Estados Unidos':['united states','united states of america','u.s.','us president','white house','washington','estados unidos','trump'],
 'China':['china','chinese','beijing','pekin','xi jinping','china'],
 'Rusia':['russia','russian','moscow','moscu','rusia','putin'],
 'Ucrania':['ukraine','ukrainian','ucrania','kyiv','zelensky'],
 'Perú':['peru','perú','peruvian','cancilleria peruana','lima'],
 'Brasil':['brazil','brasil','lula','brasilia'],
 'Argentina':['argentina','milei','buenos aires'],
 'Israel':['israel','israeli','netanyahu'],
 'Irán':['iran','irán','iranian','tehran','teheran'],
 'Palestina':['palestina','palestine','palestinian','gaza'],
 'India':['india','indian','modi','new delhi'],
 'Unión Europea':['european union','union europea','brussels','bruselas'],
 'Francia':['france','francia','macron','paris'],
 'Alemania':['germany','alemania','berlin'],
 'Japón':['japan','japon','japón','tokyo'],
 'ONU':['united nations','naciones unidas','security council','consejo de seguridad'],
 'Turquía':['turkey','turkiye','turquía','erdogan'],
 'Arabia Saudita':['saudi arabia','arabia saudita','riyadh'],
 'Sudáfrica':['south africa','sudafrica','sudáfrica'],
 'Taiwán':['taiwan','taiwán','taipei']}
THEORY={
 'Seguridad y conflictos': {'nombre':'Realismo y dilema de seguridad','pregunta':'¿Cómo influyen la seguridad, las percepciones de amenaza y el equilibrio de poder en las decisiones de las partes?'},
 'Diplomacia':{'nombre':'Liberalismo institucional y negociación','pregunta':'¿Qué incentivos crean los acuerdos, instituciones y canales diplomáticos para gestionar la controversia?'},
 'Comercio y finanzas':{'nombre':'Interdependencia compleja y economía política internacional','pregunta':'¿Quién gana, quién asume los costos y qué dependencias económicas condicionan las opciones de los Estados?'},
 'Organismos multilaterales':{'nombre':'Institucionalismo liberal','pregunta':'¿Qué reglas, mecanismos de cooperación y límites institucionales afectan la decisión?'},
 'Energía y clima':{'nombre':'Interdependencia y gobernanza global','pregunta':'¿Cómo se distribuyen los costos de coordinación y los incentivos para cooperar?'},
 'Migración y DD. HH.':{'nombre':'Derecho internacional y constructivismo','pregunta':'¿Qué normas, identidades y obligaciones internacionales invocan los actores?'}
}
def normalize(s):
 s=unicodedata.normalize('NFKD',s or '')
 return ''.join(c for c in s if not unicodedata.combining(c)).lower()
def tokens(s):
 return set(w for w in re.findall(r'[a-z0-9]{4,}',normalize(s)) if w not in STOP)
def actors(s):
 t=normalize(s)
 result=[]
 for n,aliases in ACTORS.items():
  if any((re.search(r'(?<![a-z])'+re.escape(normalize(q))+r'(?![a-z])',t)) for q in aliases):result.append(n)
 return result

def build():
 items=json.loads((DATA/'current.json').read_text(encoding='utf8')) if (DATA/'current.json').exists() else []
 all_sources=json.loads((ROOT/'sources.json').read_text(encoding='utf8'))
 idx={x['id']:x for x in all_sources}
 for item in items:
  item['actores_mencionados']=actors(item.get('title','')+' '+item.get('excerpt',''))
  item['fuente_rss_operativa']=bool(idx.get(item['source_id'],{}).get('rss'))
  item['idioma_original']='es' if re.search(r'\b(el|los|las|que|estados unidos|perú|méxico)\b',normalize(item.get('title',''))) else 'sin determinar'
 groups=[]
 for item in items[:500]:
  tok=tokens(item['title']); d=(item.get('published_utc') or '')[:10]
  if len(tok)<3: continue
  choice=None;best=0
  for i,g in enumerate(groups):
   if abs((dt.date.fromisoformat(d)-dt.date.fromisoformat(g['fecha'])).days)>2:continue
   r=len(tok & g['_tokens'])/max(1,len(tok|g['_tokens']))
   if r>best:best=r;choice=i
  # A high threshold prevents merging unrelated articles merely sharing a country.
  if best>=0.42:
   groups[choice]['noticias'].append(item)
   groups[choice]['fuentes']=sorted(set(groups[choice]['fuentes'])|{item['source_name']})
   groups[choice]['actores_mencionados']=sorted(set(groups[choice]['actores_mencionados'])|set(item['actores_mencionados']))
  else:
   groups.append({'id':'a-'+item['id'],'fecha':d,'titulo_fuente':item['title'],'region':item.get('regions',['Internacional'])[0], 'temas':item.get('topics',[]), 'noticias':[item], 'fuentes':[item['source_name']], 'actores_mencionados':item['actores_mencionados'],'_tokens':tok})
 out=[]
 for g in groups:
  g.pop('_tokens')
  g['fuentes_independientes']=len(set(g['fuentes']))
  g['estado']='publicaciones agrupadas; afirmaciones pendientes de corroboración'
  g['marco_teorico']=next((THEORY[t] for t in g['temas'] if t in THEORY),{'nombre':'Marco por determinar','pregunta':'¿Cuál es el fenómeno internacional que debe explicarse y qué teoría resulta pertinente?'})
  g['relevancia_peru']='Por analizar; no se debe presumir un efecto sobre Perú.' if 'Perú' not in g['actores_mencionados'] else 'Perú aparece mencionado; falta verificar el alcance real de cualquier consecuencia.'
  g['intereses']='Pendiente de identificar mediante declaraciones de las partes, documentos y evidencia independiente.'
  g['analisis']='Pendiente de análisis editorial. La agrupación temática no permite deducir motivaciones estatales.'
  g['fecha_analisis']=None
  g['noticias']=[{'id':r['id'],'titulo_original':r['title'],'titulo_es':r.get('title_es',''),'url':r['url'],'fuente':r['source_name'],'pais':r['country'],'fecha':r['published_utc'],'estado':r['verification']} for r in g['noticias'][:9]]
  out.append(g)
 (DATA/'eventos').mkdir(parents=True,exist_ok=True)
 out=sorted(out,key=lambda g:(g['fuentes_independientes']>=2,len(g['actores_mencionados']),g['fecha']),reverse=True)
 (DATA/'eventos'/'recientes.json').write_text(json.dumps({'created_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'events':out[:150]},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('ELEVA: agrupaciones automáticas',len(out),'multifuente',sum(g['fuentes_independientes']>=2 for g in out))
if __name__=='__main__': build()
#!/usr/bin/env python3
"""Seguimiento por áreas persistentes basado en documentos archivados.
No afirma que exista un cambio de política: solo cuantifica nuevas publicaciones.
"""
import datetime as dt, json, pathlib
from collections import defaultdict
import enrich
ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'
TOPICS=[
 ('eeuu-china','Competencia estratégica Estados Unidos–China',{'Estados Unidos','China'},'ambos'),
 ('rusia-ucrania','Guerra y diplomacia Rusia–Ucrania',{'Rusia','Ucrania'},'cualquiera'),
 ('china-taiwan','China y Taiwán',{'China','Taiwán'},'ambos'),
 ('oriente-medio','Oriente Medio: seguridad y diplomacia',{'Israel','Palestina','Irán','Arabia Saudita','Turquía'},'cualquiera'),
 ('peru-mundo','Perú en el sistema internacional',{'Perú'},'cualquiera'),
 ('union-europea','Unión Europea y relaciones exteriores',{'Unión Europea','Francia','Alemania'},'cualquiera'),
 ('suramerica','Sudamérica: integración y política exterior',{'Brasil','Argentina','Perú'},'cualquiera'),
 ('india-asia','India y Asia-Pacífico',{'India','Japón'},'cualquiera'),
 ('onu','Naciones Unidas y multilateralismo',{'ONU'},'cualquiera'),
]
def make(now=None,base=DATA):
 now=now or dt.datetime.now(dt.timezone.utc)
 items={}
 for f in sorted((base/'archive').glob('????-??.json')):
  for it in json.loads(f.read_text(encoding='utf8')):
   if it.get('id') and it.get('url') and it.get('published_utc'):
    items[it['id']]=it
 if not items and (base/'current.json').exists():
  items={i['id']:i for i in json.loads((base/'current.json').read_text(encoding='utf8'))}
 sortedrows=sorted(items.values(),key=lambda r:r['published_utc'],reverse=True)
 out=[]
 for id,title,keys,mode in TOPICS:
  acc=[]
  for it in sortedrows:
   aa=set(enrich.actors(' '.join((it.get('title',''),it.get('excerpt','')))))
   if (keys<=aa if mode=='ambos' else bool(keys&aa)):
    acc.append(it)
  dnow=now.date()
  recent=sum(1 for a in acc if (now - dt.datetime.fromisoformat(a['published_utc'].replace('Z','+00:00'))) <= dt.timedelta(hours=24) and (now - dt.datetime.fromisoformat(a['published_utc'].replace('Z','+00:00'))) >= dt.timedelta(0))
  prev=sum(1 for a in acc if dt.timedelta(hours=24)<(now-dt.datetime.fromisoformat(a['published_utc'].replace('Z','+00:00')))<=dt.timedelta(hours=48))
  dates=sorted({r['published_utc'][:10] for r in acc},reverse=True)
  out.append({'id':id,'titulo':title,'cantidad_archivada':len(acc),'nuevas_24h':recent,'anteriores_24h':prev,'dias_con_registros':len(dates),'fecha_ultima':acc[0]['published_utc'] if acc else None,
   'estado':'Seguimiento de publicaciones; no verifica cambios de postura oficial',
   'publicaciones':[{'id':r['id'],'fecha':r['published_utc'],'titulo':r.get('title_es') or r['title'],'fuente':r['source_name'],'url':r['url'],'traducida':bool(r.get('title_es'))} for r in acc[:30]]})
 out.sort(key=lambda x:(x['nuevas_24h']>0,x['nuevas_24h'],x['cantidad_archivada']),reverse=True)
 (base/'seguimiento.json').write_text(json.dumps({'actualizado_utc':now.isoformat(),'nota':'Series de publicaciones por tema; no prueba evolución de políticas ni intención de actores','temas':out},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 return out
if __name__=='__main__':
 topics=make()
 print('ELEVA seguimiento temático:',len(topics),'series; publicaciones visibles:',sum(t['cantidad_archivada'] for t in topics))
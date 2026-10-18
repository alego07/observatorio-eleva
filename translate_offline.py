#!/usr/bin/env python3
"""Traduce títulos y breves extractos mediante modelos Argos de código abierto.
Falla en forma segura: jamás presenta el texto original como si se hubiera traducido.
"""
import json, os, pathlib, time
ROOT=pathlib.Path(__file__).resolve().parent
DATA=ROOT/'data'
TRANSLATIONS=DATA/'translations.json'
SUPPORTED={'en','fr','pt'}
def load(p,default):
 try:return json.loads(p.read_text('utf8'))
 except (OSError,ValueError):return default
def save(p,obj):p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def main():
 try:
  import argostranslate.package as pkg
  import argostranslate.translate as tr
 except ImportError:
  print('Argos no disponible: los artículos sin traducción conservarán idioma original');return
 sources={s['id']:s for s in load(ROOT/'sources.json',[])}
 rows=load(DATA/'current.json',[])
 prev=load(TRANSLATIONS,{})
 for item in rows:
  if item['id'] in prev:item.update(prev[item['id']])
 langs=[]
 for item in rows[:60]:
  lang=sources.get(item['source_id'],{}).get('idioma','en')
  if lang in SUPPORTED and item['id'] not in prev and lang not in langs:langs.append(lang)
 if not langs:
  save(DATA/'current.json',rows)
  print('Traducciones recuperadas de archivo local:',len(prev))
  return
 try: pkg.update_package_index();available=pkg.get_available_packages()
 except Exception as e:
  print('No fue posible consultar paquetes de traducción',str(e)[:120]);return
 installed={(p.from_code,p.to_code) for p in pkg.get_installed_packages()}
 for lang in langs:
  if (lang,'es') in installed:continue
  matches=[p for p in available if p.from_code==lang and p.to_code=='es']
  if not matches:print('Modelo no disponible',lang);continue
  try:pkg.install_from_path(matches[0].download());installed.add((lang,'es'));print('Modelo disponible:',lang+'-es')
  except Exception as e:print('No fue posible instalar',lang,str(e)[:150])
 count=0
 for item in rows[:60]:
  lang=sources.get(item['source_id'],{}).get('idioma','en')
  if lang not in SUPPORTED or (lang,'es') not in installed:continue
  if item['id'] in prev:
   item.update(prev[item['id']]);continue
  if count>=36:break
  try:
   title=tr.translate(item['title'],lang,'es')
   excerpt=tr.translate((item.get('excerpt') or '')[:240],lang,'es') if item.get('excerpt') else ''
   if title and title!=item['title']:
    item.update({'title_es':title,'excerpt_es':excerpt,'traduccion':'automática Argos Translate','idioma_original':lang})
    prev[item['id']]={k:item[k] for k in ['title_es','excerpt_es','traduccion','idioma_original']};count+=1
  except Exception as e:print('Error al traducir',item['id'],str(e)[:90])
 save(TRANSLATIONS,prev)
 # El archivo actual sirve a la web; los originales permanecen en archivo histórico.
 save(DATA/'current.json',rows)
 print('Traducciones nuevas:',count,'cache:',len(prev))
if __name__=='__main__':main()
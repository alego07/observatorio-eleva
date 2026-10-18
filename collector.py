#!/usr/bin/env python3
"""ELEVA public RSS/Atom collector. Standard library only, no AI, no paid APIs."""
import datetime as dt, email.utils, hashlib, html, json, os, pathlib, re, ssl, sys, time
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / 'data'
TZ = ZoneInfo('America/Lima')
UTC = dt.timezone.utc
STOP = set('de del el la los las un una y en para por con desde ante sobre the of and for from with a an to on in at as is are that this after amid says said it its et des le les la du de para o e em da do dos das sobre en que al se'.split())
KEYWORDS = {'Perú':['perú','peru','peruvian','peruano','lima','cancillería peruana','mincetur'], 'China':['china','chinese','beijing','pekin','taiwan','taiwán'],'Rusia-Ucrania':['russia','russian','rusia','moscow','moscú','ukraine','ucrania','kyiv','kiev'], 'Oriente Medio':['iran','irán','israel','gaza','palestine','palestina','qatar','saudi','golfo','hamas','yemen','yemení'], 'Estados Unidos':['united states','usa','u.s.','washington','estados unidos','trump','white house'], 'América Latina':['argentina','brasil','brazil','venezuela','colombia','chile','méxico','mexico'], 'Europa':['europa','europe','european union','unión europea','france','francia','uk','britain','reino unido','alemania','germany'], 'África':['africa','áfrica','sudán','sudan','congo','sahel'], 'Asia-Pacífico':['india','indonesia','japón','japan','asean','pakistan','singapore','corea']}
TOPICS = {'Diplomacia':['diplom','canciller','foreign minister','embajad','negoci','summit','cumbre','relations','relaciones','treaty','tratado'], 'Seguridad y conflictos':['guerra','war','army','military','conflict','militar','attack','ataque','defence','defense','sanction','sancion'], 'Comercio y finanzas':['econom','trade','comercio','financ','tariff','arancel','investment','inversión','banco','export','inflation','inflación','deuda'], 'Organismos multilaterales':['united nations','naciones unidas','security council','consejo de seguridad','onu','oecd','ocde','oit','omc','wto'], 'Energía y clima':['climate','clima','energy','energía','petróleo','oil','gas','renewable','amazonía'], 'Migración y DD. HH.':['migrant','refugee','refugi','migración','migrat','human rights','derechos humanos']}

def load(path, default):
    try:return json.loads(path.read_text(encoding='utf-8'))
    except (OSError,ValueError):return default

def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+ '\n',encoding='utf-8')
    tmp.replace(path)

def clean(x):
    x=re.sub(r'<[^>]*>',' ',x or '')
    return re.sub(r'\s+',' ',html.unescape(x)).strip()

def timeparse(raw):
    if not raw:return None
    try:return email.utils.parsedate_to_datetime(raw).astimezone(UTC)
    except (ValueError,TypeError,AttributeError):
        try:return dt.datetime.fromisoformat(raw.replace('Z','+00:00')).astimezone(UTC)
        except ValueError:return None

def tagname(tag):return tag.rsplit('}',1)[-1].lower()

def children(el,name):return [n for n in el if tagname(n.tag)==name]

def field(el,*keys):
    for key in keys:
        arr=children(el,key)
        if arr:
            text=' '.join(arr[0].itertext()).strip()
            if text:return text
    return ''

def feed_items(xmlbytes):
    # Safe input size cap before parse. No DTD or external entities permitted.
    if len(xmlbytes)>3_000_000:raise ValueError('RSS excede el límite de 3MB')
    if b'<!DOCTYPE' in xmlbytes.upper() or b'<!ENTITY' in xmlbytes.upper():raise ValueError('DTD prohibido')
    root=ET.fromstring(xmlbytes)
    entries=[e for e in root.iter() if tagname(e.tag) in ('item','entry')]
    out=[]
    for el in entries[:50]:
        link=field(el,'link')
        for node in children(el,'link'):
            if node.attrib.get('rel','alternate')=='alternate' and node.attrib.get('href'):
                link=node.attrib['href'];break
        title=clean(field(el,'title'))[:230]
        link=link.strip()
        pub=field(el,'pubdate','published','updated','date')
        excerpt=clean(field(el,'description','summary','subtitle'))[:450]
        if title and link.startswith(('https://','http://')):
            out.append((title,link,pub,excerpt))
    return out

def read_feed(feedurl):
    req=urllib.request.Request(feedurl,headers={'User-Agent':'ELEVA-Observatorio/1.0 (public RSS reader; links to original sources)','Accept':'application/atom+xml,application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.1'})
    with urllib.request.urlopen(req,timeout=18,context=ssl.create_default_context()) as r:
        if r.status!=200:raise ValueError(f'HTTP {r.status}')
        data=r.read(3_000_001)
    return feed_items(data)

def tags(title,excerpt):
    t=(title+' '+excerpt).lower()
    region=[k for k,terms in KEYWORDS.items() if any(term in t for term in terms)]
    topic=[k for k,terms in TOPICS.items() if any(term in t for term in terms)]
    return region[:3] or ['Internacional'],topic[:3] or ['Actualidad']

def score(row):
    n=0
    if row['kind']=='oficial':n+=3
    if 'Perú' in row['regions']:n+=7
    if 'Diplomacia' in row['topics']:n+=4
    if 'Organismos multilaterales' in row['topics']:n+=3
    if 'Comercio y finanzas' in row['topics']:n+=2
    if 'Seguridad y conflictos' in row['topics']:n+=2
    return n

def collect(now=None, reader=read_feed):
    now=now or dt.datetime.now(UTC)
    local=now.astimezone(TZ)
    sources=load(ROOT/'sources.json',[])
    reports=[];new=[];fetched=0;attempted=0
    for src in sources:
        feed=src.get('rss','')
        if not feed or not src.get('activo',True):continue
        attempted+=1
        try:
            rows=reader(feed)
            n=0
            for title,url,published,excerpt in rows:
                stamp=timeparse(published)
                if not stamp or stamp>now+dt.timedelta(hours=12) or stamp<now-dt.timedelta(hours=72):continue
                canonical=url.split('#')[0]
                uid=hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:20]
                regions,topics=tags(title,excerpt)
                row={'id':uid,'title':title,'url':canonical,'published_utc':stamp.isoformat(), 'source_id':src['id'],'source_name':src['nombre'],'country':src['pais'],'kind':src['tipo'],'excerpt':excerpt,'regions':regions,'topics':topics,'captured_utc':now.isoformat(),'verification':'declaración de la fuente; corroboración independiente pendiente' if src['tipo']=='oficial' else 'publicación periodística; corroboración pendiente'}
                new.append(row);n+=1
            reports.append({'source_id':src['id'],'source_name':src['nombre'],'status':'ok','count_recent':n})
            fetched+=1
        except Exception as e:
            reports.append({'source_id':src['id'],'source_name':src['nombre'],'status':'error','message':str(e)[:170]})
        time.sleep(.15)
    yearmonths=set()
    dedup={}
    for row in new:dedup[row['id']]=row
    for row in dedup.values():yearmonths.add(row['published_utc'][:7])
    all_archived={}
    for month in sorted(yearmonths):
        filename=DATA/'archive'/f'{month}.json'
        existing=load(filename,[])
        byid={r['id']:r for r in existing}
        for r in dedup.values():
            if r['published_utc'].startswith(month):byid.setdefault(r['id'],r)
        combined=sorted(byid.values(),key=lambda r:r['published_utc'],reverse=True)
        save(filename,combined)
        all_archived[month]=combined
    index=load(DATA/'manifest.json',{'months':[],'runs':0})
    months=set(index.get('months',[]))|set(yearmonths)
    # Rebuild current timeline from recent months, no deletion of old archives.
    recent=[]
    for month in sorted(months,reverse=True)[:3]:recent+=all_archived.get(month,load(DATA/'archive'/f'{month}.json',[]))
    recent.sort(key=lambda r:r['published_utc'],reverse=True)
    current=recent[:700]
    save(DATA/'current.json',current)
    localdate=local.date().isoformat()
    day_rows=sorted([r for r in recent if r['published_utc'][:10] >= (now-dt.timedelta(hours=36)).date().isoformat()], key=lambda r:(score(r),r['published_utc']),reverse=True)
    save(DATA/'daily'/f'{localdate}.json', {'date':localdate,'generated_utc':now.isoformat(),'items':day_rows[:75],'note':'Selección automática de entradas RSS; NO es un informe de hechos verificados ni análisis con IA.'})
    save(DATA/'manifest.json',{'months':sorted(months,reverse=True),'days':sorted(set(index.get('days',[]))|{localdate},reverse=True),'runs':index.get('runs',0)+1,'last_attempt_utc':now.isoformat(),'last_attempt_lima':local.strftime('%Y-%m-%d %H:%M'),'last_successful_feeds':fetched,'feed_count':attempted,'new_entries_in_recent_feeds':len(dedup),'items_in_current':len(current)})
    save(DATA/'health.json',{'updated_utc':now.isoformat(),'results':reports})
    print(f'Fecha Lima: {localdate}; RSS ok {fetched}/{attempted}; entradas RSS recientes {len(dedup)}; archivo meses {len(months)}')
    return fetched,attempted

if __name__=='__main__':
    result=collect()
    # no false signal: script exits nonzero when all feeds fail, but archives remains viewable
    sys.exit(0 if result[0] else 2)
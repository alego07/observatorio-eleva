import datetime as dt, json, pathlib, tempfile, unittest, sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import seguimiento
class SeguimientoHistorico(unittest.TestCase):
 def test_series_no_confunden_publicacion_con_hecho(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=pathlib.Path(tmp)
   (base/'archive').mkdir()
   now=dt.datetime(2026,10,18,12,0,tzinfo=dt.timezone.utc)
   rows=[
    {'id':'s1','published_utc':'2026-10-18T10:00:00+00:00','title':'China y Taiwán sostienen reuniones','excerpt':'China Taiwan Beijing Taipei','url':'https://example.org/a','source_name':'Fuente A'},
    {'id':'s2','published_utc':'2026-10-17T06:00:00+00:00','title':'China y Taiwán mantienen posiciones','excerpt':'China Taiwan','url':'https://example.org/b','source_name':'Fuente B'},
    {'id':'s3','published_utc':'2026-10-18T06:00:00+00:00','title':'Nuevas reuniones de la ONU','excerpt':'United Nations Security Council','url':'https://example.org/c','source_name':'Fuente C'}
   ]
   (base/'archive'/'2026-10.json').write_text(json.dumps(rows),encoding='utf8')
   out=seguimiento.make(now,base)
   theme=next(t for t in out if t['id']=='china-taiwan')
   self.assertEqual(theme['cantidad_archivada'],2)
   self.assertEqual(theme['nuevas_24h'],1)
   self.assertEqual(theme['anteriores_24h'],1)
   self.assertIn('no verifica cambios',theme['estado'])
   self.assertEqual(len(theme['publicaciones']),2)
   persisted=json.loads((base/'seguimiento.json').read_text(encoding='utf8'))
   self.assertEqual(persisted['temas'][0]['id'],out[0]['id'])
 def test_actor_no_relacionado_no_hereda_diplomacia(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=pathlib.Path(tmp);(base/'archive').mkdir()
   (base/'archive'/'2026-10.json').write_text(json.dumps([{'id':'z1','title':'Local sports match','excerpt':'result today','source_name':'X','url':'https://example.org/x','published_utc':'2026-10-18T08:00:00+00:00'}]))
   out=seguimiento.make(dt.datetime(2026,10,18,12,tzinfo=dt.timezone.utc),base)
   self.assertEqual(sum(t['cantidad_archivada'] for t in out),0)
if __name__=='__main__':unittest.main()
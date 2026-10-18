import datetime as dt, importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('collector',pathlib.Path(__file__).resolve().parents[1]/'collector.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class Tests(unittest.TestCase):
 def test_rss(self):
  rss=b'<rss><channel><item><title>Peru: Nuevo tratado</title><link>https://example.org/uno</link><pubDate>Sun, 18 Oct 2026 10:00:00 GMT</pubDate><description>Declaracion publica oficial</description></item></channel></rss>'
  v=c.feed_items(rss);self.assertEqual(len(v),1);self.assertEqual(v[0][0],'Peru: Nuevo tratado')
 def test_atom(self):
  xml=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Talks</title><link rel="alternate" href="https://example.org/dos"/><updated>2026-10-18T10:00:00Z</updated><summary>Official announcement</summary></entry></feed>'
  v=c.feed_items(xml);self.assertEqual(v[0][1],'https://example.org/dos')
 def test_archive_and_replay(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);(root/'sources.json').write_text(json.dumps([{'id':'xx','nombre':'Cancillería ficticia','pais':'Perú','tipo':'oficial','rss':'https://example.org/rss','activo':True}]))
   now=dt.datetime(2026,10,18,13,0,tzinfo=dt.timezone.utc)
   def reader(url):return [('Tratado Peru-A','https://example.org/uno','Sun, 18 Oct 2026 11:00:00 GMT','Nuevo tratado')]
   with patch.object(c,'ROOT',root),patch.object(c,'DATA',root/'data'),patch.object(c.time,'sleep',return_value=None):
    a=c.collect(now,reader=reader)
    b=c.collect(now,reader=reader)
   rows=json.loads((root/'data/archive/2026-10.json').read_text());self.assertEqual(a,(1,1));self.assertEqual(b,(1,1));self.assertEqual(len(rows),1)
   self.assertEqual(json.loads((root/'data/manifest.json').read_text())['runs'],2)
 def test_no_fabrication(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);(root/'sources.json').write_text(json.dumps([{'id':'x','nombre':'Bloqueada','pais':'País','tipo':'medio','rss':'https://example.org/rss','activo':True}]))
   with patch.object(c,'ROOT',root),patch.object(c,'DATA',root/'data'),patch.object(c.time,'sleep',return_value=None):
    ok,total=c.collect(dt.datetime(2026,10,18,13,0,tzinfo=dt.timezone.utc),reader=lambda u: (_ for _ in ()).throw(ValueError('HTTP 403')))
   self.assertEqual((ok,total),(0,1));self.assertEqual(json.loads((root/'data/current.json').read_text()),[])
if __name__=='__main__':unittest.main()
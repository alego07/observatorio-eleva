import json
import pathlib
import unittest
BASE=pathlib.Path(__file__).resolve().parents[1]
class AnalisisIATest(unittest.TestCase):
 def setUp(self):
  self.cases=json.loads((BASE/'editorial.json').read_text(encoding='utf8'))
 def test_four_cases_researched(self):
  self.assertGreaterEqual(len(self.cases),4)
  self.assertEqual(len({x['id'] for x in self.cases}),len(self.cases))
 def test_all_ia_conclusions_grounded(self):
  for e in self.cases:
   self.assertGreaterEqual(len(e.get('fuentes',[])),3)
   ai=e.get('analisis_ia',{})
   self.assertTrue(ai.get('actualizado'))
   for item in ai.get('conclusiones',[]):
    for key in ('evidencia','inferencia','fundamento','teoria','limite'):
     self.assertGreater(len(item.get(key,'')),18, (e['id'],key))
    self.assertTrue(item.get('fuentes'))
    for i in item['fuentes']:
     self.assertGreaterEqual(i,0)
     self.assertLess(i,len(e['fuentes']))
 def test_facts_and_theory_separated(self):
  for e in self.cases:
   for a in e['actores']:
    self.assertTrue(a.get('posicion'))
    self.assertTrue(a.get('interes'))
 def test_ia_does_not_claim_automatic_daily_llm(self):
  src=(BASE/'app.js').read_text(encoding='utf8')
  self.assertIn('no se regeneran automáticamente',src)
  self.assertIn('renderInterpretacion()',src)
if __name__=='__main__': unittest.main()
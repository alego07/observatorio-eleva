import json
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]

class ExpedientesDocumentados(unittest.TestCase):
    def test_referencias_siempre_resuelven(self):
        for caso in json.loads((ROOT/'editorial.json').read_text(encoding='utf8')):
            fuentes=caso['fuentes']
            self.assertGreaterEqual(len(fuentes),2)
            self.assertTrue(all(f['url'].startswith('https://') for f in fuentes))
            for tema in ['cronologia','detalles','juridico','teorias']:
                for entrada in caso.get(tema,[]):
                    self.assertTrue(all(isinstance(i,int) and 0 <= i < len(fuentes) for i in entrada.get('fuentes',[])),(caso['id'],tema))
    def test_profundo_con_informacion_relevante(self):
        for caso in json.loads((ROOT/'editorial.json').read_text(encoding='utf8')):
            if caso.get('profundidad')=='profundo':
                self.assertGreaterEqual(len(caso.get('cronologia',[])),3)
                self.assertGreaterEqual(len(caso.get('teorias',[])),1)
                self.assertGreaterEqual(len(caso.get('detalles',[])),2)
                self.assertIn('Perú',caso.get('peru',''))

if __name__ == '__main__': unittest.main()
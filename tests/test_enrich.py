import unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import enrich
class Enriquecimiento(unittest.TestCase):
    def test_actores_mencionados(self):
        a=enrich.actors('Ucrania y Rusia realizan negociaciones con Estados Unidos')
        self.assertIn('Ucrania',a)
        self.assertIn('Rusia',a)
        self.assertIn('Estados Unidos',a)
    def test_no_inventar_actores(self):
        self.assertEqual(enrich.actors('Conferencia internacional sobre finanzas'),[])
    def test_palabras_comunes_se_omiten(self):
        self.assertNotIn('the',enrich.tokens('the latest development in the world'))
if __name__=='__main__': unittest.main()
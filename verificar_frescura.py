#!/usr/bin/env python3
"""Falla una publicación cuando no existe un reporte de hoy con datos.
La fecha se determina en America/Lima; no presume que el feed esté verificado.
"""
import datetime as dt
import json
import pathlib
import sys
from zoneinfo import ZoneInfo

BASE = pathlib.Path(__file__).resolve().parent
HOY = dt.datetime.now(ZoneInfo("America/Lima")).date().isoformat()

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def comprobar(base=BASE, hoy=HOY):
    errores=[]
    archivo=base/"data"/"manifest.json"
    if not archivo.is_file():
        return ["Falta el manifiesto de actualización"]
    manifest=read(archivo)
    if str(manifest.get("last_attempt_lima",""))[:10] != hoy:
        errores.append("Último intento no corresponde al día de Lima: "+str(manifest.get("last_attempt_lima")))
    if int(manifest.get("last_successful_feeds",0))<1:
        errores.append("Ninguna fuente RSS respondió")
    diario=base/"data"/"daily"/(hoy+".json")
    if not diario.is_file():
        errores.append("No se generó informe diario "+hoy)
    else:
        data=read(diario)
        if data.get("date")!=hoy: errores.append("Fecha del informe distinta de hoy")
        if not data.get("items"): errores.append("Informe diario no contiene publicaciones")
    return errores

if __name__=="__main__":
    errs=comprobar()
    if errs:
        print("ELEVA - INCOMPLETE: "+"; ".join(errs),file=sys.stderr)
        sys.exit(1)
    print("ELEVA - recopilación de hoy validada:",HOY)

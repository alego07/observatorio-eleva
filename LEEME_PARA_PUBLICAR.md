# Observatorio Geopolítico ELEVA — Web pública gratuita

**Entrega:** sitio web estático interactivo, archivos históricos persistentes por mes y recopilador RSS/Atom con tareas de GitHub Actions. No usa servicios de IA de pago ni requiere Python en tu computadora. 

## Qué hace y qué no hace

- Navegación: panorama, expedientes temáticos, cronologías, contraste de publicaciones, análisis de interés peruano en forma de preguntas, fuentes y archivo histórico.
- Consulta gratuita automáticamente solo los RSS/Atom que tengan una dirección configurada y respondan al servidor de GitHub. El catálogo general de medios NO equivale a cobertura automatizada.
- Dos intentos programados a las **06:15 y 07:15 hora de Lima** para que haya contenido nuevo hacia las **08:00**. **GitHub no garantiza que ejecute exactamente en el minuto programado.** La página indica cuándo ocurrió la última consulta y cuántas fuentes respondieron.
- Archiva por mes; los registros históricos se guardan en el repositorio. No se convierten titulares en noticias «verificadas» por sí solos. No utiliza IA para evaluar motivaciones de gobiernos ni garantizar explicaciones de background completas. Nunca muestra ejemplos inventados como noticias reales.
- Repositorio y sitio serán **públicos**. No almacenes notas privadas, contraseñas ni claves en el repositorio. Las notas hechas dentro de cada artículo quedan en `localStorage` del dispositivo.
- Algunos medios no proporcionan canales abiertos, limitan el acceso automatizado o tienen derechos de reproducción. El producto enlaza al artículo original y almacena solo título y pequeño extracto publicado en el RSS.

## Para publicarlo sin costo con GitHub Pages

1. Crea o conecta una cuenta gratuita en **GitHub**. No hace falta Replit ni Python.
2. Crea un repositorio público, por ejemplo `observatorio-eleva`.
3. Sube **el contenido de esta carpeta en la raíz del repositorio**, incluida la carpeta `.github` oculta. Si trabajas directamente conmigo con el conector de GitHub, puedo ayudarte con la publicación sin que tengas que usar Terminal.
4. Abre **Settings > Pages > Build and deployment** y selecciona **GitHub Actions**.
5. En **Actions** ejecuta `ELEVA | Actualizar y publicar` mediante **Run workflow** (o espera a que el push principal lo inicie). El sitio aparecerá en el enlace Pages del repositorio cuando el despliegue termine.
6. El calendario funciona incluso con tu Mac apagada, aunque los horarios de ejecución pueden retrasarse y una fuente puede no responder.

## Puntos de control

- La primera ejecución puede comenzar sin artículos. El panel debe indicar «sin publicaciones», no simular actualidad.
- Revisar `Fuentes` para identificar de manera individual qué canales RSS están operativos y cuáles han fallado.
- Las actualizaciones a `data/archive/*.json` se incorporan mediante commits automáticos, preservando el registro histórico de modificaciones de GitHub.
- Para incorporar fuentes nuevas modifica `sources.json`, aprobando antes sus dominios y condiciones de uso.
- Para modificar criterios de relevancia, secciones temáticas o feeds, cambia `collector.py`; el flujo de publicación no requiere servicios adicionales.

## Limitaciones conocidas

- Los 73 registros incluyen medios sin RSS configurado; actualmente se suministran 13 URL de RSS candidatas, no verificadas desde el entorno de construcción por falta de red. Los errores de cada feed se mostrarán después de la primera ejecución real de GitHub Actions.
- Un título no constituye una verificación. Los análisis históricos y de intereses profundos necesitan trabajo editorial adicional o una integración de IA que no está incluida gratuitamente por defecto.
- GitHub Actions puede sufrir retrasos, interrupciones y límites de plataforma; por ello no se promete entrega puntual garantizada ni cobertura exhaustiva.
- Para evitar costos no se incluye una base de datos de pago: el archivo es JSON público versionado por meses, adecuado para iniciar un observatorio personal de noticias.

## Prueba automatizada

Ejecuté pruebas locales con datos sintéticos, sin contacto con noticias reales, para validación del parser RSS/Atom, archivo histórico sin duplicados y tratamiento explícito de errores. **No es una prueba de acceso real a los 13 RSS**.
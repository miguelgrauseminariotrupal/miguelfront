# Resultados de gráficos y reportes para el frontend

El frontend renderiza resultados de herramientas en mensajes UIMessage del chat (stream AI SDK existente). No genera consultas ni interpreta texto libre como datos. El backend interpreta la solicitud, consulta los datos autorizados y emite un resultado de herramienta `output-available`. Estos nombres y formatos son el contrato propuesto para conectar ambos lados; todavía no se encontraron estas herramientas en el backend del repositorio.

## Gráficos

Nombre de herramienta: `generar_grafico` (también se aceptan `crear_grafico`, `mostrar_grafico` y `graficar`).

```json
{
  "titulo": "Asistencia de la sección",
  "tipo": "circular",
  "etiquetas": ["Presentes", "Ausentes", "Tardanzas"],
  "valores": [22, 3, 2]
}
```

Tipos disponibles: `circular`/`pie`, `dona`/`doughnut`, `barras`/`bar`, `lineas`/`line`. El tipo enviado por el backend tiene prioridad. Si se omite, el frontend reconoce barras, líneas o dona en la última consulta del usuario; en otro caso usa circular. La interpretación de solicitudes complejas corresponde al chatbot del backend.

Para barras o líneas con varias series:

```json
{
  "titulo": "Asistencia por bimestre",
  "tipo": "barras",
  "etiquetas": ["I", "II", "III"],
  "series": [
    { "nombre": "Presentes", "valores": [22, 23, 24] },
    { "nombre": "Ausentes", "valores": [5, 4, 3] }
  ]
}
```

Cada serie debe tener un número finito por etiqueta. Circular y dona aceptan una sola serie, sin valores negativos. También se acepta `datos: [{ etiqueta, valor }]`. Un resultado inválido muestra un mensaje y no rompe la conversación.

## Excel

Nombre de herramienta: `exportar_excel`.

```json
{
  "titulo": "Reporte de asistencia",
  "columnas": ["Alumno", "Presentes", "Ausentes"],
  "filas": [
    ["Ana Pérez", 22, 3],
    ["Luis García", 24, 1]
  ]
}
```

También se admiten columnas `{ "titulo": "Alumno", "clave": "alumno" }` y filas como objetos con esas claves. Las celdas pueden ser texto, número, booleano o null. El frontend muestra las primeras diez filas y descarga todas en un `.xlsx` generado en el navegador con ExcelJS. No necesita Storage ni URL de descarga del backend. Los textos se escriben como texto, nunca como fórmulas.

## Prueba de integración

1. Pedir al chat «Muéstrame un gráfico de asistencia» y verificar el resultado `generar_grafico` con tipo circular o sin tipo.
2. Pedir «Muéstrame un gráfico de barras de asistencia por bimestre» y verificar tipo barras.
3. Pedir «Exporta la asistencia a Excel» y verificar el resultado `exportar_excel`.
4. Pulsar «Descargar Excel» y abrir el archivo; comprobar encabezados, tipos de celdas y todas las filas.

El frontend por sí solo no puede producir estos resultados si el backend únicamente envía texto o no invoca las herramientas.

## Reportes en otros formatos

También se aceptan las herramientas `generar_reporte` y `exportar_reporte` con la misma tabla (`titulo`, `columnas`, `filas`). Agregar `formato: "pdf"` o `formatos: ["pdf", "docx"]` al resultado para seleccionar los formatos. Disponibles: `xlsx`, `pdf`, `docx`, `csv`, `json`, `txt`, `html`. Los alias `excel`, `word` y `texto` también se aceptan.

Si no se envía el formato, el frontend lo reconoce en la última consulta del usuario; si tampoco se especificó allí, selecciona Excel. Cada tarjeta permite cambiar de formato y descargar los mismos datos varias veces. También se admiten `exportar_pdf`, `exportar_word` y `exportar_csv`.

Todas las descargas incluyen todas las filas. PDF organiza los registros con cada campo identificado y agrega páginas automáticamente; Word contiene una tabla. Estos formatos exportan la tabla recibida, no generan información ni resúmenes adicionales. Las bibliotecas se cargan al descargar.

Como alternativa para el backend actual, si una respuesta completa contiene tablas Markdown y el usuario pidió un reporte o formato de archivo, el frontend muestra tarjetas de descarga para esas tablas. Exporta solo el contenido recibido; no genera datos a partir de una negativa del chatbot. No duplica tarjetas si ya se recibió una herramienta de reporte. El backend debería evitar decir que el usuario tiene que copiar y pegar: debe enviar la tabla o invocar la herramienta correspondiente.

Las herramientas de reporte también muestran la descarga únicamente cuando la consulta del usuario solicita un reporte o exportación. El chatbot no tiene botón general de Excel ni descargas automáticas por cada mensaje o tabla de una respuesta normal.

En los demás módulos, los botones por bloque y el botón de cabecera exportan únicamente tablas y listas de datos. No se exportan textos descriptivos, conversaciones, paneles informativos ni hojas adicionales con el contenido completo de la pantalla.

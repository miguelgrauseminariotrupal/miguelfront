// Repara catálogos antiguos que llegaron con títulos y opciones en un mismo párrafo.
export function formatAgentMessage(text) {
  if (!/competencias disponibles/i.test(text)) return text;
  return text.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g).map((block, index) => {
    if (index % 2) return block;
    return block.replace(/^(Competencias disponibles:\s*)?(Arte y Cultura|Ciencia y Tecnología|Comunicación|Educación Física|Educación Religiosa|Inglés|Matemática|Personal Social)\s+(?=\d+\.\s)/gm,
      (_, label, area) => `${label ? '## Competencias disponibles\n\n' : ''}### ${area}\n\n`)
      .replace(/^(Competencias disponibles:)\s*(Arte y Cultura|Ciencia y Tecnología|Comunicación|Educación Física|Educación Religiosa|Inglés|Matemática|Personal Social)\s*$/gm,
        (_, label, area) => `## ${label.slice(0, -1)}\n\n### ${area}`)
      .replace(/^(\d+\. .+)$/gm, line => line.replace(/\s+(?=\d+\.\s+\p{Lu})/gu, '\n'));
  }).join('');
}

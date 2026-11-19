const LEVELS = ['AD', 'A', 'B', 'C'];

export function calculateAchievement(grades) {
  if (!grades.length || grades.some(grade => !LEVELS.includes(grade))) return '';
  const counts = LEVELS.map(level => grades.filter(grade => grade === level).length);
  const highest = Math.max(...counts);
  // Si hay repeticiones, gana la moda; en empate, el nivel más favorable.
  if (highest > 1) return LEVELS[counts.indexOf(highest)];
  const ordered = LEVELS.filter(level => grades.includes(level));
  // Entre dos valores centrales se elige el más favorable al alumno.
  return ordered[Math.floor((ordered.length - 1) / 2)];
}

export function achievementFromCapacities(competency, scores) {
  if (!competency.capacitiesLoaded) return '';
  return calculateAchievement(competency.capacities.map(capacity => scores[`capacity-${capacity.id_capacidad}`]));
}

export function scoreUpdates(competencies, scores, key, value) {
  const updates = { [key]: value };
  if (!key.startsWith('capacity-')) return updates;
  const competency = competencies.find(item => item.capacities.some(capacity => `capacity-${capacity.id_capacidad}` === key));
  if (competency && scores.noteIds?.[`level-${competency.id_competencia}`]) {
    updates[`level-${competency.id_competencia}`] = achievementFromCapacities(competency, { ...scores, ...updates });
  }
  return updates;
}

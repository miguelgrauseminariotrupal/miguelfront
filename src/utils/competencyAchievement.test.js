import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAchievement, achievementFromCapacities, scoreUpdates } from './competencyAchievement.js';

test('usa la moda y resuelve empates a favor del alumno', () => {
  for (const [grades, expected] of [
    [['A', 'A', 'A', 'B'], 'A'],
    [['A', 'A', 'B', 'B'], 'A'],
    [['C', 'B', 'C', 'B'], 'B'],
    [['AD', 'A', 'A', 'A'], 'A'],
    [['C', 'C', 'C', 'AD'], 'C'],
  ]) assert.equal(calculateAchievement(grades), expected);
});

test('sin repeticiones toma la mediana favorable, independiente del orden', () => {
  assert.equal(calculateAchievement(['AD', 'A', 'B', 'C']), 'A');
  assert.equal(calculateAchievement(['C', 'B', 'A', 'AD']), 'A');
  assert.equal(calculateAchievement(['C', 'AD', 'B']), 'B');
  assert.equal(calculateAchievement(['B', 'A']), 'A');
  assert.equal(calculateAchievement(['AD']), 'AD');
});

test('espera que todas las capacidades tengan calificaciones válidas', () => {
  for (const grades of [[], ['A', ''], ['A', undefined], ['A', 'X']]) assert.equal(calculateAchievement(grades), '');
  assert.equal(achievementFromCapacities({ capacitiesLoaded: false, capacities: [] }, {}), '');
});

test('actualiza la competencia junto a su capacidad y permite corregirla manualmente', () => {
  const competencies = [{ id_competencia: 7, capacitiesLoaded: true, capacities: [1, 2, 3, 4].map(id_capacidad => ({ id_capacidad })) }];
  let scores = { 'capacity-1': 'AD', 'capacity-2': 'A', 'capacity-3': 'A', 'capacity-4': '', noteIds: { 'level-7': 99 } };
  const automatic = scoreUpdates(competencies, scores, 'capacity-4', 'A');
  assert.deepEqual(automatic, { 'capacity-4': 'A', 'level-7': 'A' });
  scores = { ...scores, ...automatic };
  const manual = scoreUpdates(competencies, scores, 'level-7', 'B');
  assert.deepEqual(manual, { 'level-7': 'B' });
  scores = { ...scores, ...manual };
  assert.deepEqual(scoreUpdates(competencies, scores, 'comment-7', 'Buen avance'), { 'comment-7': 'Buen avance' });
  assert.deepEqual(scoreUpdates(competencies, scores, 'capacity-4', ''), { 'capacity-4': '', 'level-7': '' });
  assert.deepEqual(scoreUpdates(competencies, { ...scores, noteIds: {} }, 'capacity-4', 'A'), { 'capacity-4': 'A' });
});

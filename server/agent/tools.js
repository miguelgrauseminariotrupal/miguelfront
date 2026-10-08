import { tool } from 'ai';
import { z } from 'zod';
import { academico } from './academico.js';

const estado = z
  .boolean()
  .optional()
  .describe('true = solo activos, false = solo inactivos; omitir para todos');

export const tools = {
  listar_anios_lectivos: tool({
    description: 'Lista los aÃ±os lectivos (id_anio_lectivo, anio, nombre, estado).',
    inputSchema: z.object({ estado }),
    execute: (input) => academico('anios-lectivos', input),
  }),

  listar_niveles: tool({
    description:
      'Lista los niveles (Inicial, Primaria, Secundaria...) de un aÃ±o lectivo.',
    inputSchema: z.object({
      id_anio_lectivo: z.number().int().optional(),
      estado,
    }),
    execute: (input) => academico('niveles', input),
  }),

  listar_grados: tool({
    description: 'Lista los grados de un nivel.',
    inputSchema: z.object({
      id_nivel: z.number().int().optional(),
      estado,
    }),
    execute: (input) => academico('grados', input),
  }),

  listar_secciones: tool({
    description: 'Lista las secciones (A, B, C...) de un grado.',
    inputSchema: z.object({
      id_grado: z.number().int().optional(),
      estado,
    }),
    execute: (input) => academico('secciones', input),
  }),

  listar_cursos: tool({
    description: 'Lista los cursos de un aÃ±o lectivo.',
    inputSchema: z.object({
      id_anio_lectivo: z.number().int().optional(),
      estado,
    }),
    execute: (input) => academico('cursos', input),
  }),

  listar_matriculas: tool({
    description:
      'Lista los alumnos matriculados. Se puede filtrar por aÃ±o, nivel, ' +
      'grado, secciÃ³n y buscar por nombre, apellidos o DNI con "q".',
    inputSchema: z.object({
      id_anio_lectivo: z.number().int().optional(),
      id_nivel: z.number().int().optional(),
      id_grado: z.number().int().optional(),
      id_seccion: z.number().int().optional(),
      q: z.string().optional().describe('Nombre, apellidos o DNI del alumno'),
      estado,
    }),
    execute: (input) => academico('matriculas', input),
  }),

  obtener_docente_responsable: tool({
    description: 'Docente que dicta un curso en una secciÃ³n.',
    inputSchema: z.object({
      id_seccion: z.number().int(),
      id_curso: z.number().int(),
    }),
    execute: (input) => academico('docente-responsable', input),
  }),

  obtener_notas: tool({
    description:
      'Notas de un alumno en un curso: por competencia, la nota final y las ' +
      'de cada bimestre con sus capacidades. Necesita id_matricula (de ' +
      'listar_matriculas) e id_curso (de listar_cursos).',
    inputSchema: z.object({
      id_matricula: z.number().int(),
      id_curso: z.number().int(),
    }),
    execute: (input) => academico('notas-matricula-curso', input),
  }),

  listar_asistencias: tool({
    description:
      'Asistencias de un alumno (por id_matricula), con rango de fechas opcional.',
    inputSchema: z.object({
      id_matricula: z.number().int(),
      fecha: z.string().optional().describe('YYYY-MM-DD'),
      fecha_desde: z.string().optional().describe('YYYY-MM-DD'),
      fecha_hasta: z.string().optional().describe('YYYY-MM-DD'),
    }),
    execute: (input) => academico('asistencias', input),
  }),
};


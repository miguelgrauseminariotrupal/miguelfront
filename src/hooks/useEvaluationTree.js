import { useCallback, useEffect, useRef, useState } from "react";
import { getAniosLectivos } from "../services/aniosLectivos.service";
import { getAprendizajes } from "../services/aprendizajes.service";
import { getCursos } from "../services/cursos.service";
import { getCompetencias } from "../services/competencias.service";
import { getCapacidades } from "../services/capacidades.service";
import { createLazyRecords } from "../utils/lazyRecords";

const empty = { anios: [], aprendizajes: [], cursos: [], competencias: [], capacidades: [] };
const ids = { cursos: "id_curso", competencias: "id_competencia", capacidades: "id_capacidad" };

export default function useEvaluationTree(onError) {
  const [data, setData] = useState(empty);
  const [pending, setPending] = useState(0);
  const session = useRef(null);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;

  const request = useCallback(async (key, field, fetchRecords) => {
    const active = session.current;
    if (!active || active.controller.signal.aborted) return [];
    setPending((count) => count + 1);
    try {
      const items = await active.cache.load(key, () => fetchRecords(active.controller.signal));
      if (session.current === active && !active.controller.signal.aborted) {
        setData((current) => {
          const records = new Map(current[field].map((item) => [String(item[ids[field]]), item]));
          items.forEach((item) => records.set(String(item[ids[field]]), item));
          return { ...current, [field]: [...records.values()] };
        });
      }
      return items;
    } catch (error) {
      if (session.current === active && error.name !== "AbortError") errorHandler.current(error);
      return [];
    } finally {
      if (session.current === active) setPending((count) => count - 1);
    }
  }, []);
  const loadLearning = useCallback((learning) => request(`year:${learning.id_anio_lectivo}`, "cursos", (signal) => getCursos(learning.id_anio_lectivo, { signal })), [request]);
  const loadCourse = useCallback((learning, course) => request(`learning:${learning.id_aprendizaje}:course:${course.id_curso}`, "competencias", (signal) => getCompetencias({ id_aprendizaje: learning.id_aprendizaje, id_curso: course.id_curso, signal })), [request]);
  const loadCompetency = useCallback((competency) => request(`competency:${competency.id_competencia}`, "capacidades", (signal) => getCapacidades({ id_competencia: competency.id_competencia, signal })), [request]);
  const load = useCallback(async () => {
    session.current?.controller.abort();
    const active = { controller: new AbortController(), cache: createLazyRecords() };
    session.current = active;
    setPending(1);
    setData(empty);
    try {
      const anios = await getAniosLectivos({ signal: active.controller.signal });
      const aprendizajes = await getAprendizajes({ signal: active.controller.signal });
      if (session.current !== active || active.controller.signal.aborted) return;
      setData({ ...empty, anios, aprendizajes });
      const learning = aprendizajes[0];
      if (learning) {
        const courses = await loadLearning(learning);
        if (session.current !== active) return;
        if (courses[0]) {
          const competencies = await loadCourse(learning, courses[0]);
          if (session.current !== active) return;
          if (competencies[0]) await loadCompetency(competencies[0]);
        }
      }
    } catch (error) {
      if (session.current === active && error.name !== "AbortError") errorHandler.current(error);
    } finally {
      if (session.current === active) setPending((count) => count - 1);
    }
  }, [loadLearning, loadCourse, loadCompetency]);
  useEffect(() => { load(); return () => session.current?.controller.abort(); }, [load]);
  return { data, loading: pending > 0, load, loadLearning, loadCourse, loadCompetency };
}

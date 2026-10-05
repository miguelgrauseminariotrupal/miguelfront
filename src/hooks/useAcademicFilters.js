import { useEffect, useState } from "react";
import { getAniosLectivos } from "../services/aniosLectivos.service";
import { getNiveles } from "../services/niveles.service";
import { getGrados } from "../services/grados.service";
import { getSecciones } from "../services/secciones.service";
import { currentAcademicYearId } from "../utils/academicYear";

const emptySelection = { anio: "", nivel: "", grado: "", seccion: "" };
const emptyLists = { anios: [], niveles: [], grados: [], secciones: [] };
const emptyLoading = { anios: false, niveles: false, grados: false, secciones: false };
const emptyErrors = { anios: "", niveles: "", grados: "", secciones: "" };

export default function useAcademicFilters() {
  const [selection, setSelection] = useState(emptySelection);
  const [lists, setLists] = useState(emptyLists);
  const [loading, setLoading] = useState(emptyLoading);
  const [errors, setErrors] = useState(emptyErrors);
  const [opened, setOpened] = useState({ niveles: false, grados: false, secciones: false });

  useEffect(() => {
    const controller = new AbortController();
    setLoading((state) => ({ ...state, anios: true }));
    getAniosLectivos({ signal: controller.signal })
      .then(async (anios) => {
        if (controller.signal.aborted) return;
        setLists((state) => ({ ...state, anios }));
        const currentId = currentAcademicYearId(anios);
        if (currentId) await selectAnio(currentId);
      })
      .catch((error) => { if (error.name !== "AbortError") setErrors((state) => ({ ...state, anios: error.message })); })
      .finally(() => { if (!controller.signal.aborted) setLoading((state) => ({ ...state, anios: false })); });
    return () => controller.abort();
  }, []);

  const selectAnio = async (anio) => {
    setSelection({ anio, nivel: "", grado: "", seccion: "" });
    setOpened({ niveles: false, grados: false, secciones: false });
    setLoading((state) => ({ ...state, niveles: false, grados: false, secciones: false }));
    setLists((state) => ({ ...state, niveles: [], grados: [], secciones: [] }));
    setErrors((state) => ({ ...state, niveles: "", grados: "", secciones: "" }));
  };

  useEffect(() => {
    if (!selection.anio || !opened.niveles) return;
    const controller = new AbortController();
    const anio = selection.anio;
    async function load() {
    setLoading((state) => ({ ...state, niveles: true }));
    try {
      const niveles = await getNiveles(anio, { signal: controller.signal });
      if (!controller.signal.aborted) setLists((state) => ({ ...state, niveles }));
    }
    catch (error) { if (!controller.signal.aborted) setErrors((state) => ({ ...state, niveles: error.message })); }
    finally { if (!controller.signal.aborted) setLoading((state) => ({ ...state, niveles: false })); }
    }
    load(); return () => controller.abort();
  }, [selection.anio, opened.niveles]);

  const selectNivel = async (nivel) => {
    setSelection((state) => ({ ...state, nivel, grado: "", seccion: "" }));
    setOpened((state) => ({ ...state, grados: false, secciones: false }));
    setLoading((state) => ({ ...state, grados: false, secciones: false }));
    setLists((state) => ({ ...state, grados: [], secciones: [] }));
    setErrors((state) => ({ ...state, grados: "", secciones: "" }));
  };

  useEffect(() => {
    if (!selection.nivel || !opened.grados) return;
    const controller = new AbortController();
    const nivel = selection.nivel;
    async function load() {
    setLoading((state) => ({ ...state, grados: true }));
    try {
      const grados = await getGrados(nivel, { signal: controller.signal });
      if (!controller.signal.aborted) setLists((state) => ({ ...state, grados }));
    }
    catch (error) { if (!controller.signal.aborted) setErrors((state) => ({ ...state, grados: error.message })); }
    finally { if (!controller.signal.aborted) setLoading((state) => ({ ...state, grados: false })); }
    }
    load(); return () => controller.abort();
  }, [selection.nivel, opened.grados]);

  const selectGrado = async (grado) => {
    setSelection((state) => ({ ...state, grado, seccion: "" }));
    setOpened((state) => ({ ...state, secciones: false }));
    setLoading((state) => ({ ...state, secciones: false }));
    setLists((state) => ({ ...state, secciones: [] }));
    setErrors((state) => ({ ...state, secciones: "" }));
  };

  useEffect(() => {
    if (!selection.grado || !opened.secciones) return;
    const controller = new AbortController();
    const grado = selection.grado;
    async function load() {
    setLoading((state) => ({ ...state, secciones: true }));
    try {
      const secciones = await getSecciones(grado, { signal: controller.signal });
      if (!controller.signal.aborted) setLists((state) => ({ ...state, secciones }));
    }
    catch (error) { if (!controller.signal.aborted) setErrors((state) => ({ ...state, secciones: error.message })); }
    finally { if (!controller.signal.aborted) setLoading((state) => ({ ...state, secciones: false })); }
    }
    load(); return () => controller.abort();
  }, [selection.grado, opened.secciones]);

  const selectSeccion = (seccion) => setSelection((state) => ({ ...state, seccion }));
  const openList = (field) => { setErrors((state) => ({ ...state, [field]: "" })); setOpened((state) => ({ ...state, [field]: errors[field] || !state[field] ? (state[field] || 0) + 1 : state[field] })); };
  return { selection, lists, loading, errors, opened, openList, selectAnio, selectNivel, selectGrado, selectSeccion };
}

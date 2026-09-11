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

  useEffect(() => {
    const controller = new AbortController();
    setLoading((state) => ({ ...state, anios: true }));
    getAniosLectivos({ signal: controller.signal })
      .then(async (anios) => {
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
    setLists((state) => ({ ...state, niveles: [], grados: [], secciones: [] }));
    setErrors((state) => ({ ...state, niveles: "", grados: "", secciones: "" }));
    if (!anio) return;
    setLoading((state) => ({ ...state, niveles: true }));
    try {
      const niveles = await getNiveles(anio);
      setLists((state) => ({ ...state, niveles }));
    }
    catch (error) { setErrors((state) => ({ ...state, niveles: error.message })); }
    finally { setLoading((state) => ({ ...state, niveles: false })); }
  };

  const selectNivel = async (nivel) => {
    setSelection((state) => ({ ...state, nivel, grado: "", seccion: "" }));
    setLists((state) => ({ ...state, grados: [], secciones: [] }));
    setErrors((state) => ({ ...state, grados: "", secciones: "" }));
    if (!nivel) return;
    setLoading((state) => ({ ...state, grados: true }));
    try {
      const grados = await getGrados(nivel);
      setLists((state) => ({ ...state, grados }));
    }
    catch (error) { setErrors((state) => ({ ...state, grados: error.message })); }
    finally { setLoading((state) => ({ ...state, grados: false })); }
  };

  const selectGrado = async (grado) => {
    setSelection((state) => ({ ...state, grado, seccion: "" }));
    setLists((state) => ({ ...state, secciones: [] }));
    setErrors((state) => ({ ...state, secciones: "" }));
    if (!grado) return;
    setLoading((state) => ({ ...state, secciones: true }));
    try {
      const secciones = await getSecciones(grado);
      setLists((state) => ({ ...state, secciones }));
    }
    catch (error) { setErrors((state) => ({ ...state, secciones: error.message })); }
    finally { setLoading((state) => ({ ...state, secciones: false })); }
  };

  const selectSeccion = (seccion) => setSelection((state) => ({ ...state, seccion }));
  return { selection, lists, loading, errors, selectAnio, selectNivel, selectGrado, selectSeccion };
}

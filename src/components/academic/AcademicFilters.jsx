import { useEffect } from "react";
import useAcademicFilters from "../../hooks/useAcademicFilters";

function FieldMessage({ loading, error, enabled, items, emptyText }) {
  if (loading) return <span className="academic-field__message">Cargando...</span>;
  if (error) return <span className="academic-field__message is-error" role="alert">{error}</span>;
  if (enabled && items.length === 0) return <span className="academic-field__message">{emptyText}</span>;
  return <span className="academic-field__message" aria-hidden="true">&nbsp;</span>;
}

export default function AcademicFilters({ onSelectionChange }) {
  const { selection, lists, loading, errors, selectAnio, selectNivel, selectGrado, selectSeccion } = useAcademicFilters();

  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  return (
    <section className="academic-filters" aria-label="Selección académica">
      <div className="academic-field">
        <label htmlFor="academic-year">Año lectivo</label>
        <select id="academic-year" value={selection.anio} onChange={(event) => selectAnio(event.target.value)} disabled={loading.anios}>
          <option value="">{loading.anios ? "Cargando años..." : "Selecciona un año"}</option>
          {lists.anios.map((item) => <option key={item.id_anio_lectivo} value={item.id_anio_lectivo}>{item.anio}</option>)}
        </select>
        <FieldMessage loading={loading.anios} error={errors.anios} enabled={!loading.anios && !errors.anios} items={lists.anios} emptyText="No hay años lectivos disponibles." />
      </div>

      <div className="academic-field">
        <label htmlFor="academic-level">Nivel</label>
        <select id="academic-level" value={selection.nivel} onChange={(event) => selectNivel(event.target.value)} disabled={!selection.anio || loading.niveles || Boolean(errors.anios)}>
          <option value="">{loading.niveles ? "Cargando niveles..." : "Selecciona un nivel"}</option>
          {lists.niveles.map((item) => <option key={item.id_nivel} value={item.id_nivel}>{item.nombre}</option>)}
        </select>
        <FieldMessage loading={loading.niveles} error={errors.niveles} enabled={Boolean(selection.anio)} items={lists.niveles} emptyText="No hay niveles para el año seleccionado." />
      </div>

      <div className="academic-field">
        <label htmlFor="academic-grade">Grado</label>
        <select id="academic-grade" value={selection.grado} onChange={(event) => selectGrado(event.target.value)} disabled={!selection.nivel || loading.grados || Boolean(errors.niveles)}>
          <option value="">{loading.grados ? "Cargando grados..." : "Selecciona un grado"}</option>
          {lists.grados.map((item) => <option key={item.id_grado} value={item.id_grado}>{item.nombre}</option>)}
        </select>
        <FieldMessage loading={loading.grados} error={errors.grados} enabled={Boolean(selection.nivel)} items={lists.grados} emptyText="No hay grados para el nivel seleccionado." />
      </div>

      <div className="academic-field">
        <label htmlFor="academic-section">Sección</label>
        <select id="academic-section" value={selection.seccion} onChange={(event) => selectSeccion(event.target.value)} disabled={!selection.grado || loading.secciones || Boolean(errors.grados)}>
          <option value="">{loading.secciones ? "Cargando secciones..." : "Selecciona una sección"}</option>
          {lists.secciones.map((item) => <option key={item.id_seccion} value={item.id_seccion}>{item.nombre}</option>)}
        </select>
        <FieldMessage loading={loading.secciones} error={errors.secciones} enabled={Boolean(selection.grado)} items={lists.secciones} emptyText="No hay secciones para el grado seleccionado." />
      </div>
    </section>
  );
}

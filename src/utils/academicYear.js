export function currentAcademicYearId(years) {
  const currentYear = new Date().getFullYear();
  const match = years.find((item) => Number(item.anio) === currentYear);
  return match ? String(match.id_anio_lectivo) : "";
}

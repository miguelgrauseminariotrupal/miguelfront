const text = value => typeof value === "string" ? value.trim() : "";

export function profileNames(profile = {}) {
  profile = profile ?? {};
  return Object.fromEntries([
    ["nombres", text(profile.nombres)],
    ["apaterno", text(profile.apaterno) || text(profile.apellido_paterno)],
    ["amaterno", text(profile.amaterno) || text(profile.apellido_materno)],
  ].filter(([, value]) => value));
}

export function sessionFullName(session) {
  const name = profile => Object.values(profileNames(profile)).join(" ");
  return name(session?.usuario) || name(session) || name(session?.docente);
}

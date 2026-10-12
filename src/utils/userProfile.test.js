import test from "node:test";
import assert from "node:assert/strict";
import { profileNames, sessionFullName } from "./userProfile.js";

test("shows user names with either surname format", () => {
  assert.equal(sessionFullName({ usuario: { nombres: " Ana ", apaterno: "Perez", amaterno: "Diaz" } }), "Ana Perez Diaz");
  assert.equal(sessionFullName({ usuario: { nombres: "Ana", apellido_paterno: "Perez", apellido_materno: "Diaz" } }), "Ana Perez Diaz");
});

test("uses linked teacher when the user has no name", () => {
  assert.equal(sessionFullName({ usuario: { nombres: null }, docente: { nombres: "Ana", apellido_paterno: "Perez" } }), "Ana Perez");
  assert.equal(sessionFullName({ usuario: { nombres: "Admin" }, docente: { nombres: "Ana" } }), "Admin");
  assert.equal(sessionFullName(null), "");
  assert.equal(sessionFullName({ usuario: { nombres: null }, docente: null }), "");
  assert.deepEqual(profileNames(null), {});
});

test("empty profile fields cannot erase names already returned by login", () => {
  const user = { nombres: "Ana", apaterno: "Perez" };
  assert.deepEqual({ ...user, ...profileNames({ nombres: null, apaterno: " " }) }, user);
});

test("reads names returned at the root of the login response", () => {
  assert.equal(sessionFullName({
    nombres: "Hugo", apaterno: "Flores", amaterno: "Rodriguez",
    usuario: { id_usuario: 1, usuario: "hugo" }, docente: null,
  }), "Hugo Flores Rodriguez");
});

import test from "node:test";
import assert from "node:assert/strict";
import { saveChatMessages } from "./chatHistory.js";

test("repeated SDK snapshots do not trigger another history update", () => {
  const chats = [{ id: "a", title: "Nuevo", messages: [] }];
  assert.equal(saveChatMessages(chats, "a", []), chats);
  const messages = [{ id: "1", role: "user", parts: [{ type: "text", text: "Asistencia" }] }];
  const updated = saveChatMessages(chats, "a", messages);
  assert.equal(updated[0].title, "Asistencia");
  assert.equal(saveChatMessages(updated, "a", structuredClone(messages)), updated);
  const streamed = [...messages, { id: "2", role: "assistant", parts: [{ type: "text", text: "Respuesta" }] }];
  assert.notEqual(saveChatMessages(updated, "a", streamed), updated);
  assert.equal(saveChatMessages(updated, "missing", streamed), updated);
});

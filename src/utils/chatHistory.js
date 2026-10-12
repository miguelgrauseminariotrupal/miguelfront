export function saveChatMessages(chats, id, messages) {
  const index = chats.findIndex(chat => chat.id === id);
  if (index < 0) return chats;
  const chat = chats[index];
  if (chat.messages === messages || JSON.stringify(chat.messages) === JSON.stringify(messages)) return chats;
  const first = messages.find(message => message.role === "user");
  const title = first?.parts.filter(part => part.type === "text").map(part => part.text).join("").slice(0, 80);
  const next = [...chats];
  next[index] = { ...chat, messages, title: title || chat.title };
  return next;
}

function plainText(value = "") {
  const document = new DOMParser().parseFromString(String(value).replace(/<\/?(?:p|div|h[1-6]|li|br|blockquote)\b[^>]*>/gi, " "), "text/html");
  document.querySelectorAll("script, style").forEach(element => element.remove());
  return normalizeText(document.body.textContent);
}

const normalizeText = value => String(value || "").normalize("NFKC").replace(/\s+/g, " ").toLowerCase();

// Count full-name occurrences in other Wiki articles and Quill drafts.
// Card titles aren't mentions of themselves; repeated references do count.
export function countCardMentions(cards, drafts = []) {
  const articles = cards.map(card => ({ id: card.id, text: plainText(card.text || card.description) }));
  const manuscripts = drafts.map(draft => plainText(`${draft.title || ""}\n${draft.content || ""}`));
  const counts = new Map();
  cards.forEach(card => {
    const name = normalizeText(card.name).trim();
    if (!name) { counts.set(card.id, { wiki: 0, quill: 0 }); return; }
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "gu");
    const occurrences = text => [...text.matchAll(pattern)].length;
    counts.set(card.id, {
      wiki: articles.reduce((total, article) => total + (article.id === card.id ? 0 : occurrences(article.text)), 0),
      quill: manuscripts.reduce((total, manuscript) => total + occurrences(manuscript), 0)
    });
  });
  return counts;
}

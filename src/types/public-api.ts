import type { ExperienceSummary, ExperienceDetail, Result } from "../components/Experience";

type UnknownRecord = Record<string, unknown>;
export function object(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}
export function id(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
export function string(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
function summary(value: unknown): ExperienceSummary | null {
  const entry = object(value), identifier = id(entry.id);
  return identifier ? { id: identifier, title: string(entry.title, string(entry.name, "Descoberta")), description: string(entry.description, "Descubra um perfil especial.") } : null;
}
export function experienceList(value: unknown): ExperienceSummary[] {
  if (!Array.isArray(value)) throw new Error("Resposta inesperada.");
  return value.flatMap(entry => { const item = summary(entry); return item ? [item] : []; });
}
export function experienceDetail(value: unknown, requested: number): ExperienceDetail {
  const raw = object(value), item = summary(raw);
  if (!item || item.id !== requested || !Array.isArray(raw.questions)) throw new Error("Experiência inválida.");
  const questions = raw.questions.map(question => {
    const q = object(question), qid = id(q.id);
    if (!qid || !Array.isArray(q.options)) throw new Error("Pergunta inválida.");
    const options = q.options.map(option => {
      const o = object(option), oid = id(o.id);
      if (!oid) throw new Error("Opção inválida.");
      return { id: oid, label: string(o.label, "Opção") };
    });
    if (!options.length || new Set(options.map(o => o.id)).size !== options.length) throw new Error("Opções inválidas.");
    return { id: qid, title: string(q.title, "Escolha uma opção"), options };
  });
  if (!questions.length || new Set(questions.map(q => q.id)).size !== questions.length) throw new Error("Perguntas inválidas.");
  return { ...item, questions };
}
export function experienceResult(value: unknown): Result {
  const raw = object(value);
  return { title: string(raw.title, string(raw.key, "Seu perfil")), description: string(raw.description),
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(product => {
      const p = object(product); return { id: id(p.id), name: string(p.name, "Produto recomendado") };
    }) : [] };
}

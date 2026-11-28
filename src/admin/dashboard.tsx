import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { Root } from "react-dom/client";
import { Package, AlertCircle, Tag, Percent, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export interface Summary {
  total: number;
  low: number;
  pending: number;
  promotions: number;
}
const shortcuts = [
  ["products", "Gerenciar produtos"], ["media", "Enviar fotos"], ["store", "Editar contatos"],
  ["content", "História da loja"], ["campaigns", "Banners"], ["featured", "Destaques"],
] as const;
const metrics = [
  ["total", "Produtos cadastrados", Package],
  ["low", "Estoque baixo (até 3)", AlertCircle],
  ["pending", "Preços pendentes", Tag],
  ["promotions", "Promoções vigentes", Percent],
] as const;

function Dashboard({ summary, error, onNavigate }: {
  summary?: Summary; error?: boolean; onNavigate: (module: string) => void;
}) {
  const reduce = useReducedMotion();
  return <>
    <h2>Resumo da loja</h2>
    <p className="admin-note">Visão geral dos produtos e atalhos para o dia a dia.</p>
    <div className="photo-tools dashboard-shortcuts">
      {shortcuts.map(([value, label]) => <button key={value} type="button" className="btn btn--secondary"
        onClick={() => onNavigate(value)}>{label}<ArrowUpRight size={15} aria-hidden="true" /></button>)}
    </div>
    <div className="dashboard-grid" aria-busy={!summary && !error}>
      {metrics.map(([key, label, Icon], index) => <motion.article className="dashboard-card" key={key}
        initial={reduce ? false : { opacity: 0.6, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : index * 0.05 }}>
        <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
        <strong>{summary ? summary[key] : "—"}</strong><span>{label}</span>
      </motion.article>)}
    </div>
    <p role="status" className="admin-note">{error ? "Resumo indisponível. Consulte os registros."
      : summary ? "Resumo atualizado. Confira as quantidades físicas antes de alterar o estoque." : "Carregando resumo..."}</p>
  </>;
}

const roots = new WeakMap<HTMLElement, Root>();
export function clearDashboard(container: HTMLElement) {
  roots.get(container)?.unmount();
  roots.delete(container);
}
export function renderDashboard(container: HTMLElement, summary?: Summary, error = false) {
  let root = roots.get(container);
  if (!root) {
    container.replaceChildren();
    root = createRoot(container);
    roots.set(container, root);
  }
  const navigate = (module: string) => {
    const select = document.querySelector<HTMLSelectElement>("#admin-module");
    if (select) {
      select.value = module;
      select.dispatchEvent(new Event("change"));
    }
  };
  flushSync(() => root!.render(<Dashboard summary={summary} error={error} onNavigate={navigate} />));
}

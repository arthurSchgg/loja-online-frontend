import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { Plus, ArrowUpRight } from "lucide-react";

export interface ProductCardModel {
  id: number;
  name: string;
  brand: string;
  description: string;
  image: string;
  fallback: string;
  alt: string;
  price: string;
  state: "snapshot" | "pending" | "available" | "unavailable";
}
export interface DemoProductCardModel {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  theme: string;
  price: string;
  state: "demo";
}
type GridProduct = ProductCardModel | DemoProductCardModel;
interface EmptyState { title: string; description: string }
const states = {
  snapshot: ["Informações em atualização", "Dados comerciais temporariamente indisponíveis"],
  pending: ["Preço a confirmar", "Preço ainda não confirmado"],
  unavailable: ["Indisponível", "Indisponível"],
} as const;

function ProductGrid({ products, empty }: { products: GridProduct[]; empty?: EmptyState }) {
  const reduce = useReducedMotion() || document.documentElement.dataset.motion === "off";
  return products.length ? products.map(product => {
    if (product.state === "demo") {
      const href = `produto.html?id=${encodeURIComponent(product.id)}`;
      return <motion.article className="product-card" key={product.id} layout={reduce ? false : "position"}
        style={{ "--card-theme": product.theme } as React.CSSProperties}>
        <a href={href} aria-label={`Ver ${product.name}`}><div className="product-visual">
          <span className="badge">Conceito</span>
          <img src={product.image} alt={`Ilustração de frasco: ${product.name}`} loading="lazy" width="320" height="420" />
          <span className="product-visual-action" aria-hidden="true"><ArrowUpRight size={19} strokeWidth={1.65} /></span>
        </div></a>
        <div className="product-card__meta"><small>{product.category}</small><h3><a href={href}>{product.name}</a></h3>
          <p>{product.description}</p><div className="product-card__bottom"><strong>Ilustrativo: {product.price}</strong>
            <button type="button" className="icon-button icon-button--add" data-add={product.id}
              aria-label={`Adicionar ${product.name} à sacola demonstrativa`}><Plus className="ui-icon" strokeWidth={1.75} /></button>
          </div>
        </div>
      </motion.article>;
    }
    const href = `produto.html?productId=${product.id}`;
    return <motion.article className="product-card" key={product.id} layout={reduce ? false : "position"}
      transition={{ layout: { duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] } }}>
      <a href={href}><div className="product-visual" style={{ "--card-theme": "#faf9f6" } as React.CSSProperties}>
        <img src={product.image} data-image-fallback={product.fallback} loading="lazy" decoding="async" alt={product.alt} width="320" height="420" />
        <span className="product-visual-action" aria-hidden="true"><ArrowUpRight size={19} strokeWidth={1.65} /></span>
      </div></a>
      <div className="product-card__meta">
        <small>{product.brand}</small>
        <h3><a href={href}>{product.name}</a></h3><p>{product.description}</p>
        <div className="product-card__bottom"><strong>{product.price}</strong>
          {product.state === "available" ? <button className="btn btn--secondary" type="button" data-confirm-product={product.id}>Consultar no WhatsApp</button>
            : <span className="badge" aria-label={states[product.state][1]}>{states[product.state][0]}</span>}
        </div>
        <a className="product-card__details" href={href} aria-label={`Ver detalhes de ${product.name}`}>Ver detalhes</a>
      </div>
    </motion.article>;
  }) : empty ? <div className="catalog-empty"><strong>{empty.title}</strong><p>{empty.description}</p></div> : null;
}

type GridRoot = { host: HTMLDivElement; root: Root };
const roots = new WeakMap<HTMLElement, GridRoot>();

export function clearProductGrid(grid: HTMLElement) {
  roots.get(grid)?.root.unmount();
  roots.delete(grid);
  grid.replaceChildren();
}

/** Own only the card children; existing API status, filtering and pagination
 * remain independent. React keys keep decoded images stable across pages. */
export function renderProductGrid(grid: HTMLElement, models: Array<GridProduct | null>, empty?: EmptyState) {
  grid.querySelector("[data-api-status]")?.remove();
  let entry = roots.get(grid);
  if (!entry || entry.host.parentElement !== grid) {
    clearProductGrid(grid);
    const host = document.createElement("div");
    host.className = "react-product-grid";
    grid.append(host);
    entry = { host, root: createRoot(host) };
    roots.set(grid, entry);
  }
  const products = models.filter((model): model is GridProduct => model !== null);
  flushSync(() => entry!.root.render(<ProductGrid products={products} empty={empty} />));
}

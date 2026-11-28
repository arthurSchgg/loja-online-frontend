import { useState } from "react";
import type { CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { ZoomIn } from "lucide-react";

export interface ProductDetailModel {
  id: number;
  name: string;
  brand: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  fallback: string;
  categories: string[];
  price: string;
  stock: string;
  state: "snapshot" | "pending" | "available" | "unavailable";
}

function ProductDetail({ product }: { product: ProductDetailModel }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const reduce = useReducedMotion() || document.documentElement.dataset.motion === "off";
  const chosen = product.images[Math.min(index, product.images.length - 1)];
  return <section className="container product-view">
    <div className="product-gallery" data-product-gallery>
      <div className="product-main-art product-gallery__main" style={{ "--product-theme": "#f6f0eb" } as CSSProperties}>
        <button type="button" className="product-gallery__main-button" aria-label={zoom ? "Reduzir imagem do produto" : "Ampliar imagem do produto"}
          aria-pressed={zoom} onClick={() => setZoom(value => !value)}>
          <motion.img key={chosen.url} src={chosen.url} data-image-fallback={product.fallback} loading="eager" fetchPriority="high"
            decoding="async" width="400" height="530" alt={chosen.alt}
            initial={reduce ? false : { opacity: 0.72 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.25 }} />
        </button>
        <span className="product-gallery__zoom-tip" aria-hidden="true"><ZoomIn size={15} /> Toque para ampliar</span>
      </div>
      {product.images.length > 1 && <div className="product-gallery__thumbs" role="group" aria-label="Escolher imagem do produto">
        {product.images.map((image, position) => <button key={image.url} type="button" className="product-gallery__thumb"
          data-product-thumb={position} aria-label={`Ver imagem ${position + 1} de ${product.images.length}`} aria-pressed={position === index}
          onClick={() => { setIndex(position); setZoom(false); }}>
          <img src={image.url} data-image-fallback={product.fallback} alt="" loading="lazy" decoding="async" width="72" height="80" />
        </button>)}
      </div>}
    </div>
    <div className="product-detail">
      <nav className="product-breadcrumb" aria-label="Caminho de navegação"><a href="catalogo.html">Catálogo</a><span aria-hidden="true">/</span><span>Detalhes</span></nav>
      <span className="eyebrow">{product.brand}</span><h1>{product.name}</h1>
      <p className="lead">{product.description}</p>
      {!!product.categories.length && <div className="product-detail__meta">{product.categories.map((category, i) => <span key={i}>{category}</span>)}</div>}
      <p className="product-detail__price">{product.price}</p>
      <div className="product-detail__availability">
        {product.state === "snapshot" ? <span className="badge">Aguardando conexão para consultar</span>
          : product.state === "pending" ? <span className="badge" aria-label="Preço ainda não confirmado">Preço a confirmar</span>
          : product.state === "available" ? <button className="btn btn--primary" type="button" data-confirm-product={product.id}>Confirmar e consultar no WhatsApp</button>
          : <span className="badge" aria-label="Indisponível">Indisponível</span>}
        {product.stock && <small className="muted">{product.stock}</small>}
      </div>
      <p className="product-detail__disclaimer">Imagens ilustram o produto cadastrado. Preço e disponibilidade são confirmados antes de qualquer solicitação.</p>
    </div>
  </section>;
}

const roots = new WeakMap<HTMLElement, Root>();
export function clearProductDetail(host: HTMLElement) {
  roots.get(host)?.unmount();
  roots.delete(host);
  host.replaceChildren();
}
export function renderProductDetail(host: HTMLElement, product: ProductDetailModel) {
  let root = roots.get(host);
  if (!root) {
    host.replaceChildren();
    root = createRoot(host);
    roots.set(host, root);
  }
  const galleryKey = JSON.stringify([product.id, product.images.map(image => image.url)]);
  flushSync(() => root!.render(<ProductDetail key={galleryKey} product={product} />));
}

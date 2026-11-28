import { Component, lazy, Suspense, useState } from "react";
import type { ReactNode } from "react";
import { Box, X } from "lucide-react";

const FragranceStudio = lazy(() => import("./FragranceStudio").then(module => ({ default: module.FragranceStudio })));
class StudioLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="studio-fallback">
      <img src="assets/images/brand/hero-live-poster.webp" alt="Composição editorial com fragrâncias" />
      <p role="status">Não foi possível carregar a cena 3D. Explore as fotografias da loja.</p>
    </div> : this.props.children;
  }
}
export function StudioPreview() {
  const [open, setOpen] = useState(false);
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return <section className="section fragrance-studio" aria-labelledby="studio-title">
    <div className="container studio-layout">
      <div className="studio-copy">
        <span className="eyebrow">O universo da perfumaria</span>
        <h2 id="studio-title">Beleza em <em>cada detalhe.</em></h2>
        <p className="lead">Explore um frasco conceitual por outros ângulos, experimente acabamentos e descubra o encontro da luz com o vidro.</p>
        <p className="muted">Ilustração interativa autoral. Não representa um produto à venda.</p>
        <button className="btn btn--primary" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="studio-preview">
          {open ? <X size={18} aria-hidden="true" /> : <Box size={18} aria-hidden="true" />}{open ? "Fechar experiência 3D" : "Explorar em 3D"}
        </button>
        {saveData && !open && <p className="muted">A visualização 3D é carregada apenas quando escolhida.</p>}
      </div>
      <div id="studio-preview" className="studio-preview">
        {open ? <StudioLoadBoundary><Suspense fallback={<p role="status" className="studio-loading">Preparando a experiência 3D...</p>}><FragranceStudio /></Suspense></StudioLoadBoundary>
          : <figure className="studio-static"><img src="assets/images/brand/hero-live-poster.webp" alt="Composição editorial com frascos e iluminação dourada" width={900} height={1125} loading="lazy" decoding="async" />
            <figcaption>Visualização interativa opcional</figcaption></figure>}
      </div>
    </div>
  </section>;
}

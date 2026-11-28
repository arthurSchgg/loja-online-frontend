import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Header, Footer } from "./components/Shell";
import { setupEditorialMotion } from "./motion/editorial";
import { StudioPreview } from "./components/StudioPreview";
export { renderProductGrid, clearProductGrid } from "./components/ProductGrid";
export { renderProductDetail, clearProductDetail } from "./components/ProductDetail";

interface ShellOptions {
  live: boolean;
  count: number;
  openBag: () => void;
}

export function mountStudioPreview() {
  const target = document.getElementById("studio-mount");
  if (!target) return;
  const root = createRoot(target);
  flushSync(() => root.render(<StudioPreview />));
}

/** React owns the header and footer. The legacy catalog does not mutate these roots. */
export function mountShell(options: ShellOptions) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const headerRoot = header ? createRoot(header) : null;
  const footerRoot = footer ? createRoot(footer) : null;
  let count = options.count;
  const renderHeader = () => headerRoot?.render(<Header live={options.live} count={count} openBag={options.openBag} />);
  flushSync(() => {
    renderHeader();
    footerRoot?.render(<Footer live={options.live} />);
  });
  const stop = setupEditorialMotion();
  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      stop();
      headerRoot?.unmount();
      footerRoot?.unmount();
      window.removeEventListener("pagehide", onPageHide);
    }
  };
  window.addEventListener("pagehide", onPageHide);
  return (nextCount: number) => {
    if (nextCount === count) return;
    count = nextCount;
    renderHeader();
  };
}

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, ShoppingBag, Menu, X, ChevronRight } from "lucide-react";

const links = [
  ["index.html", "Início", "Início"],
  ["conheca-a-loja.html", "A Loja", "Conheça a Loja"],
  ["catalogo.html", "Produtos", "Explore os Produtos"],
  ["viva-sua-experiencia.html", "Experiências", "Viva sua Experiência"],
  ["espaco-das-velas.html", "Velas", "Espaço das Velas"],
  ["contato.html", "Contato", "Contato"],
] as const;

function activePage(href: string) {
  const current = location.pathname.split("/").pop() || "index";
  return current.replace(/\.html$/, "") === href.replace(/\.html$/, "") ? "page" as const : undefined;
}

export interface HeaderProps {
  live: boolean;
  count: number;
  openBag: () => void;
}

export function Header({ live, count, openBag }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const motionEnabled = !reduced && document.documentElement.dataset.motion !== "off";

  useEffect(() => {
    const desktop = matchMedia("(min-width: 1025px)");
    const onResize = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (open && event.target instanceof Node &&
          !mobileMenu.current?.contains(event.target) &&
          !menuButton.current?.contains(event.target)) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return <>
    <div className="announcement">
      LOJINHA DA KÁTIA · MAIS DO QUE COMPRAR, É VIVER UMA EXPERIÊNCIA{!live && " · CONCEITO"}
    </div>
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="index.html" aria-label="Lojinha da Kátia, início">
          <img src="assets/images/brand/logo-katia.svg" className="brand-mark" alt="" width="58" height="58" />
          <span><strong>Lojinha da Kátia</strong><small>Perfumaria &amp; afeto</small></span>
        </a>
        <nav className="nav-links" aria-label="Menu principal">
          {links.map(([href, label]) => <a key={href} href={href} aria-current={activePage(href)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="icon-button icon-button--search" href="catalogo.html#search" aria-label="Buscar produtos no catálogo" title="Buscar produtos">
            <Search className="ui-icon" strokeWidth={1.75} aria-hidden="true" />
          </a>
          {!live && <button className="icon-button icon-button--bag" type="button" data-open-cart
            aria-label={count === 0 ? "Abrir sacola demonstrativa" : `Abrir sacola demonstrativa, ${count} ${count === 1 ? "item" : "itens"}`}
            title="Abrir sacola" onClick={openBag}>
            <ShoppingBag className="ui-icon" strokeWidth={1.75} aria-hidden="true" />
            <span className="cart-count" data-cart-count hidden={count === 0}>{count}</span>
          </button>}
          <button ref={menuButton} className="icon-button icon-button--menu mobile-toggle" type="button"
            data-mobile-toggle aria-controls="mobile-links" aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen(value => !value && !matchMedia("(min-width: 1025px)").matches)}>
            {open ? <X className="ui-icon" strokeWidth={1.75} aria-hidden="true" /> : <Menu className="ui-icon" strokeWidth={1.75} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <motion.nav ref={mobileMenu} id="mobile-links" className="mobile-links modern-menu" aria-label="Menu móvel"
        hidden={!open} initial={false}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: motionEnabled ? -8 : 0 }}
        transition={{ duration: motionEnabled ? 0.24 : 0, ease: [0.22, 1, 0.36, 1] }}>
        {links.map(([href, , label]) => <a key={href} href={href} aria-current={activePage(href)} onClick={() => setOpen(false)}>
          {label}<ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </a>)}
      </motion.nav>
    </header>
  </>;
}

export function Footer({ live }: { live: boolean }) {
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div><span className="eyebrow">NOSSA ESSÊNCIA</span><h3>Lojinha da Kátia</h3>
          <p>Mais do que comprar, é viver uma experiência.</p>
          <p>Fragrâncias, presentes e pequenos rituais que deixam boas lembranças.</p>
        </div>
        <nav aria-label="Institucional"><strong>Explore</strong>
          {links.slice(1, 5).map(([href, label, mobile]) => <a key={href} href={href}>{href === "catalogo.html" ? label : mobile}</a>)}
        </nav>
        <nav aria-label="Informações"><strong>Informações</strong><a href="privacidade.html">Privacidade</a><a href="contato.html">Contato</a>
          {!live && <a href="https://github.com/arthurSchgg/loja-online-frontend" rel="noopener noreferrer" target="_blank">Projeto</a>}
        </nav>
      </div>
      <div className="footer-end"><span>© Lojinha da Kátia · {live ? "Catálogo publicado" : "Conceito demonstrativo"}</span>
        <span>Sem checkout, pagamento ou pedidos neste site</span></div>
    </div>
  </footer>;
}

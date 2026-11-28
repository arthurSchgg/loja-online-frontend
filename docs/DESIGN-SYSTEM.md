# Design System — Perfumaria editorial (US-001)

**Direção:** minimalismo claro, rosé, cobre, branco mineral e marrom profundo; logo oficial (ver ticket #13). Referências usadas apenas como linguagem visual, sem copiar layouts/textos de terceiros.

## Cores semânticas
Os seis tokens fundamentais são `--color-background`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent` e `--color-highlight` em `assets/css/tokens.css`.
Cada perfume define `theme`; cards e seções usam `--card-theme`/`--theme-wash` com contraste textual consistente.

## Tipografia
`DM Sans` (títulos e interface), com fallbacks sem serifa locais e escala fluida `clamp()`. Títulos têm peso 600 e espaçamento compacto. Botões usam raio de 9px; formas circulares ficam reservadas para elementos decorativos, como amostras de cor. Pré-carregamentos externos não são obrigatórios; rever política de privacidade e auto-hospedar fontes antes de produção.

## Componentes
- Botão `.btn`: `--primary`, `--secondary`, `--ghost`.
- Produto `.product-card`, badges `.badge`, campos `.field`.
- Seletor de volume de 30/50/100 ml com estado `aria-pressed`.
- Header sticky e menu mobile `aria-expanded`.
- Sacola lateral em `<dialog>`, sem checkout ou persistência de pedidos.
- Estados de erro, vazio, aviso de demonstração.

## Movimento
`assets/js/animations.js`: Web Animations API, IntersectionObserver e transformações discretas em CSS, com rolagem nativa. Respeita `prefers-reduced-motion` e Save-Data; sem dependência de scripts executáveis por CDN. A animação deve ser complementar, nunca impedir foco, rolagem ou interação.

## Acessibilidade
WCAG 2.2 AA como alvo a homologar; foco visível, skip link, HTML semântico, labels, botões reais, contraste e validação responsiva nas larguras 375/768/1024/1440. Avaliação assistiva real e Core Web Vitals ainda pendentes.

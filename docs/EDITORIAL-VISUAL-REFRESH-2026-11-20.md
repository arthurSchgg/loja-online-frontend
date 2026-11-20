# Revisão visual — imagens transparentes e movimento responsivo

> **Nota de evolução:** este documento registra a primeira versão editorial com SVGs do PR #89. Na revisão seguinte, a pedido do usuário, os desenhos visíveis das páginas públicas foram substituídos por fotografias reais de perfumes de O Boticário e por uma fotografia de vela na página temática. As imagens SVG permaneceram apenas como arquivos históricos sem uso nas áreas editoriais. As novas fontes, pendências de direitos de uso e fallbacks estão descritos em [HOME-EDITORIAL-PHOTOS.md](HOME-EDITORIAL-PHOTOS.md).

## Escopo (20/11/2026)
Solicitação: substituir imagens grandes da loja com fundos quadrados ou a logo ampliada por composições transparentes semelhantes à direção visual aprovada, polir animações de imagens e garantir uso em telefones e tablets.

## Alterações
- `conheca-a-loja.html`: substitui a logo ampliada por frasco floral transparente; compõe também a seção "Nossa História" com segunda arte.
- `viva-sua-experiencia.html`: frasco floral para o tema de descoberta.
- `contato.html`: frasco âmbar transparente.
- `espaco-das-velas.html`: substitui a vela HTML/CSS conceitual por arte transparente de vela e flores; mantém nota de não representar item à venda.
- `index.html`: preserva a Live Photo autoral no hero; substitui a fotografia secundária externa por arte transparente de vela; as duas coleções demonstrativas usam artes florais e âmbar neutras em vez de rótulos de perfumes inventados.
- `assets/images/brand/product-photo-pending.svg`: remove o retângulo de fundo do marcador "Imagem em breve", que permanece claramente identificado como uma ilustração.
- `assets/css/institutional.css` e `assets/css/pages.css`: imagem `object-fit: contain` sem quadrado, sombras suaves de contorno, responsividade em 320–1440px, animação de flutuação no wrapper e parallax leve na imagem para não disputar `transform`.
- `assets/js/animations.js`: entradas mais curtas e com deslocamentos discretos; continua progressivo e sem sequestro de scroll.
- Substitui setas `↘` por SVGs padronizados nos botões das páginas institucionais.

## Ativos originais (sem transparência falsa)
Quatro SVGs declarativos originais de 640 × 700 px, com fundo transparente e sem fontes externas, scripts ou imagens de terceiros:
1. `assets/images/editorial/floral-perfume-cutout.svg`
2. `assets/images/editorial/amber-perfume-cutout.svg`
3. `assets/images/editorial/discovery-perfume-cutout.svg`
4. `assets/images/editorial/candle-floral-cutout.svg`

São artes **editoriais genéricas**, não fotografias de itens vendidos. A logo original continua na navegação. Fotos oficiais de produtos retornadas pela API ou publicadas no admin permanecem inalteradas.

## Qualidade e segurança
- Motion para quem permite animação; `prefers-reduced-motion: reduce` e `html[data-motion="off"]` removem flutuação, parallax e transição.
- `data-parallax` já usa `requestAnimationFrame` e `IntersectionObserver`; sem bibliotecas de animação externas.
- Os SVGs são self-hosted, sem `<script>` ou links remotos; não exigem afrouxar CSP.
- Hero Live Photo (poster WebP + vídeo MP4 opcional) e sua lógica de pausa, economia de dados e carregamento preguiçoso não foram modificados.
- Valores, imagens oficiais do catálogo real, estoque, disponibilidade, preços e confirmação do WhatsApp seguem responsabilidade exclusiva do backend.

## Verificação antes de produção
- [ ] `npm run check`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `API_BASE_URL=/api/v1 npm run build:release` e `npm run check:security`
- [ ] `npm run test:browser -- --grep 'demo|motion'` e `--grep live` com servidor mock e Playwright preparados
- [ ] Inspecionar 320, 375, 390, 768, 1024 e 1440px; conferir zoom do Android/iOS e overflow.
- [ ] Inspecionar Safari/iOS: imagens sem fundo branco, animações suaves, nenhum elemento sobre botões.
- [ ] Testar redução de movimento, Save-Data e pausa da Live Photo.
- [ ] Obter aprovação visual final da proprietária antes de publicação comercial.

Esta branch prepara prévia de deploy, não publica automaticamente no Cloudflare e não altera produção nem banco de dados.

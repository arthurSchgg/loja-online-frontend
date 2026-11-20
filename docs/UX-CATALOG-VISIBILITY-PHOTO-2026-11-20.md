# UX: frasco compacto e produtos publicados visíveis sem pesquisa

## Pedido atendido
- Na página **Conheça a Loja**, o frasco real de Lily não deve ocupar a largura do celular nem apresentar um quadrado branco aparente.
- Na **home**, exibir até oito produtos publicados no grid "Vitrine da Loja" mesmo com a busca vazia.
- Na **página de catálogo**, iniciar automaticamente a listagem sem aguardar a consulta separada de categorias.
- O estoque real e a disponibilidade **não** podem ser inventados ou alterados.

## Implementação
- `assets/css/institutional.css`: limita o frasco a 350px em desktop, 275px em tablet e 240px (ou 58vw) em celular, com ajuste adicional abaixo de 360px. O wrapper usa `mix-blend-mode:multiply` sem isolamento interno para **integrar visualmente o fundo branco da foto** ao degradê rosé. Isso **não** altera os pixels nem cria uma imagem com alfa real. Mantém `prefers-reduced-motion` e os movimentos já aprovados.
- `assets/css/pages.css`: fotografias de perfumaria dos cards editoriais redimensionadas proporcionalmente, sem ocupar o espaço do texto.
- `assets/js/live.js`: na home busca a primeira página pública de produtos e renderiza até oito cartões; cada cartão permanece ligado à API, sem WhatsApp para `available=false`.
- `assets/js/live.js`: separa o início da consulta de produtos da consulta de categorias. Um catálogo vazio de termo ou filtro mostra a primeira página publicada automaticamente. Links diretos para categorias continuam aguardando a resolução dessa categoria para aplicar o filtro correto.
- `assets/js/public-catalog-load.js`: tentativas automáticas limitadas apenas na primeira página sem filtros para conexão e falhas 500/502/503/504 (possível atraso ao despertar a API). Buscas e filtros alterados pelo cliente não são reenviados em segundo plano. A listagem continua com botão de tentar novamente quando a API falhar.
- `index.html` e `catalogo.html`: títulos e descrições neutros, sem anunciar o catálogo real como "valores fictícios".

## Dados preservados
Em 20/11/2026, a consulta somente leitura ao Neon confirmou oito produtos Skelt com `published=true`, `available=false` e `stock_quantity=0`. **Nenhum dado foi escrito no banco neste ajuste.** Produtos publicados, mesmo indisponíveis, continuam visíveis, mas sem chamada de compra/solicitação. Não se deve publicar estoque até a proprietária confirmar as quantidades reais.

## Limitação de imagem e direitos
O frasco Lily é uma fotografia de terceiros carregada por URL externa. A remoção do branco foi tratada como **integração óptica CSS**. Para uma imagem realmente sem fundo, é preciso obter um WebP/PNG com canal alfa de uso comercial autorizado, ou criar um recorte autorizado. Verificar direitos de reprodução do titular da foto antes de produção. Não substituir o produto real por arte gerada ou embalagem imprecisa.

## Conferência antes de produção
- [ ] `npm run check`, `npm test` e `npm run build`.
- [ ] `API_BASE_URL=/api/v1 npm run build:release`, `npm run check:security`.
- [ ] Executar Playwright com release live e mocks de API: 8 cartões visíveis com busca vazia e categorias pendentes; home com 8; sem solicitação para indisponíveis.
- [ ] Inspecionar Lily no Safari/iOS a 320, 375, 390, 768 e 1024px: tamanho, fundo e legibilidade.
- [ ] Verificar o fallback de fotografias externas bloqueadas, a Live Photo e o foco do teclado.
- [ ] Confirmar o deploy efetivo no Cloudflare; a integração na branch de prévia não é prova de publicação.

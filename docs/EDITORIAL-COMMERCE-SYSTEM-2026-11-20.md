# Editorial Commerce System — Lojinha da Kátia

## Objetivo (20/11/2026)
Evoluir a vitrine pública para uma experiência premium de perfumaria: legível, responsiva, consistente e interativa, sem copiar marca, layouts ou fotografias de outros sites e sem afetar a API, o painel administrativo ou dados comerciais.

## Referências estudadas
- **Byredo** (https://www.byredo.com/): hierarquia limpa entre categorias, fotografia de produtos e navegação discreta. Aplicação: tipografia editorial, área de destaque e menu leve.
- **Aesop Fragrance** (https://www.aesop.com/fragrance/): produto e composição primeiro, informações objetivas e fácil leitura em coleção. Aplicação: cards com marca, nome, descrição curta, preço e status.
- **Diptyque** (https://diptyqueparis.com/en-eu): coleções que alternam descoberta, fotografia e detalhes do produto. Aplicação: mais espaço em branco, página de produto com galeria e conteúdo progressivo.
- **WCAG 2.2 AA** (https://www.w3.org/TR/WCAG22/): foco visível, controles adequados para toque, feedback para ações e redução de movimento.

Todas as cores, logomarca, textos, ilustrações, fotos e componentes comerciais permanecem associados à Lojinha da Kátia. Não foram incluídos scripts externos, sistemas de analytics ou rastreamento.

## Implementação
**Design system público:** `assets/css/premium-storefront.css` é importado *depois* das folhas existentes nas oito páginas públicas. Não modifica telas admin. A linguagem visual utiliza papéis quentes, rosé discreto, contraste de texto, espaços amplos, cantos suaves e fotografias com proporções consistentes. Botões, indicadores, cards, catálogo, footer, breadcrumbs e página de produto compartilham o mesmo padrão.

**Catálogo:** `assets/js/catalog-toolbar.js` apresenta chips para busca, categoria e preço máximo, todos removíveis por botão, e ação de limpar quando houver múltiplos filtros. Limpeza atualiza URL e consulta por API, sem listar produtos fictícios. `assets/js/live.js` agora mostra skeletons leves durante o carregamento, estados vazios claros e ações “Ver detalhes” mesmo para produtos indisponíveis.

**Página de produto:** `assets/js/product-gallery.js` ordena e valida as URLs de até doze imagens de produto do backend. Interface apresenta miniaturas, seleção com `aria-pressed` e ampliação reversível acessível por teclado. Quando não há imagem válida, um marcador local é usado. Nenhuma imagem de um perfume é inventada para o catálogo.

**Relacionados:** `assets/js/related-products.js` sugere apenas produtos publicados que tenham marca ou categorias em comum com o item, a partir da API. Sem resultados, a seção é ocultada, em vez de apresentar um vazio.

**Serviços e home:** apresentação de até três serviços reais em cards editoriais discretos. Não são vendidos como se fossem produtos em estoque. A seleção de WhatsApp só é exposta para os itens que o backend marcou como disponíveis, com reconfirmação antes da abertura.

**Motion:** `assets/js/animations.js` preserva os reveals e parallax das cenas editoriais, mas deixa de recalcular a posição de todas as fotografias dos produtos em cada scroll. O limite do parallax é menor no celular. Redução de movimento, Save-Data e acessibilidade permanecem respeitados.

**Conteúdo:** mensagens e metadados da vitrine pública não afirmam mais que os preços cadastrados sejam fictícios. Em modo demo, o aviso de demonstração continua visível. Na produção, o link ao repositório de desenvolvimento foi removido do rodapé.

## Preservações de negócio
- Autenticação/admin, backend Spring Boot, Neon, estoque e preços **inalterados**.
- Somente dados de produtos da API são exibidos no modo `live`.
- `available=false`: card e detalhe visíveis com status Indisponível, mas sem botão de WhatsApp.
- Confirmação prévia via backend é obrigatória antes de abrir WhatsApp.
- Fotos externas já configuradas continuam sujeitas à issue #95 sobre licença de uso. Este trabalho não faz download nem incorpora material de terceiros.
- A Live Photo já publicada foi preservada, sem aumento de peso.

## Validação
- [ ] `npm run check` e `npm test`: obrigatórios no build de release Cloudflare.
- [ ] `API_BASE_URL=/api/v1 npm run build:release` e `npm run check:security`.
- [ ] No navegador: catálogo sem filtros, busca, remoção de chips, ordenação, categorias, paginação.
- [ ] Detalhe: galeria com miniaturas se houver múltiplas imagens, zoom reversível, relacionados e status indisponível.
- [ ] Verificar 320, 375, 390, 768, 1024 e 1440 px, inclusive iPhone e Android.
- [ ] Validar navegação por teclado, contraste, leitor de tela, movimento reduzido e conexões lentas.
- [ ] Confirmar deploy final no Cloudflare da branch `main`.

# Fotos editoriais transparentes e vitrine pública — 21/11/2026

## Objetivo
Substituir os retângulos brancos e as máscaras que distorciam o contorno dos frascos pelas cinco composições **com transparência real** mostradas ao responsável pela loja. Aproximar a vitrine de produtos do topo da home e destacar a navegação para o catálogo.

## Implementação
- Novos arquivos locais em `assets/images/editorial/transparent/`: `lily.webp`, `egeo.webp`, `malbec.webp`, `floratta.webp`, `vela.webp`. São versões WebP com canal alfa, comprimidas e responsivas. A animação Live Photo principal permanece intacta.
- Substituição das fotos externas nas páginas Home, Conheça a Loja, Viva sua Experiência, Contato e Espaço das Velas.
- `assets/css/editorial-cutouts.css` agora usa o canal alfa **sem máscaras SVG, blend multiply ou recortes elípticos**. Sombra suave, bom enquadramento no celular, media query de redução de movimento.
- Home: vitrine da API real passa a aparecer logo após a introdução, com oito produtos publicados e botão destacado para o catálogo completo.
- Categorias editoriais foram corrigidas para as que existem nos registros: **Perfumaria** e **Kits para presente**. As coleções não são mais ocultadas artificialmente.
- `assets/js/live.js` continua utilizando preços, fotos dos produtos e disponibilidade diretamente da API, inclusive quando um item está indisponível ou sem preço confirmado. Nenhum dado foi inventado nem copiado para uma listagem estática.

## Fotografia e direitos
As cinco imagens são **composições editoriais ilustrativas previamente apresentadas ao usuário**, não fotografias oficiais de SKUs da loja. O conteúdo e os textos não podem sugerir que sejam a fotografia exata do produto à venda. As imagens dos cartões de produtos permanecem as associadas ao cadastro no backend/PDF. Verificar direitos de marca e representação antes de usar peças de anúncio.

## Estado observado no banco (somente leitura)
- Produtos cadastrados: 65.
- Produtos publicados: 65.
- Produtos com imagem: 65.
- Estoque registrado como positivo: 65.
- Produtos com preço e disponibilidade para consulta: 11.
- Produtos com preço ainda pendente: 54 (continuam visíveis como **Valor sob consulta**, sem habilitar confirmação de venda automaticamente).

Não houve operação SQL de alteração de dados comerciais.

## Homologação de release
- [ ] `npm run check`, `npm test` e build do Cloudflare Pages aprovados.
- [ ] Preview em iPhone e Android: nenhuma borda branca, frascos sem corte, imagens proporcionais e botões acessíveis.
- [ ] Home carrega oito itens reais sem pesquisar e oferece botão para abrir todo o catálogo.
- [ ] Catálogo exibe os 65 publicados via paginação, inclusive os indisponíveis/sem preço.
- [ ] Conteúdos editorial e catálogo separados, sem sugerir que as composições são SKUs publicados.
- [ ] Produção no Cloudflare conferida pelo commit da main.

# Finalização das imagens editoriais — 21/11/2026

## Motivação
A loja ainda carregava fotografias de produtos em JPEG/WebP com fundo branco de estúdio, causando blocos retangulares nas páginas Conheça a Loja, Viva sua Experiência, Contato e nas coleções da home.

## Implementação
- Quatro máscaras SVG leves e responsivas, com contorno orgânico dos frascos Lily, Egeo Dolce, Malbec e do conjunto Floratta Red. São máscaras locais e **não fotografias novas**; elas ocultam as bordas retangulares das fotos já selecionadas.
- Folha pública `assets/css/editorial-cutouts.css` aplicada depois dos estilos existentes nas cinco páginas com composições editoriais, para corrigir conflitos de especificidade anteriores.
- Mesclagem suave das regiões internas claras e máscara com bordas delicadamente desfocadas. Não altera arquivos originais ou imagens da API dos produtos comercializados.
- A fotografia de vela e flores continua sendo uma cena contextual, não um produto com fundo branco. Recebe enquadramento editorial, margem visual e fade nas bordas.
- Proteções para dispositivos móveis e `prefers-reduced-motion`. Não altera animações da Live Photo.
- Nenhuma mudança em backend, preço, estoque, permissões administrativas ou compra via WhatsApp.

## Limites e riscos
A máscara SVG é um recorte visual sobre fotografias externas. Ela não substitui o arquivo da foto por uma versão com canal alfa nem comprova autorização comercial de terceiros. Como cada origem tem enquadramento próprio, uma revisão visual em Safari e Chrome é obrigatória para confirmar que as máscaras não cortam tampas ou embalagens. Preferir, a longo prazo, packshots autorizados com transparência real. Não dar baixa na issue de licença de imagem apenas com esta mudança.

## Verificações
- [ ] Build Cloudflare Preview com lint e todos os testes Node.
- [ ] Avaliar as cinco páginas em 320, 375, 390, 768 e 1440 px.
- [ ] Confirmar ausência de recortes indevidos em cada frasco.
- [ ] Validar fallback de imagem externa e economia de dados.

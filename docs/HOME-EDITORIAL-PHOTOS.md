# Imagens editoriais da home — arte local e licença

## Hero: arte autoral, nítida e independente de estoque

- O arquivo `assets/images/brand/hero-perfumaria-editorial.svg` é uma **composição vetorial original** criada para a Lojinha da Kátia, com frascos genéricos, pedra clara, flores e luz quente.
- A home carrega o SVG pela **mesma origem** do frontend. Não depende do Unsplash, não perde resolução em telas de alta densidade, nem exibe marcas ou produtos que não estejam cadastrados.
- Ele é **decorativo**: não prova que um perfume específico esteja à venda e não deve ser apresentado como foto de produto real. Produtos, preços e status de disponibilidade são fornecidos exclusivamente pelo backend.
- A imagem tem proporção 720×820; o CSS a apresenta em um cartão responsivo. `fetchpriority="high"` prioriza o hero e `prefers-reduced-motion` desativa movimentos.

## Editorial secundário: imagem provisória

A seção "Uma pausa. Um aroma. Um ritual." ainda utiliza fotografia de referência do Unsplash:
[Dário Gomes — perfume rosé com flor](https://unsplash.com/photos/pink-perfume-bottle-with-white-flower-MoPGCgHPS6I),
entregue de `https://images.unsplash.com/photo-1630573133526-8d090e0269af` sob [licença Unsplash](https://unsplash.com/license).
Esta imagem é apenas editorial, não é foto de item anunciado e pode ser substituída por fotografia oficial aprovada pela proprietária.

## Checklist para homologação

- [ ] Verificar enquadramento do hero em 320, 375, 768 e 1440 px.
- [ ] Conferir se o SVG local é carregado em redes que bloqueiam imagens externas.
- [ ] Testar animações e preferência por movimento reduzido.
- [ ] Validar com a proprietária que as imagens não confundem a identidade da loja nem insinuam produtos em estoque.
- [ ] Confirmar que os cartões de catálogo respeitam `available`, preço, publicação e quantidade reais; **nunca** habilitar consulta em produto indisponível apenas por motivo visual.

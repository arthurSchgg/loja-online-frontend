# Imagens editoriais da home — Live Photo autoral e direitos

## Hero — fotografia cinematográfica local (20/11/2026)

O usuário pediu que a imagem principal da home parecesse uma **Live Photo**, com aparência fotográfica e movimento discreto, mantendo a composição editorial premium.

- `assets/images/brand/hero-live-poster.webp`: fotografia **gerada originalmente para a Lojinha da Kátia**, contendo frascos genéricos de perfume, flores, travertino e luz dourada. Não representa marca, produto vendido ou estoque real. Poster estático de 900 × 1125 px (~106 KB), prioritário para LCP.
- `assets/images/brand/hero-live-motion.mp4`: vídeo H.264 sem áudio, cerca de seis segundos (~240 KB) com movimento cinematográfico suave de câmera, hospedado na mesma origem. O efeito de Live Photo é uma animação da cena, **não uma gravação real de objetos em movimento**.
- O antigo SVG `assets/images/brand/hero-perfumaria-editorial.svg` foi preservado no repositório como histórico, mas não é usado como arte principal.
- `assets/js/hero-live-photo.js` adiciona a origem do vídeo somente quando a mídia aparece na tela e quando o movimento é permitido. A reprodução é pausada fora da viewport, na aba oculta ou ao selecionar o controle de pausa. Não há som.
- Com `prefers-reduced-motion: reduce`, `Save-Data`, conexão 2G ou sem JavaScript, só a imagem estática é exibida; o vídeo não é baixado pelos fluxos controlados.
- O botão de pausa/continuação possui área de toque de 44 × 44 px, rótulo acessível e estado `aria-pressed`.
- A imagem é **editorial**, sem relação com o catálogo Skelt ou com a quantidade disponível. Produtos e preços continuam vindo do backend.

## Recomendações de publicação

- Testar o enquadramento nos tamanhos 320, 375, 768, 1024 e 1440 px.
- Medir LCP da foto estática; o vídeo nunca deve bloquear sua exibição.
- Testar no Safari do iPad/iPhone, navegadores de desktop, conexão lenta e `prefers-reduced-motion`.
- Conferir que a pausa de vídeo é possível, que o controle pode receber foco por teclado e que o retorno à aba não reativa uma animação pausada manualmente.
- Não divulgar a cena como uma fotografia de produto realmente vendido na loja.

## Imagens secundárias: arte vetorial transparente (20/11/2026)

Para manter o estilo leve aprovado na revisão visual, a seção "Uma pausa. Um aroma. Um ritual." agora usa `assets/images/editorial/candle-floral-cutout.svg`, sem fundo retangular, com cores alinhadas ao tema rosé e luz quente. A página inicial também usa as imagens editoriais transparentes `floral-perfume-cutout.svg` e `amber-perfume-cutout.svg` para as coleções demonstrativas, sem associá-las a produtos reais.

As páginas Conheça a Loja, Viva sua Experiência, Contato e Espaço das Velas não exibem mais uma logo ampliada no hero. Cada uma usa uma composição vetorial decorativa sem fundo, fornecida pela própria aplicação. A logo verdadeira permanece pequena no header.

Os arquivos são SVGs declarativos locais e não contêm scripts, fontes externas, imagens remotas ou fotografias de itens não cadastrados. Fotografias reais fornecidas pelo backend para produtos e conteúdo administrativo não são alteradas.

O efeito de movimento está no wrapper, enquanto o parallax leve atua na imagem interna. Isso evita conflitos de `transform`. `prefers-reduced-motion` e `data-motion="off"` desativam ambos os efeitos.

## Checklist para homologação

- [ ] Verificar enquadramento do hero em 320, 375, 768 e 1440 px.
- [ ] Conferir se o SVG local é carregado em redes que bloqueiam imagens externas.
- [ ] Testar animações e preferência por movimento reduzido.
- [ ] Validar com a proprietária que as imagens não confundem a identidade da loja nem insinuam produtos em estoque.
- [ ] Confirmar que os cartões de catálogo respeitam `available`, preço, publicação e quantidade reais; **nunca** habilitar consulta em produto indisponível apenas por motivo visual.

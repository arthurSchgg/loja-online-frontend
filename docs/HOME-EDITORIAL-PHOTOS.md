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

## Imagens secundárias: fotografias reais (20/11/2026)

O usuário aprovou a composição e pediu explicitamente trocar os desenhos por **fotos de frascos reais de O Boticário**.

- Coleção floral e hero "Conheça a Loja": fotografia do frasco **Lily Eau de Parfum 75ml**. Referência do fabricante: https://www.boticario.com.br/lily-eau-de-parfum-75ml/
- Coleção amadeirada e hero "Contato": fotografia do frasco **Malbec Desodorante Colônia 100ml**. Referência do fabricante: https://www.boticario.com.br/produto/malbec-desodorante-colonia-100ml-v2/
- Hero "Viva sua Experiência": fotografia do frasco **Egeo Dolce**. Referência: https://www.boticario.com.br/produto/egeo-dolce-desodorante-colonia-90ml-v2/
- "Nossa História", em "Conheça a Loja": fotografia do frasco **Floratta Red**.
- "Espaço das Velas" e editorial secundário da home: fotografia de **vela e flores**, não de um perfume de O Boticário, para preservar a relação com o conteúdo. Foto de Thirdman/Pexels: https://www.pexels.com/photo/a-scented-candle-beside-a-vase-with-flowers-7219339/

As fotografias são **referências decorativas, não produtos em estoque**. Os oito Skelt existentes e a API continuam sendo a única fonte para produtos publicados, preços e disponibilidade. A Live Photo autoral da home permanece intacta.

As imagens são carregadas de servidores externos por URLs HTTPS referenciadas diretamente nas páginas, sem download ou cópia local pelo código. O CSS usa `mix-blend-mode:multiply` e ajustes de máscara para minimizar o retângulo branco original das fotos de produto. O novo `assets/js/editorial-photos.js` mostra uma mensagem neutra se algum host impedir carregamento; ele nunca troca um perfume por outro.

**Direitos comerciais pendentes:** visualizar uma fotografia em catálogo online **não concede automaticamente** permissão de reutilização comercial. Confirmar com O Boticário e com os detentores dos direitos das fotografias dos revendedores a autorização para uso na vitrine. A foto de Pexels tem a licença gratuita indicada na página, mas seus termos atuais também devem ser observados. Preferir fotografias licenciadas pela proprietária e ativos locais otimizados antes da publicação final, evitando hotlinks permanentes.

## Checklist para homologação

- [ ] Verificar enquadramento do hero em 320, 375, 768 e 1440 px.
- [ ] Testar o carregamento de fotografias externas e o estado de indisponibilidade do CDN.
- [ ] Testar animações e preferência por movimento reduzido.
- [ ] Validar com a proprietária que as imagens não confundem a identidade da loja nem insinuam produtos em estoque.
- [ ] Confirmar que os cartões de catálogo respeitam `available`, preço, publicação e quantidade reais; **nunca** habilitar consulta em produto indisponível apenas por motivo visual.

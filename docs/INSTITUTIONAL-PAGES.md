# Páginas públicas — Conheça a Loja e Espaço das Velas

As páginas `conheca-a-loja.html` e `espaco-das-velas.html` fazem parte **apenas do artefato público** (`dist/`), sem alterações no painel administrativo.

## Design e navegação
- Layout editorial rosé/cobre, tipografia e tokens atuais, menu com página ativa, footer e ligações com a Home.
- Motion por `data-reveal`, profundidade por `data-parallax` e ilustração da vela criada em CSS (não representa um produto real).
- Funciona em telas estreitas, com rolagem nativa, foco visível e `prefers-reduced-motion` / Save-Data.
- Os cartões demonstrativos identificam explicitamente que são conceitos e não oferecem compra, reserva ou contato fictício.

## Integração pública em modo live
**Conheça a Loja**
- `GET /api/v1/store`: substitui resumo conceitual pela descrição oficial quando disponível e mostra **apenas** WhatsApp, Instagram ou e-mail válidos/publicados.
- `GET /api/v1/content-sections`: renderiza seções publicadas com os slugs `conheca-a-loja`, `conheca-loja`, `sobre`, `sobre-a-loja`, `nossa-historia`, `historia-da-loja`, `historia` ou prefixo `sobre-`.
- O texto do backend é inserido como texto puro, **sem HTML executável**. Fotos institucionais só aparecem se tiverem URL HTTPS segura.
- Se a história não estiver publicada ou a API falhar, mostra estado vazio/erro, sem inventar a história.

**Espaço das Velas**
- `GET /api/v1/offerings`: somente serviços publicados (`CANDLE`, `WORKSHOP`, `RENTAL`), inclusive os **indisponíveis** visíveis sem botão. Filtros no navegador por tipo; nomes, fotos e preços vêm exclusivamente do backend.
- `GET /api/v1/store`: canais oficiais, sem contato inventado.
- O botão dos disponíveis reutiliza **o diálogo existente da home** e `POST /api/v1/whatsapp/confirm`: preço vigente e customizações são verificados pelo backend antes do link; nenhuma reserva nem pagamento são criados.
- As opções de aromas, cores e embalagens são construídas a partir de `options[]` publicados/ativos; não se afirma preço calculado de personalização.
- A API atual aceita uma imagem (`imageUrl`) por serviço. Uma galeria de até 12 fotos exigiria evolução de contrato backend antes de prometer tal recurso.

## Conferência

```bash
npm run check
npm test
npm run build
npm run test:browser -- --grep "demo|motion"
API_BASE_URL=/api/v1 npm run build:release
npm run test:browser -- --grep "live"
npm run build:admin
npm run check:security
```

Os testes Chromium usam uma API simulada com dados fictícios, incluindo erro de rede, filtros, variação de tamanho de tela e confirmação de WhatsApp. Ainda faltam homologação no staging real, Safari/iOS, Android, revisão da identidade e dos textos pela proprietária, acessibilidade assistiva e métricas de Core Web Vitals antes do GO de produção.

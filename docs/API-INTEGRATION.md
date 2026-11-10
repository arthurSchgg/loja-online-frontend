# Integração de API pública — Spring Boot

> **Status: implementação técnica com testes isolados.** E2E contra servidor real, homologação e dados comerciais permanecem pendentes.

## Ambientes
`assets/js/config.js` contém apenas opções públicas:
- `mode: "demo"` (padrão): oito produtos fictícios locais, sem conexão à API.
- `mode: "live"`: somente dados publicados pela API, sem fallback silencioso para fictícios.
- `apiBaseUrl: "/api/v1"` (padrão): mesma origem com a API; outras origens apenas com `allowExternalPublicApi` explícito e backend CORS sem credenciais.

Para build público em homologação:
```bash
SITE_MODE=live API_BASE_URL=/api/v1 npm run build
```
`dist/assets/js/config.js` recebe o modo e caminho públicos no momento do build; **jamais** senha/token/chave. A vitrine isolada pode consumir a API pública, mas **painel administrativo exige mesma origem HTTPS**.

## Contratos do backend verificados
| Interação | Endpoint | Resposta/validação |
|---|---|---|
| Listar produtos | `GET /api/v1/products?page=0&size=12` | `Page<ProductResponse>`: `content`, `last` (ou array conforme contrato) |
| Produto | `GET /api/v1/products/{id}` | `id`, `name`, `price`, `effectivePrice`, `available`, `images`, `brand`, `categories` |
| Serviços | `GET /api/v1/offerings` | `CANDLE`, `WORKSHOP`, `RENTAL`; `price` pode ser null |
| Experiências | `GET /api/v1/experiences`, `/{id}` | Perguntas e opções com IDs reais |
| Resultado do quiz | `POST /api/v1/experiences/{id}/evaluate` | `answers:[{questionId,optionId}]`; perfil e recomendações |
| Confirmação WhatsApp | `POST /api/v1/whatsapp/confirm` | `{type:"PRODUCT"|"OFFERING",id,expectedPrice,customizations}` → `{url,message}` |

O backend rejeita preços alterados ou indisponibilidade. O frontend exibe a confirmação do item e sua informação vigente **antes** da requisição. O link retornado precisa ser HTTPS em `wa.me` ou `api.whatsapp.com`; um segundo clique voluntário o abre. Sem mensagens automáticas, pagamentos ou pedidos persistidos.

## Diferença de domínios
CORS público aceita GET/POST estritamente definidos **sem cookies**. Painel administrativo deve ser servido sob mesmo host HTTPS que a API; cookies HttpOnly e CSRF de sessão não são expostos a uma vitrine hospedada em outra origem.

## Campos que a API não possui
`ProductResponse` não expõe pirâmide olfativa, gênero ou volume. No modo live o frontend **não inventa** essas propriedades e oculta filtros inexistentes, enquanto modo demo exibe os oito conceitos. Os URLs das imagens reais passam por validação de protocolo HTTPS/same-origin.

## Busca e categorias reais no catálogo

Em `SITE_MODE=live`, a busca por nome/descrição e o filtro de categoria são **consultas no backend**, em vez de filtros sobre somente as 12 primeiras ofertas carregadas:
- `GET /api/v1/categories` alimenta o seletor de categorias publicadas e resolve o parâmetro de links `?familia=Nome` (sem inventar categorias).
- `GET /api/v1/products?q=...&categoryId=...&page=0&size=12` filtra no servidor; páginas seguintes preservam `q` e `categoryId`.
- A mudança de busca ou categoria inicia nova paginação; respostas obsoletas são descartadas e falhas permitem repetir a **mesma** página.
- `Preço máximo` e `Ordenar por preço` ainda são **operações locais sobre produtos carregados**, com aviso na UI enquanto existem mais páginas. Não representam ordenação/preço global sobre todo o banco até o backend disponibilizar contrato para preço promocional vigente e paginação consistente.

A vitrine nunca substitui falha de API por perfumes/preços ilustrativos. CI cobre filtros, URLs, paginação, falha e requisições concorrentes; homologação real permanece necessária.

## Homologação pendente
- [ ] Testar em navegador com API e PostgreSQL de homologação autorizados.
- [ ] Conferir limites, paginação, filtros, promoção, indisponibilidade, preço e erro 409.
- [ ] Confirmar opções de velas (AROMA/COLOR/PACKAGING) com oferta publicada.
- [ ] Validar quiz real, perfil sem recomendações e disponibilidade.
- [ ] Validar foco, WCAG 2.2 AA, responsividade e Core Web Vitals.
- [ ] Revisar origens CORS, cookies, segredos, domínio, políticas e conteúdo comercial.

# Lojinha da Kátia — Perfumaria de Luxo (Frontend)

Vitrine mobile-first em **React + TypeScript + Vite**, integrada aos módulos de negócio existentes. Navegação, rodapé, cards dos catálogos publicado e demonstrativo, galeria de produtos, experiências, contato, estúdio 3D e dashboard administrativo utilizam componentes React. Identidade rosé/cobre, tipografia editorial, fotografias reais, Live Photo e movimento com GSAP/ScrollTrigger, Motion e CSS. O estúdio Three.js/React Three Fiber é carregado apenas por escolha do visitante. As bibliotecas executáveis são compiladas localmente, sem CDN de scripts.

> **PRODUÇÃO = MODO LIVE:** o Cloudflare Pages publica a vitrine usando a API pública Spring Boot/Render e dados do PostgreSQL/Neon. Na conferência de 21/11/2026 havia **65 produtos publicados, todos com fotografias**: 11 com preço maior que zero/disponibilidade registrada e 54 com preço técnico zero ainda pendente de confirmação. A vitrine não deve liberar solicitações quando preço ou disponibilidade atuais não estiverem validados. A sacola e os perfumes fictícios existem **apenas no modo demo local**, sem checkout, pedido ou pagamento. Consultas por WhatsApp exigem validação atual pelo backend.
>
> **Versão main publicada:** [Cloudflare Pages — main](https://main.loja-online-frontend.pages.dev/). Fotos editoriais de marcas de terceiros exigem confirmação de direitos de uso comercial antes de promoção pública definitiva; não equivalem ao catálogo à venda.

## Manual para a proprietária e estado da produção

- [Manual de utilização do site e do painel](docs/MANUAL-UTILIZACAO-LOJINHA-2026-11-21.md)
- [Estado de homologação e checklist de liberação](docs/GO-LIVE-ESTADO-E-ACEITE-2026-11-21.md)
- [Revisão full-stack de desempenho, qualidade e release](docs/REVISAO-FULLSTACK-2026-11-21.md)

**Administração:** [painel no host HTTPS do backend](https://lojinha-da-katia-api-rjvx.onrender.com/admin.html), separado da vitrine publicada. A entrega HTML (200) e a restrição de leitura anônima (401) foram verificadas em 21/11/2026; login e recuperação reais ainda exigem homologação. Não tente login pela Cloudflare Pages pública. O novo bundle administrativo deve acompanhar a release de backend.

## Como executar

```bash
npm ci           # instala dependências fixadas no lockfile
npm run dev      # build Vite + Python 3 HTTP server, porta 5500
npm run typecheck # TypeScript
npm run check    # Verifica sintaxe do JavaScript
npm test         # Testes Node 22
npm run build    # Gera dist/ público e garante exclusão de admin
```

Abra `http://localhost:5500` no navegador. O comando serve o artefato compilado; após alterações, reinicie o build. Não use `file://` nem o servidor direto da pasta fonte: `assets/modern/` é gerado pelo Vite.

## Estrutura e personalização

- `index.html`: hero, coleções, famílias olfativas, best-sellers, quiz, experiência, newsletter demonstrativa.
- `conheca-a-loja.html`: página institucional, história publicada e contatos oficiais no modo live.
- `espaco-das-velas.html`: apresentação editorial e filtros de velas, oficinas e locações publicados, com confirmação pelo WhatsApp.
- `catalogo.html`: listagem automática dos produtos publicados; busca, categoria, preço e ordenação realizados no backend no modo live.
- `produto.html?productId=1`: detalhe real por ID do produto publicado, com preço vigente, foto e disponibilidade obtidos da API.
- `privacidade.html`: informações de privacidade; revisar e aprovar o texto final antes de considerá-lo uma política institucional homologada.
- `assets/css/tokens.css`: seis cores centrais, tipografia, escala 4/8px, sombras, raios, movimento.
- `assets/css/base.css`, `components.css`, `pages.css`, `institutional.css`: base, componentes e layouts responsivos.
- `assets/js/data.js`: catálogo fictício usado somente na prévia demo; em produção, `assets/js/live.js` consome a API.
- `src/components/`: componentes React da vitrine (cabeçalho, rodapé, catálogo, galeria, contato, experiências e estúdio 3D).
- `src/admin/dashboard.tsx`: resumo administrativo em React, compilado exclusivamente no build privado.
- `src/motion/editorial.ts`: sequências GSAP e ScrollTrigger com movimento reduzido e economia de dados.
- `src/types/public-api.ts`: contratos normalizados em TypeScript para experiências.
- `assets/js/animations.js`: revelações progressivas, parallax limitado e indicador de leitura.
- `tools/build-modern.mjs`: compilação Vite dos módulos modernos junto ao build estático.
- `assets/images/perfumes/`: assets fictícios do demo; a vitrine publicada usa imagens cadastradas no backend e fotografias editoriais externas identificadas.
- `docs/DESIGN-SYSTEM.md`: componentes e acessibilidade.
- `docs/INSTITUTIONAL-PAGES.md`: conteúdo oficial, contratos do backend e limites de publicação das duas páginas.
- `docs/GIT-FLOW.md` e `docs/SECURITY-PERMISSIONS.md`: branches, revisões, proteção e privilégios.

Personalize cores em `tokens.css`, fontes em `--font-display` e `--font-body`, e o catálogo demonstrativo em `data.js`.

## Integração com API
O modo padrão em `assets/js/config.js` é `demo`. Para gerar a vitrine usando somente dados reais publicados:

```bash
SITE_MODE=live API_BASE_URL=/api/v1 npm run build
```

No modo live, o site oculta a sacola fictícia (inclusive itens antigos de sessão), exibe até oito produtos publicados na home e lista os produtos sem exigir texto de busca no catálogo. Itens indisponíveis continuam visíveis sem botão de solicitação. O catálogo mantém a página após falhas HTTP e permite nova tentativa. O site não usa automaticamente preços fictícios quando a API fica indisponível. Ver [contratos e limites](docs/API-INTEGRATION.md). A API pública usa `credentials: omit` (sem cookies de administração). O WhatsApp real exige confirmação e validação da URL entregue pelo backend.

Em modo live, a busca textual e as categorias consultam a API em todas as páginas (sem limitar a pesquisa aos produtos já carregados). O seletor usa categorias reais; links `?familia=...` são resolvidos pelo nome cadastrado. A ordenação e o filtro de preço são feitos no backend em todo o catálogo, inclusive promoções vigentes, quando a API contém o contrato do backend PR #160. Não publique este frontend sobre versões antigas da API. Falhas de página são recuperáveis sem saltar resultados.

No modo live, a seção de contato consulta `GET /api/v1/store` e só mostra WhatsApp/Instagram/e-mail oficiais configurados no backend. O formulário de newsletter fictício é removido desse modo, sem armazenar dados de visitantes.

Em modo live, a home **não apresenta coleções fictícias como produtos reais**: o bloco de coleções demonstrativas é ocultado, os destaques de categorias usam `GET /api/v1/categories`, e textos de quiz e avisos são coerentes com dados publicados. Os frascos ilustrativos são exclusivos do modo demo; a homologação visual com a identidade oficial ainda é obrigatória.

## Administração e recuperação de acesso

A administração de quizzes e recomendações fica em `admin-experiences.html` (build administrativo), com criação e edição visual de quizzes existentes, e vínculo de até três produtos por perfil. A edição usa o DTO completo e restrito de `GET /api/v1/admin/experiences/{id}`; caso faltem chaves de resultado, a interface bloqueia a edição para impedir perda de dados. Ao remover ou renomear chaves de perfis, a interface solicita confirmação; recomendações dos perfis mantidos são preservadas pelo backend. Requer backend com PR #156 integrado e homologação full stack antes da produção.

O painel possui formulário de mudança de senha e confirmação de novo e-mail.
O build administrativo `npm run build:admin` inclui
`reset-password.html` e `confirm-email.html`; essas páginas nunca
integram a vitrine pública. Links enviados pelo backend devem apontar
para essas URLs na mesma origem HTTPS. Ver
[documentação de segurança da conta](docs/ADMIN-ACCOUNT-SECURITY.md).

## Migração e compatibilidade

Consulte [a arquitetura e as etapas restantes da migração](docs/REACT-TYPESCRIPT-MIGRATION.md). Os contratos REST e o processo comercial continuam iguais. O painel administrativo segue segregado; seus formulários e fluxo de autenticação permanecem compatíveis com o backend.

## Animações e proteção do frontend

O frontend combina GSAP/ScrollTrigger, Motion e recursos nativos para animações suaves e mantém a rolagem do navegador. As páginas possuem CSP com scripts restritos à própria origem; o build verifica a separação entre `dist/` e `dist-admin/`. O cliente administrativo utiliza sessão/CSRF com credenciais apenas na memória, e o backend continua responsável pela autorização. Consulte [movimento, CSP e checklist para HTTPS](docs/FRONTEND-MOTION-SECURITY.md). O deploy final exige cabeçalhos de segurança definidos no servidor/CDN, além de testes de acessibilidade e performance com navegador real. O `npm run build:release` agora roda `npm run check` e `npm test` antes de gerar o build para que o Cloudflare bloqueie deployments com erros, mesmo quando os runners do GitHub Actions não são provisionados.

## Segurança e escopo do backend

O backend Spring Boot é o responsável por preços vigentes, estoque, opções de velas, mensagens de WhatsApp e autenticação administrativa. O frontend nunca deve criar pedidos ou aceitar compras sem esse contrato. A área administrativa precisa compartilhar **mesma origem HTTPS** com a API (sessão HTTP e CSRF); não publicar o admin dentro do build estático da vitrine.

## Painel administrativo

`admin.html` e `admin/` são mantidos fora do build público. O comando
`npm run build:admin` cria `dist-admin/` para **mesma origem HTTPS** da API.
O painel usa sessão HttpOnly, CSRF em memória e acesso exclusivamente controlado
pelo Spring Security. Não abra um painel real em origem diferente da API.

O painel oferece CRUD de marcas, categorias, produtos, ofertas, banners,
conteúdo e dados institucionais; estoque, promoções, opções de velas e auditoria.
A integração precisa ser testada no staging autorizado. Veja
[docs/ADMIN-OPERATIONS.md](docs/ADMIN-OPERATIONS.md).

## Smoke de integração pública

Para conferir o contrato REST público contra um backend de staging com TLS validado, execute `npm run smoke:public -- https://staging.exemplo.com`. O script faz somente GET, sem cookies, escrita ou dados fictícios automáticos; valida endpoints públicos e ordenação global por preço efetivo. Consulte [docs/STAGING-PUBLIC-SMOKE.md](docs/STAGING-PUBLIC-SMOKE.md). Essa evidência complementa, mas **não substitui**, a homologação no navegador.

## Build de release sem catálogo fictício

O comando `npm run build` continua gerando o modo de demonstração para desenvolvimento. O comando **obrigatório para publicar a vitrine real** é:

```bash
API_BASE_URL=/api/v1 npm run build:release
```

Ele força `SITE_MODE=live`, exige `API_BASE_URL` explícito, valida URLs externas HTTPS e impede que o painel administrativo seja incluído no artefato `dist/`. Para consumir API pública de outra origem, configure também `ALLOW_EXTERNAL_PUBLIC_API=true` e CORS público restrito no backend. A administração deve permanecer **na mesma origem HTTPS da API**, com seu build `npm run build:admin` implantado separadamente e com autenticação Spring Security.

O release build verifica que `build:release` **falha sem API_BASE_URL** e passa com caminho válido. O site é publicado no Cloudflare Pages, não na AWS. Permanecem bloqueantes: API pública testada ao vivo, painel administrativo sob mesma origem HTTPS da API, dados oficiais, restauração de backup, testes de navegador e direitos de uso das imagens.

## Qualidade e produção

O build Cloudflare executa `npm run check` e `npm test`; os jobs GitHub Actions recentes não receberam runners e **não executaram** os testes. A aprovação do build não substitui homologação de conteúdo real, WCAG 2.2 AA, Core Web Vitals, SMTP/segredos, identidade visual, privacidade e infraestrutura. `main` permanece reservada a releases aprovados.

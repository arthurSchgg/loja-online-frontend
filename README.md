# Lojinha da Kátia — Perfumaria de Luxo (Frontend)

Vitrine mobile-first em HTML, CSS e JavaScript ES6+ sem frameworks de interface. Identidade rosé/cobre, tipografia editorial, frascos vetoriais originais e animações GSAP/ScrollTrigger + Lenis com fallback.

> **MODO DEMONSTRAÇÃO:** os oito perfumes, preços e pirâmides olfativas são fictícios. A sacola é uma lista de interesse, sem checkout, pedido, pagamento ou reservas. Contato real via WhatsApp exige confirmação no backend.

## Como executar

```bash
npm run dev      # Python 3 HTTP server, porta 5500
npm run check    # Verifica sintaxe do JavaScript
npm test         # Testes Node 22
npm run build    # Gera dist/ público e garante exclusão de admin
```

Abra `http://localhost:5500` no navegador. Não use `file://`, que impede módulos ES6.

## Estrutura e personalização

- `index.html`: hero, coleções, famílias olfativas, best-sellers, quiz, experiência, newsletter demonstrativa.
- `catalogo.html`: filtros de família, perfil, volume, preço e ordem.
- `produto.html?id=aurora-de-petalas`: zoom, pirâmide de notas, volume 30/50/100 ml, recomendações e sacola.
- `privacidade.html`: aviso de demonstração e uso de dados.
- `assets/css/tokens.css`: seis cores centrais, tipografia, escala 4/8px, sombras, raios, movimento.
- `assets/css/base.css`, `components.css`, `pages.css`: base, componentes e layouts.
- `assets/js/data.js`: somente catálogo fictício; substituir por API depois de homologação.
- `assets/js/animations.js`: GSAP, ScrollTrigger, Lenis, parallax, reveal e fallback `prefers-reduced-motion`.
- `assets/images/perfumes/`: ilustrações SVG autorais sem imagens de terceiros.
- `docs/DESIGN-SYSTEM.md`: componentes e acessibilidade.
- `docs/GIT-FLOW.md` e `docs/SECURITY-PERMISSIONS.md`: branches, revisões, proteção e privilégios.

Personalize cores em `tokens.css`, fontes em `--font-display` e `--font-body`, e o catálogo demonstrativo em `data.js`.

## Integração com API
O modo padrão em `assets/js/config.js` é `demo`. Para gerar a vitrine usando somente dados reais publicados:

```bash
SITE_MODE=live API_BASE_URL=/api/v1 npm run build
```

No modo live, o site oculta a sacola fictícia (inclusive itens antigos de sessão) e não apresenta frascos conceituais como produtos reais. O catálogo mantém a página após falhas HTTP e permite nova tentativa. O site não usa automaticamente preços fictícios quando a API fica indisponível. Ver [contratos e limites](docs/API-INTEGRATION.md). A API pública usa `credentials: omit` (sem cookies de administração). O WhatsApp real exige confirmação e validação da URL entregue pelo backend.

Em modo live, a busca textual e as categorias consultam a API em todas as páginas (sem limitar a pesquisa aos produtos já carregados). O seletor usa categorias reais; links `?familia=...` são resolvidos pelo nome cadastrado. O preço máximo e a ordenação por preço continuam locais aos itens carregados e são identificados como parciais até existir ordenação global por preço promocional no backend. Falhas de página são recuperáveis sem saltar resultados.

## Administração e recuperação de acesso

A administração de quizzes e recomendações fica em `admin-experiences.html` (build administrativo), com criação e edição visual de quizzes existentes, e vínculo de até três produtos por perfil. A edição usa o DTO completo e restrito de `GET /api/v1/admin/experiences/{id}`; caso faltem chaves de resultado, a interface bloqueia a edição para impedir perda de dados. Ao remover ou renomear chaves de perfis, a interface solicita confirmação; recomendações dos perfis mantidos são preservadas pelo backend. Requer backend com PR #156 integrado e homologação full stack antes da produção.

O painel possui formulário de mudança de senha e confirmação de novo e-mail.
O build administrativo `npm run build:admin` inclui
`reset-password.html` e `confirm-email.html`; essas páginas nunca
integram a vitrine pública. Links enviados pelo backend devem apontar
para essas URLs na mesma origem HTTPS. Ver
[documentação de segurança da conta](docs/ADMIN-ACCOUNT-SECURITY.md).

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

## Qualidade e produção

CI executa `npm run check`, `npm test` e `npm run build`. A aprovação do CI não substitui a homologação de conteúdo real, WCAG 2.2 AA, Core Web Vitals, SMTP/segredos, identidade visual, privacidade ou AWS. `main` permanece reservada a releases aprovados.

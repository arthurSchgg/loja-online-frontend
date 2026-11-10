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

## Segurança e escopo do backend

O backend Spring Boot é o responsável por preços vigentes, estoque, opções de velas, mensagens de WhatsApp e autenticação administrativa. O frontend nunca deve criar pedidos ou aceitar compras sem esse contrato. A área administrativa precisa compartilhar **mesma origem HTTPS** com a API (sessão HTTP e CSRF); não publicar o admin dentro do build estático da vitrine.

## Qualidade e produção

CI executa `npm run check`, `npm test` e `npm run build`. A aprovação do CI não substitui a homologação de conteúdo real, WCAG 2.2 AA, Core Web Vitals, SMTP/segredos, identidade visual, privacidade ou AWS. `main` permanece reservada a releases aprovados.

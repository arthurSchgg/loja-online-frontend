# Prévia gratuita — Cloudflare Pages + Render + Neon

> **Somente prévia/homologação online.** O uso comercial definitivo exige avaliação de disponibilidade, backups, canais de e-mail, identidade e homologação. Nada aqui implanta um serviço automaticamente. O painel administrativo **não é publicado** no Pages por enquanto.

## Arquitetura escolhida

```text
Visitante
  -> Cloudflare Pages (somente dist/ público, HTTPS)
  -> chamadas públicas sem cookies ao Render (HTTPS)
  -> Spring Boot + Flyway
  -> Neon PostgreSQL

Administração: somente ambiente local de homologação HTTPS
até existir um gateway público de mesma origem, auditado e aprovado.
```

**Por que não Vercel Hobby?** A modalidade gratuita é destinada a uso pessoal/não comercial; esta loja tem objetivo comercial. **Por que não Render Postgres Free?** O Postgres gratuito do Render expira após 30 dias. O Neon evita essa expiração específica, mas suas cotas e política de retenção continuam limitadas.

## 1. Pré-requisitos

- Repositórios privados do frontend e backend conectados pelas integrações oficiais dos provedores, com permissões mínimas.
- Backend implantado primeiro no Render com banco Neon, HTTPS e `/actuator/health` respondendo `UP`; ver [guia no backend](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/DEPLOY-FREE-PREVIEW.md).
- URL **real** da API HTTPS e URL **real** que o Cloudflare Pages atribuiu ao projeto, sem inventar hostnames.
- Dados fictícios exclusivamente na prévia; **não** reutilizar senhas, DB ou imagens de produção.

## 2. Criar projeto Cloudflare Pages

Em Cloudflare > Workers & Pages > Create, conecte o repositório `arthurSchgg/loja-online-frontend`.

Configuração de build:

| Campo | Valor |
| --- | --- |
| Framework | Nenhum |
| Branch de produção | `main` após revisão e aprovação; não implantar automaticamente para a loja real enquanto estiver pendente |
| Root directory | Raiz do repositório |
| Build command | `npm run build:cloudflare` |
| Output directory | `dist` |
| Node | 22 ou superior (ex.: variável `NODE_VERSION=22`, conforme versão disponível do Pages) |
| `API_BASE_URL` | `https://HOST-REAL-DO-RENDER.onrender.com/api/v1` **(exemplo; substitua)** |

Não é necessário definir `SITE_MODE` ou `ALLOW_EXTERNAL_PUBLIC_API` no painel: o script define `live` e permite somente a API HTTPS explicitamente informada. **Nenhum segredo deve entrar no frontend**: nem senha de banco, token administrativo, chave SMTP ou cookies.

A URL é validada e deve terminar exatamente em `/api/v1`. O build falha se for HTTP, localhost, incluir credenciais/query ou não apontar para a API. O script grava cabeçalhos estáticos de proteção no `dist/_headers`, mantém a CSP declarada nas páginas com `connect-src` restrito à origem da API, e verifica ausência dos arquivos administrativos.

## 3. Conectar frontend à API

Depois que Cloudflare atribuir o domínio exato, no Render ajuste:

```env
CORS_ALLOWED_ORIGINS=https://DOMINIO-REAL-DO-PAGES.pages.dev
```

Substitua pelo endereço correto **sem barra final**. Se houver domínio personalizado aprovado, liste apenas origens explícitas, separadas por vírgula. Não use `*` e não habilite cookies para CORS.

**Fluxo externo permitido:** navegação da vitrine, leitura do catálogo, experiências e confirmação pública do WhatsApp, estritamente conforme a lista CORS sem credenciais do Spring Security. A API administrativa é negada a visitantes e não permite sessão cross-origin.

Revisão do CORS deve abranger também deploys de preview: subdomínios temporários não estão permitidos automaticamente e não devem ganhar curingas indiscriminados.

## 4. Comandos para verificar antes da publicação

```powershell
# Na pasta frontend, com Node 22+ e o endereço real:
$env:API_BASE_URL = "https://HOST-REAL-DO-RENDER.onrender.com/api/v1"
npm run check
npm test
npm run build:cloudflare
```

O resultado é `dist/` com `mode: "live"`, `allowExternalPublicApi: true` e CSP ajustada à origem do backend. **Não publica `dist-admin/` ou `dist-hml/` no Pages**. Para testar o admin, siga o ambiente local [FULLSTACK-HOMOLOGATION](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/FULLSTACK-HOMOLOGATION.md).

## 5. Critérios de homologação da vitrine

- [ ] Só aparecem produtos reais de teste cadastrados no Neon, sem fallback fictício.
- [ ] Filtros, ordenação por preço, detalhes, indisponibilidade e paginação refletem o banco.
- [ ] Links de WhatsApp mostram confirmação e endereço validado pelo backend.
- [ ] Requisições públicas não enviam cookies nem headers de autenticação.
- [ ] Falha/cold start do Render exibe estado de erro recuperável.
- [ ] `dist/` não contém `admin.html`, `admin/`, recuperação de senha nem arquivos `dist-hml/`.
- [ ] Acessibilidade, mobile, movimento reduzido e navegação manual revisados.
- [ ] Admin testado separadamente na origem HTTPS com backend real (local HML).

## 6. Limites e bloqueios

- Render Free pode adormecer após 15 minutos inativo e demorar a voltar; possui 512 MB RAM, cotas mensais e disco efêmero. Não hospedar imagens ou o banco no disco local do Render.
- Neon Free oferece 1 GB por projeto na política atual; não substitui backup independente e restauração testada.
- Cloudflare Pages Free tem cotas de build/arquivos; o uso de Functions/Workers possui limites separados — este projeto **não** cria Functions de proxy nesta fase.
- A administração exige mesma origem HTTPS da API. Publicá-la diretamente no Pages com API do Render em outra origem quebraria o contrato sessão/CSRF; **não fazer isso**.
- Render Free bloqueia portas SMTP tradicionais (25/465/587). Recuperação e notificações reais por e-mail não estão operacionais nesta prévia; não afirmar que a operação comercial está pronta.
- Se a API ficar suspensa ou as cotas acabarem, a vitrine pode ficar indisponível. Provedores gratuitos não fornecem o SLA necessário para prometer continuidade da loja.
- O bloqueio de faturamento do GitHub Actions precisa ser tratado pelo titular da conta; builds de Cloudflare não substituem aprovação da CI e da homologação.

## Próxima etapa

Somente depois dos testes, definir uma arquitetura **revisada** para hospedar o painel administrativo na mesma origem HTTPS que a API, configurar e-mails transacionais por canal suportado, definir rotina de backup, confirmar domínio e obter aceite comercial. Não ativar um painel administrativo cross-origin nem expor arquivos de homologação na CDN para acelerar essa etapa.

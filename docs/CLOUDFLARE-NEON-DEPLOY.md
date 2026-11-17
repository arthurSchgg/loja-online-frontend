# Cloudflare Pages — vitrine pública da Lojinha da Kátia

> **Ambiente de prévia, não produção aprovada.** O banco escolhido é **Neon PostgreSQL**, acessado **exclusivamente** pelo backend Spring Boot no Render (ou outro serviço Java HTTPS). Nenhuma credencial Neon pertence ao frontend.

## Arquitetura

```text
Visitante → Cloudflare Pages (HTML/CSS/JS publicamente acessível)
         → HTTPS / CORS de leitura e POSTs públicos
         → Render Web Service (Spring Boot /api/v1)
         → conexão PostgreSQL TLS → Neon
```

A separação é intencional: Cloudflare Pages só hospeda `dist/`, e o painel `dist-admin/` não é enviado para uma origem pública diferente da API. A administração exige **mesma origem HTTPS da API** para sessão HttpOnly/Secure e CSRF; os fluxos administrativos continuam em homologação local até haver um modo seguro de distribuí-los na origem do backend.

## Build dedicado

```powershell
# Na pasta do frontend, com Node.js >= 22 e variável de API pública configurada:
$env:API_BASE_URL = "https://SEU-SERVICO.onrender.com/api/v1"
npm run check
npm test
npm run build:cloudflare
```

O build:
- Exige endereço HTTPS público e caminho `/api/v1`.
- Força a vitrine a `SITE_MODE=live`, sem fallback para produtos fictícios.
- Ajusta CSP das páginas para permitir conexões somente à origem da API informada.
- Gera `dist/_headers` para segurança na Cloudflare.
- Bloqueia inclusão de páginas e scripts administrativos no `dist/`.

`API_BASE_URL` é configuração pública (aparecerá no JavaScript). **Nunca** colocar senhas, URL completa do Neon ou credenciais administrativas nas variáveis Pages.

## Configuração Git no painel Cloudflare

1. Integrar primeiro o PR do comando `build:cloudflare` à branch que será usada no projeto.
2. Em **Workers & Pages → Create → Pages → Connect to Git**, selecionar `arthurSchgg/loja-online-frontend`.
3. Usar *Framework preset: None*, *Root directory: raiz do repositório*, *Build command: `npm run build:cloudflare`*, *Build output directory: `dist`*.
4. Adicionar `NODE_VERSION=22` e `API_BASE_URL=https://SEU-SERVICO.onrender.com/api/v1` em **Settings → Environment variables**.
5. Para prévia privada/antes do aceite, manter a implantação automática de produção e branches de preview desativadas; a criação de um projeto Pages com URL pública requer autorização de publicação.
6. Após aprovação da release, escolher a branch de produção `main` e ativar os deploys desejados.

A API no Render deve aceitar **exatamente a origem da Pages**, por exemplo `CORS_ALLOWED_ORIGINS=https://NOME.pages.dev`. Se usar outro domínio ou subdomínio de preview, registrar separadamente no CORS do backend. Evitar o uso de `*` ou cookies para chamadas de API pública.

## Verificações pós-deploy (somente quando autorizado)

- [ ] `/catalogo.html` busca produtos via Render/Neon de homologação.
- [ ] Busca, ordenação e paginação refletem o PostgreSQL.
- [ ] Se o backend dormir ou estiver indisponível, a vitrine mostra erro recuperável, **sem preços fictícios**.
- [ ] `/admin.html` **não** existe no domínio Cloudflare da vitrine.
- [ ] Console do navegador não apresenta erros de CSP ou CORS.
- [ ] HTTPS está válido e arquivos estáticos têm cabeçalhos `_headers`.
- [ ] Conteúdo, imagens e canais oficiais não foram divulgados antes da aprovação.

**Nota sobre imagens:** o produto contém URLs HTTPS de fotos; para os primeiros testes, prefira URLs públicas de imagens fictícias/autorizadas. Fotos versionadas em `assets/` podem ser publicadas como arquivos estáticos na Cloudflare; para uploads automáticos pelo painel em produção, será necessário planejar armazenamento persistente separado, porque o disco do Render Free é efêmero. Nunca armazenar fotos enviadas no filesystem do contêiner Render.

## Limites atuais

- Cloudflare Pages Free: até 500 builds/mês e até 20.000 arquivos, com limite de 25 MiB por arquivo.
- Render Free: serviço suspende depois de 15 minutos inativo e pode demorar aproximadamente um minuto para voltar.
- Neon Free: 1 GB de dados por projeto e 100 CU-horas de compute por mês (consultar cotas no console).

O Free não garante disponibilidade, monitoramento e backups adequados à produção comercial. Documentação complementar do backend: [Neon + Render + Cloudflare](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/FREE-HOSTING-NEON-CLOUDFLARE.md), disponível após integração do PR correspondente.

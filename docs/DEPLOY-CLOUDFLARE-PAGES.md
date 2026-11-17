# Cloudflare Pages — Lojinha da Kátia (vitrine pública)

> **Preparado, não publicado.** Este repositório tem uma pasta de Functions para fazer proxy apenas da API pública. O painel administrativo **NÃO** é implantado no Pages. A API Java permanece em um Web Service Render Free e o PostgreSQL no Neon Free.

## Ordem de implantação

1. Encerrar problemas de CI e homologação. Integrar o PR do catálogo Skelt e revisar as imagens provisórias.
2. Disponibilizar o backend Spring Boot no Render em HTTPS e ligar ao Neon através de variáveis de ambiente protegidas, usando o Blueprint do repositório backend.
3. No Cloudflare Dashboard, acesse Workers & Pages → Create → Pages → Connect to Git. Escolha o repositório **arthurSchgg/loja-online-frontend** e use o nome de projeto Pages **loja-online-frontend**, que já corresponde ao arquivo Wrangler.
4. O arquivo `wrangler.toml` configura o serviço em `loja-online-frontend`, com o **endereço real** da API Render `https://lojinha-da-katia-api-rjvx.onrender.com` em `PUBLIC_API_ORIGIN`. O nome do projeto Pages precisa coincidir com o nome do arquivo Wrangler. Configure (sem inserir segredos no frontend):

| Campo Pages | Valor |
|---|---|
| Production branch | `main` **somente depois de mesclar/homologar**; para prévia use a branch de deploy |
| Build command | `npm run build:release` |
| Build output directory | `dist` |
| Root directory | `/` (raiz do repo) |
| Environment variable `API_BASE_URL` | `/api/v1` |
| Environment variable `PUBLIC_API_ORIGIN` | `https://lojinha-da-katia-api-rjvx.onrender.com` (já definido em `wrangler.toml`) |

A variável `API_BASE_URL=/api/v1` deve ser definida nas variáveis de build do projeto Cloudflare Pages; o `wrangler.toml` define a variável de runtime da Function e não substitui essa configuração.

O build de release força `SITE_MODE=live` e não inclui o painel/admin. **Não** configure `ALLOW_EXTERNAL_PUBLIC_API=true`: a vitrine chama o proxy same-origin em `/api/v1`. `PUBLIC_API_ORIGIN` é variável de runtime do Pages Functions, não segredo; pode ser alterada quando o endereço real do Render estiver pronto. A Function restringe o hostname à forma `lojinha-da-katia-api.onrender.com` ou `lojinha-da-katia-api-<sufixo>.onrender.com`; o host escolhido corresponde ao serviço já ativo da Lojinha.

5. O Pages Functions captura somente `/api/v1/*` por meio de `dist/_routes.json`; as páginas e imagens continuam no CDN de arquivos estáticos.
6. A rota `functions/api/v1/[[path]].js` permite:
   - GET: produtos públicos (com detalhes), marcas, categorias, loja, quizzes, serviços, seções e campanhas.
   - POST: confirmação WhatsApp e avaliação de quizzes.
   - A Function **não transmite** cookies, headers de autenticação, CSRF, redirects ou respostas não-JSON; não repassa rotas `/api/v1/auth/**` ou `/api/v1/admin/**`.
7. Testar no endereço do Pages: `/api/v1/products`, home, catálogo, imagens, ofertas e fluxo WhatsApp. Com banco vazio, o catálogo exibe estado vazio, sem inventar produtos.

## Segurança e limitações

- A origem de API permitida é fixa e restrita a Render HTTPS. Esse proxy **não é** uma camada de autorização: o backend deve continuar verificando permissões de todas as rotas administrativas.
- Verifique limites de Pages Functions/Render Free e comportamento de cold start; o plano gratuito pode suspender a API inativa.
- Para a conta administrativa, mantenha HTTPS, sessão Secure/HttpOnly, CSRF e o painel **na mesma origem Render que a API**, conforme issue backend #180. Não envie o diretório `dist-admin` à Cloudflare.
- O CORS do Spring Boot para a vitrine pode permanecer vazio: as solicitações do navegador são same-origin com Cloudflare e a Function faz o acesso entre servidores.
- Não colocar dados sensíveis, usuário de Neon, senhas, chaves ou strings JDBC no Pages.
- O preview Pages é acessível publicamente por URL; não tratar como ambiente sigiloso. Não colocar dados reais ainda não aprovados na página pública.

## Comandos para validar

```powershell
npm ci
npm test
npm run check
$env:API_BASE_URL = '/api/v1'
npm run build:release
Get-Content dist\_routes.json
```

A publicação final depende de CI, homologação e aprovação comercial. Sem domínio personalizado, o endereço gratuito do Pages basta para testes.

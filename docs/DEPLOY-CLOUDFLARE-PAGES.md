# Cloudflare Pages — Lojinha da Kátia (vitrine pública)

> **Publicado em `main` em 20/11/2026.** O commit de publicação `705319749ce6caea88fb7545ae817366c7b755ec` teve deployment Cloudflare Pages com conclusão **success**, com prévia imutável `https://132d4763.loja-online-frontend.pages.dev` e URL de branch `https://main.loja-online-frontend.pages.dev`. O painel administrativo **NÃO** foi incluído no Pages. A API Java permanece no Render e o PostgreSQL no Neon.
>
> **Pendências distintas do deploy:** os jobs GitHub Actions não receberam runners (nenhum step executado), a navegação no domínio principal não pôde ser verificada automaticamente e as licenças das fotos editoriais externas não foram comprovadas. Produtos publicados ficam indisponíveis até confirmação do estoque.

## Configuração e verificação da implantação

1. Após mudanças em `develop`, executar a validação de release e homologação. O catálogo Skelt já foi integrado, sem habilitar estoque ainda não contado.
2. Disponibilizar o backend Spring Boot no Render em HTTPS e ligar ao Neon através de variáveis de ambiente protegidas, usando o Blueprint do repositório backend.
3. No Cloudflare Dashboard, acesse Workers & Pages → Create → Pages → Connect to Git. Escolha o repositório **arthurSchgg/loja-online-frontend** e use o nome de projeto Pages **loja-online-frontend**, que já corresponde ao arquivo Wrangler.
4. O arquivo `wrangler.toml` configura o serviço em `loja-online-frontend`, com o **endereço real** da API Render `https://lojinha-da-katia-api-rjvx.onrender.com` em `PUBLIC_API_ORIGIN`. O nome do projeto Pages precisa coincidir com o nome do arquivo Wrangler. Configure (sem inserir segredos no frontend):

| Campo Pages | Valor |
|---|---|
| Production branch | `main` (publicada via PR #93); branches de feature/develop geram prévias, não substituem a produção |
| Build command | `npm run build:release` |
| Build output directory | `dist` |
| Root directory | `/` (raiz do repo) |
| Environment variable `API_BASE_URL` | `/api/v1` |
| Environment variable `PUBLIC_API_ORIGIN` | `https://lojinha-da-katia-api-rjvx.onrender.com` (já definido em `wrangler.toml`) |

As duas variáveis públicas `API_BASE_URL=/api/v1` (necessária ao build) e `PUBLIC_API_ORIGIN` (necessária à Function) estão declaradas em `[vars]` do `wrangler.toml`. O log do Cloudflare Pages deve listar **ambas** em `Build environment variables`. Se houver outra configuração na interface, garanta que não sobrescreva os valores esperados. Não configure senhas nesse arquivo.

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

## Gate de qualidade do próprio Cloudflare
O build `npm run build:release` executa obrigatoriamente `npm run check` e `npm test` **antes** de criar `dist/`. Isso evita que a falha de provisionamento de runners do GitHub Actions deixe o Cloudflare publicar versões com erros já detectáveis por testes Node. Não substitui Playwright nem a revisão comercial.

## Pendências pós-publicação
- [ ] Resolver falha de provisionamento do Actions; até lá, não alegar CI verde.
- [ ] Executar testes reais de navegador, inclusive mobile e o proxy `GET /api/v1/products`.
- [ ] Confirmar qual branch está ligada ao domínio principal, além da URL da branch `main`.
- [ ] Regularizar direitos de uso das fotografias externas (veja issue #95).
- [ ] Inserir quantidades reais e ativar disponibilidade **somente após conferência da proprietária**.

Sem domínio personalizado, o endereço gratuito do Pages é suficiente para acesso à vitrine.

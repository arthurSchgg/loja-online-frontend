# Homologação no iPhone 15

A suíte Playwright `test:iphone` utiliza WebKit, as dimensões e eventos de toque do dispositivo `iPhone 15`. Ela valida navegação, busca, ausência de rolagem horizontal, preço sob consulta, confirmação de WhatsApp e fechamento do diálogo usando API fictícia local. Não acessa credenciais, o Neon ou conversas reais. A simulação **não substitui** o Safari do aparelho físico.

## Teste automatizado

Com Node 22 e dependências do projeto:

```bash
npm install --no-package-lock --ignore-scripts
npx playwright install --with-deps webkit
API_BASE_URL=/api/v1 npm run build:release
npm run test:iphone
```

O job `browser-smoke` no GitHub Actions executará os testes WebKit junto com os testes Chromium existentes. Em 22/11/2026, a cota gratuita de processamento do GitHub Actions estava esgotada; esses jobs ainda não executaram no runner remoto. Não marcar como aprovados até observar os resultados.

## Conferência no Safari do aparelho

1. Abrir [o site publicado](https://main.loja-online-frontend.pages.dev/) em Safari; conferir menu, navegação, rolagem, textos e fotos em modo retrato e paisagem. Não deve haver corte lateral, sobreposição ou animação excessiva.
2. Abrir o catálogo. Testar pesquisa, troca de categoria/ordenação, botão de carregar mais, abrir um produto e retornar. Conferir se fotos, preço e disponibilidade correspondem ao cadastro.
3. Um produto sob consulta não pode aparecer como gratuito nem liberar solicitação de preço não confirmado. Um item com preço confirmado deve mostrar a informação vigente; a confirmação não abre WhatsApp automaticamente. Testar o botão de consulta **sem enviar mensagem**, somente após cadastrar o canal comercial oficial.
4. Se a API estiver iniciando após inatividade, conferir que a prévia mostra fotos e descrições, mas não publica valores antigos como atuais; usar atualização quando a conexão voltar.
5. Abrir o [painel administrativo HTTPS](https://lojinha-da-katia-api-rjvx.onrender.com/admin.html) e entrar somente com as credenciais da proprietária. Conferir listagem/edição sem salvar dados não aprovados; testar saída e reentrada. Confirmar a entrega de recuperação de senha apenas após configurar o remetente HTTPS oficial.

Registrar modelo do aparelho, versão iOS, data, resultado de cada etapa e eventual erro/print sem informação privada na issue de homologação. O teste de toque emulado e o teste da conta real são evidências distintas.

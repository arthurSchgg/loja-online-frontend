# Smoke de contrato público — staging

O script `scripts/public-api-smoke.mjs` testa apenas **GET** em um backend já acessível (catálogo por preço efetivo, categorias, informações da loja, serviços, experiências). Nunca faz login, não lê cookies, não envia mensagens e não altera o banco. Ele verifica dois primeiros lotes de produtos para detectar ordenação por preço inconsistente e confirma que chaves privadas de quiz não vazam nas rotas públicas.

## Execução

Use um ambiente de staging **autorizado**, com o backend atualizado com [PR #160](https://github.com/arthurSchgg/loja-online-backend/pull/160) e origem HTTPS com certificado válido:

```bash
npm run smoke:public -- https://staging.exemplo.com
```

Para staging local com certificado assinado pela CA interna do Caddy, informe o certificado raiz explicitamente:

```bash
NODE_EXTRA_CA_CERTS=/caminho/caddy-root.crt npm run smoke:public -- https://localhost:8443
```

Em PowerShell:

```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\\caminho\\caddy-root.crt"
npm run smoke:public -- https://localhost:8443
```

**Não** use `NODE_TLS_REJECT_UNAUTHORIZED=0`, URLs com usuário/senha, ou uma API real da loja sem autorização. Para desenvolvimento local HTTP somente `localhost` ou `127.0.0.1` são permitidos.

## Evidência para HML-FE-001

Anexe data, SHA do backend/frontend, URL do ambiente (sem segredo), resultado final PASS/FAIL, contagem de registros validados e logs de falhas sem dados pessoais à [HML-FE-001](https://github.com/arthurSchgg/loja-online-frontend/issues/22). Uma resposta vazia é válida para endpoints cujo catálogo ainda não possui dados — por isso é **necessário** repetir com dados fictícios representativos em staging e executar E2E no navegador (login, CSRF, formulários, WhatsApp, responsividade, WCAG, Web Vitals).

O smoke não substitui homologação comercial nem autoriza AWS/produção.

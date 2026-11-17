# Homologação integrada do frontend com PostgreSQL e Spring Boot (local)

Este documento descreve apenas a **homologação local**, com API real e HTTPS. **Não é deploy AWS nem aprovação final de produção.**

Guia completo, incluindo Docker e certificados:
[backend/docs/FULLSTACK-HOMOLOGATION.md](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/FULLSTACK-HOMOLOGATION.md).

## O que este repositório oferece

- `npm run build:hml`: gera `dist-hml/` contendo vitrine **live** e painel administrativo, usando `/api/v1` na mesma origem.
- `dist-hml/` é ignorado pelo Git e usado **somente** com o proxy Caddy local do backend; nunca publicar diretamente em CDN.
- `npm run test:hml`: testa no Chromium **sem interceptações/mock de API**, contra `https://localhost:8443` com certificado local confiável.
- As builds de produção `dist/` (pública) e `dist-admin/` (administrativa) permanecem separadas.

## Roteiro rápido (Windows, PowerShell)

Na pasta do frontend (branch `develop`), com Node 22+ instalado:

```powershell
npm run build:hml
```

Depois inicie o ambiente descrito no guia do backend; o gateway servirá:

- Site: `https://localhost:8443/`
- Catálogo: `https://localhost:8443/catalogo.html`
- Painel: `https://localhost:8443/admin.html`
- Quizzes: `https://localhost:8443/admin-experiences.html`

Para testes **automatizados do navegador**, instale a dependência de teste e Chromium (não necessário para somente abrir o site manualmente):

```powershell
npm install --ignore-scripts
npx playwright install chromium
npm run test:hml
```

O primeiro teste verifica o conteúdo público com API real. O segundo só é executado quando `HML_ADMIN_USERNAME` e `HML_ADMIN_PASSWORD` estiverem definidos. Esses valores devem ser credenciais **fictícias do staging**, não de produção.

No PowerShell, leia a senha sem mostrar na tela e armazene-a somente no ambiente deste processo:

```powershell
$env:HML_ADMIN_USERNAME = "admin-staging"
$secret = Read-Host "Senha do staging" -AsSecureString
$env:HML_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secret).Password
npm run test:hml
Remove-Item Env:HML_ADMIN_PASSWORD
Remove-Item Env:HML_ADMIN_USERNAME
```

Não grave senha em scripts, prints, histórico do shell ou URL. Os testes reais desativam screenshot, trace e vídeo para evitar capturar credenciais. **O navegador precisa confiar na CA local do Caddy.** Não ignore alertas de certificado.

## Critérios manuais de aceite

Antes de considerar o frontend homologado, verifique com dados de teste:

- Login/logout, edição de marcas/categorias/produtos, rascunhos e validações, estoque, promoções, velas, oficinas e locações.
- Publicação do catálogo e quiz, recomendações, navegação para detalhe e consulta WhatsApp após confirmação.
- Imagens HTTPS, mensagens de erro, tempos de carregamento, teclado, responsividade e preferências de movimento reduzido.
- Informações institucionais (contato/horários/região), sem inserção de conteúdo oficial.
- Restauração de sessão e registros persistentes após reinício dos contêineres.

Abra evidências nas issues [HML-FE-001 #22](https://github.com/arthurSchgg/loja-online-frontend/issues/22) e [painel #60](https://github.com/arthurSchgg/loja-online-frontend/issues/60). Não publique a `main`, compartilhe dados reais nem encerre homologação sem validação humana.

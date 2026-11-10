# Testes reais de navegador — vitrine da Lojinha da Kátia

Esta suíte complementa os testes Node com **Chromium real em GitHub Actions**, sem publicar o site ou conectar a sistemas comerciais.

## Cobertura automatizada

- **Demo, 320 / 375 / 430 / 768 / 1024 / 1440 px:** exibição da home e cards, verificação de rolagem horizontal inesperada e erros JavaScript.
- **Menu móvel:** abrir, fechar com `Escape`, retorno do foco e atualização de `aria-expanded`.
- **Catálogo e produto fictícios:** filtros, resultados vazios, navegação para produto e sacola de interesse demonstrativa.
- **Quiz demonstrativo:** interação do formulário e resultado usando a preferência `prefers-reduced-motion: reduce`.
- **Live:** catálogo publicado, categorias e informações da loja vindas de uma API simulada, remoção de sacola e newsletter fictícias, consulta WhatsApp só após resposta validada do backend simulado.
- **Falha da API:** resposta HTTP 503 não pode ativar fallback para catálogo fictício.

## Executar localmente

Necessita Node.js 22+, Python 3 e Playwright Chromium.

```bash
npm install
npx playwright install chromium
npm run build
npm run test:browser -- --grep "^demo"
API_BASE_URL=/api/v1 npm run build:release
npm run test:browser -- --grep "^live"
```

O runner Playwright inicia um servidor HTTP local somente em `127.0.0.1:5500`; utiliza URLs e produtos de teste. Não depende do backend online. O CI instala Chromium em runner isolado, executa os dois modos e retém screenshot/trace apenas quando ocorrer falha.

## Limites desta evidência

Este teste usa uma **API mockada no navegador**, não credenciais da loja, serviços AWS ou PostgreSQL real. O backend já tem um smoke público HTTPS separado; as duas validações não substituem E2E full stack.

Aprovação manual necessária em [HML-FE-001](https://github.com/arthurSchgg/loja-online-frontend/issues/22): Safari/iOS, Chrome/Android, teclado e leitor de tela, processos reais de administrador e quiz, CSP/HSTS/HTTPS de hospedagem, comunicação com backend de staging autorizado, comportamento de conexão lenta, licenças das imagens e metas de WCAG 2.2 AA e Core Web Vitals p75.

**Não realizar `main`/release ou AWS até o GO técnico/comercial registrado.**

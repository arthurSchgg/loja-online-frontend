# Frontend — movimento, performance e segurança

## Movimento editorial

O frontend usa **Web Animations API, IntersectionObserver e CSS**, sem dependências executáveis externas de GSAP, ScrollTrigger ou Lenis.

- Hero: entrada discreta de textos e ilustrações.
- Seções, produtos e famílias: revelação quando entram na área visível, inclusive cards adicionados posteriormente pela API, sem ocultar conteúdo quando JavaScript estiver desligado.
- Parallax: deslocamento limitado a 18 px em telas a partir de 769 px; scroll nativo e atualização por `requestAnimationFrame`.
- Fundo e marca d'água: movimentos leves com transformações, sem mudanças bruscas no layout.
- Transições de navegação: `@view-transition` apenas quando suportado.
- Microinterações em botões, cards, escolhas do quiz e cards de coleção.
- Preferências: `prefers-reduced-motion: reduce` impede animações decorativas; `Save-Data` desativa os efeitos JavaScript; em navegadores sem IntersectionObserver/WAAPI o conteúdo permanece disponível.

Não adicionar smooth-scroll que capture o wheel, loops de renderização permanentes ou animações que alterem a posição dos elementos por propriedades de layout (width/top/left). Verificar no celular com CPU limitada e com navegação por teclado.

## Segurança da camada cliente

1. Páginas públicas e de administração definem CSP por `<meta http-equiv="Content-Security-Policy">` com `script-src 'self'`, `object-src 'none'`, `base-uri 'self'` e `connect-src 'self'`. Não há scripts JS de execução remota no HTML.
2. O build público ajusta **somente** `connect-src` para a origem externa HTTPS da API quando `ALLOW_EXTERNAL_PUBLIC_API=true` é explicitamente configurado. Por padrão a API deve compartilhar a origem do site.
3. Conteúdos da API usados como identificadores devem passar por validação de inteiro positivo antes de aparecerem em atributos HTML. Texto recebido da API deve ser tratado como texto e escapado quando integrado a HTML.
4. O cliente de administração usa apenas `/api/v1/...` na mesma origem; bloqueia caminhos suspeitos, redirecionamentos automáticos e respostas CSRF com cabeçalho inesperado. Tokens continuam **somente em memória**, nunca em localStorage/sessionStorage.
5. Dados privados do painel e campos de senha são limpos quando a sessão é encerrada ou uma alteração de credenciais termina. Todas as verificações de autorização são também exigidas no Spring Security: um CSP ou controle de UI não concede proteção de autorização.
6. O CI executa `npm run check`, `npm test`, builds demo/live/release e administrativo, além de `npm run check:security` para examinar CSP e isolamento de artefatos.

### Limites da CSP declarada no HTML

A CSP por meta protege parcialmente contra execução indevida, mas **não substitui os cabeçalhos HTTP** que devem ser configurados no domínio real. Antes do deploy, configurar e testar no gateway/servidor HTTPS:

- `Content-Security-Policy` em cabeçalho, incluindo `frame-ancestors 'none'` na administração (não funciona por meta), origens exatas para scripts, fontes, imagens e `connect-src`.
- `Strict-Transport-Security` somente depois de confirmar HTTPS válido no domínio e subdomínios.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (ou mais restritivo), `Permissions-Policy` e controle de cache adequado a páginas de autenticação.
- Cookies de sessão `HttpOnly`, `Secure` e `SameSite`, CSRF real e permissões administrativas no **backend**.
- Nunca publicar o conteúdo de `dist-admin/` no bucket público ou CDN da vitrine. O painel e a API administrativa exigem mesma origem HTTPS e restrições de acesso.
- Revisar as requisições externas a Google Fonts e a imagens HTTPS cadastradas (privacidade e licenças). A remoção de scripts de CDN não elimina essas conexões de conteúdo.

### Verificação prática

```bash
npm run check
npm test
SITE_MODE=live API_BASE_URL=/api/v1 npm run build
npm run build:admin
npm run check:security
```

Esses testes não comprovam WCAG 2.2 AA, Core Web Vitals em p75 ou segurança do domínio real. Registrar testes manuais de teclado, tela pequena, redução de movimento, conexão lenta, navegação, formulários e comportamento do cache na issue HML-FE-001 antes de liberar `main` e AWS.


## Ajuste de movimento perceptível na develop (10/11/2026)

- Na implementação anterior, as animações de entrada eram **executadas só uma vez** e o deslocamento de imagens era limitado a 14 px e **desativado em larguras de até 768 px**. O código existia, mas podia parecer estático depois dos segundos iniciais.
- O hero agora mantém um **movimento flutuante contínuo** do frasco conceitual, após a animação de entrada; cartões/elementos que aparecem na rolagem entram com elevação mais perceptível.
- Imagens de produtos, coleções e editoriais têm deslocamento associado à rolagem limitado a **±28 px no desktop** ou **±12 px em telas pequenas**, calculado apenas para imagens próximas da viewport por IntersectionObserver e um requestAnimationFrame passivo.
- A opção `prefers-reduced-motion: reduce` elimina esses efeitos. O modo `Save-Data` impede o movimento extra das imagens e a animação contínua da imagem do hero.
- O CI Playwright agora **verifica movimento de verdade** no navegador em 375 e 1440 px e confirma sua ausência com preferência de movimento reduzido; antes a suíte só testava interação e layout.

**Como conferir:** utilize um servidor HTTP (`npm run dev` ou o build `npm run build` com `python3 -m http.server --directory dist 5500`), e não abra `index.html` diretamente com `file://`, pois os scripts são módulos ES. Se o sistema/navegador estiver em “reduzir movimento”, as animações decorativas serão omitidas de propósito. Um site publicado ainda pode servir uma versão em cache: valide o commit e o bundle carregado no navegador.

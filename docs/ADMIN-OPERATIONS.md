# Painel administrativo — preparação e permissões

> **Sem credenciais de teste reais, sem publicação e sem homologação.**
> O frontend só chama rotas autorizadas pelo Spring Security do backend.

## Onde disponibilizar
- Não hospedar `admin.html` no domínio estático do AWS Amplify se a API estiver em outra origem.
- Servir `dist-admin/` sob **o mesmo HTTPS host/origin** da API Spring Boot, por Caddy/Nginx/CloudFront+proxy aprovado; rotas `/api/v1/` encaminham ao backend.
- `npm run build`: vitrine somente, `dist/`; exclui admin.
- `npm run build:admin`: painel separado, `dist-admin/`, **não é deploy**.

## Sessão e CSRF
1. `GET /api/v1/auth/csrf` fornece nome do cabeçalho/token temporário.
2. `POST /api/v1/auth/login` usa `application/x-www-form-urlencoded` e CSRF.
3. Após login, o navegador recebe cookie HttpOnly/Secure e renova o CSRF.
4. `GET /api/v1/auth/me` confirma sessão. Escritas sob `/api/v1/admin/**` exigem CSRF.
5. `POST /api/v1/auth/logout` invalida a sessão. CSRF permanece somente em memória JS; não usar localStorage nem token persistente.
6. Sessões legadas e expiradas recebem 401; backend controla bloqueio de login e 30 min de inatividade.

## Módulos implementados no cliente
Marcas, categorias, produtos (galeria/brand/categories, publicar/indisponibilizar), ofertas CANDLE/WORKSHOP/RENTAL e opções, conteúdo, banners/campanhas, dados institucionais, consulta auditável, estoque (ENTRY/EXIT/ADJUSTMENT com motivo) e promoções com período.

**Importante:** ações de excluir/alterar dependem do backend real, da sessão autorizada e de confirmação visual. O código não contém senhas nem cria administradores. Algumas regras comerciais ainda exigem teste integrado e autorização de conteúdo.

## Permissões (comentários)
- Visitante: apenas API pública, sem credencial de administração.
- Admin: único usuário persistido do backend, ROLE_ADMIN; interface não confere permissão por JS.
- Colaborador GitHub: Write para branches de feature; **não** Admin para código CSS.
- GitHub Actions: `contents: read` e sem secrets de produção; não aprova HML ou provisiona AWS.
- CODEOWNERS sugere revisão, não é proteção efetiva de branch. Configurar rulesets para main/develop na UI do GitHub.

## Experiências e recomendações

`admin-experiences.html` permite criar quizzes completos com perguntas, opções e perfis, além de configurar até três produtos por perfil. O backend não disponibiliza a leitura administrativa **completa** de `resultKey`/`results`; a interface não realiza atualização integral com resposta incompleta para evitar perda de dados. A edição segura dos quizzes existentes requer ampliação do contrato pelo backend e homologação independente.

## Gestão da conta

Alteração de senha e solicitação de troca de e-mail ficam na seção
"Segurança da conta" do painel. Recuperação e confirmação de links são
realizadas em `reset-password.html` e `confirm-email.html`, **somente
no build administrativo** e na mesma origem HTTPS da API.
Consultar [procedimento de conta](ADMIN-ACCOUNT-SECURITY.md) e configurar
as URLs de SMTP no backend antes do uso real.

## Homologação ainda exigida
- [ ] Acesso com HTTPS válido e domínio final.
- [ ] Fluxo CSRF, sessão, login/logout, senha errada, inatividade, mudança de senha e sessão revogada.
- [ ] CRUD com dados fictícios e banco staging autorizado, validação de imagens, estoque e promoções.
- [ ] Administração por teclado, screen reader, avisos e estados vazios.
- [ ] Revisão de operações críticas, auditoria, política de privacidade e HML-006 por responsável técnico.


## Edição segura das experiências (contrato backend #156)

A tela `admin-experiences.html` permite abrir uma experiência já cadastrada, buscar o DTO completo em `GET /api/v1/admin/experiences/{id}` e enviar `PUT` para o mesmo recurso. O endpoint administrativo deve devolver `id`, `published`, `title`, `description`, `questions[]` com `options[].resultKey` e `results[]` com `key`, além dos `productIds` associados. Sem essas informações, o formulário **não tenta editar**, pois não é seguro reconstituir resultados a partir do DTO público.

A API pública `GET /api/v1/experiences/{id}` não expõe regras de votação. O backend preserva recomendações apenas para perfis cujas keys permanecem iguais no update; a remoção de um perfil também remove seus vínculos. A administradora deve revisar as consequências antes de mudar uma key. Login, sessão, role e CSRF são validados **no backend**; build/admin continua fora da vitrine pública.

Esta alteração não libera produção por si só. Exigir CI de ambos os repositórios e E2E com PostgreSQL, HTTPS, restauração de dados e revisão técnica no staging (HML-FE-001).

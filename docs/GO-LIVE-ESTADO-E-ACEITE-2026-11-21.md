# Estado operacional e aceite — 21/11/2026

## Conclusão resumida

**Vitrine: publicada e com dados cadastrados. Operação completa: ainda não homologada.**

Esta revisão realizou somente consultas de leitura no Neon, inspeção do GitHub e do build Cloudflare. Não realizou escrita no banco, nem testou credenciais administrativas ou alterou preços, estoque ou disponibilidade.

| Componente | Evidência | Estado |
|---|---|---|
| Vitrine Cloudflare | `main` commit `7af4ad54fe6c854ed60862de44af1c07325f1103` com check Cloudflare Pages `success` | Publicação confirmada pelo provedor |
| Dados de produtos | 65 registros, 65 publicados, 65 com foto | Cadastrado |
| Preço comercial | 11 itens publicados com `price > 0`; 54 com `price = 0` | Pendente revisão do valor dos 54 |
| Integridade básica do catálogo | 71 imagens, todas com URL HTTPS e texto alternativo; 0 duplicatas de nome dentro da marca, 0 publicações sem foto, 0 preços negativos e 0 itens disponíveis sem preço/estoque | **Verificado por SQL de leitura** |
| Disponibilidade | 11 marcados `available=true` | Validar com a proprietária |
| Conteúdo institucional | `store_information` sem linhas; `content_sections` sem linhas | Pendente conteúdo oficial |
| Experiências | `experiences` sem registros | Não há quiz publicado |
| Serviços e velas | `service_offerings` sem registros | Nada a publicar até aprovação |
| Migrações Neon | Última Flyway verificada: V17, `store contact details` | Registro de migração presente; não comprova compatibilidade do deploy |
| API Render | Ferramenta Render requer escolha expressa do workspace; única opção listada `My Workspace`; nenhum serviço inspecionado | **Não homologada** |
| API pelo domínio Pages | Não acessível por esta sessão de diagnóstico externa; existem relatos de falhas e snapshot público de recuperação | **HTTP 200 não confirmado** |
| Admin | `admin.html` e `dist-admin/` existem no código mas são excluídos do build público | Deploy admin de produção **não comprovado** |
| CI GitHub | Última execução em `main`: `tests` e `browser-smoke` `failure`, `runner_id=0`, `steps=0` | Testes de browser não executados |
| Imagens | Fotografias e URLs existentes; comprovação de direitos comerciais ainda pendente (issue #95) | Revisão documental pendente |
| Backups | Scripts de backup/restauração existem; nenhuma execução de produção verificada nesta revisão | Restore não homologado |

## Observações técnicas verificadas

1. O frontend `main` envia `sort` e `maxPrice` para `GET /api/v1/products`. O controller da branch `main` do backend no GitHub ainda não declara esses parâmetros. Sem verificar a branch efetivamente usada pelo Render, não é possível garantir a ordenação ou filtragem global de preço em produção. A branch backend `develop` está cerca de 205 commits à frente da `main`; **não promover em bloco sem staging, backup e testes de migrações**.
2. O frontend tem um snapshot apenas público para mostrar foto/nome/descrição durante falha da API, mas esse modo **não substitui preços ou disponibilidade ao vivo** e não deve liberar WhatsApp.
3. O build Cloudflare pode passar com testes de sintaxe/Node enquanto GitHub Actions não executa os testes por indisponibilidade de runner. Não declarar Playwright, login/admin ou fluxo de compra “homologados” por isso.
4. O backend e a administração devem compartilhar origem HTTPS para sessão e CSRF. O Cloudflare público bloqueia rotas administrativas e não inclui o painel estático.

## Plano de liberação final — ordem sugerida

- [ ] A proprietária confirma a utilização do workspace Render **My Workspace**; então verificar serviço, branch, logs e startup.
- [ ] Conferir `GET /actuator/health`, `GET /api/v1/products`, `GET /api/v1/store` no serviço, com resposta HTTP 200 ou estado vazio esperado; conferir via URL Pages `/api/v1/products?page=0&size=12`.
- [ ] Validar `PUBLIC_API_ORIGIN`, DNS/TLS, tempo de despertar do Render e conexão Neon; corrigir causa raiz da issue #109 sem expor segredos.
- [ ] Definir plano de rollout do contrato `sort/maxPrice` entre frontend e backend, com teste de promoções encerradas e sem promover `develop` em bloco.
- [ ] Corrigir provisionamento de runners GitHub Actions (issue #94), rodar testes unitários, integração PostgreSQL/Flyway e Playwright no Safari/Chromium; guardar evidências.
- [ ] Publicar `dist-admin/` sob mesma origem HTTPS da API e testar sessão, CSRF, login/logout, senha, recuperação e funções críticas; não disponibilizar login em Pages público.
- [ ] Registrar dados **oficiais** da loja: WhatsApp, Instagram, e-mail, horários, região e história; sem inventar informações.
- [ ] Revisar os 54 produtos com preço técnico zero e corrigir o contrato “sob consulta” no backend (issue #190) antes de habilitar pedidos.
- [ ] Confirmar estoque físico dos itens marcados disponíveis, descontos e imagens.
- [ ] Verificar licenças/autorizações das fotografias de terceiros (issue #95).
- [ ] Comprovar backup PostgreSQL e restauração em banco de teste separado; registrar recuperação/rollback.
- [ ] Homologar no iPhone/iPad e desktop, registrar aceite da proprietária e encerrar pendências técnicas.

## Referências no GitHub

- Frontend: https://github.com/arthurSchgg/loja-online-frontend
- Backend: https://github.com/arthurSchgg/loja-online-backend
- Issue API: https://github.com/arthurSchgg/loja-online-frontend/issues/109
- Issue GitHub Actions: https://github.com/arthurSchgg/loja-online-frontend/issues/94
- Issue fotografias: https://github.com/arthurSchgg/loja-online-frontend/issues/95
- Backend release: https://github.com/arthurSchgg/loja-online-backend/issues/189
- Contrato de preço sob consulta: https://github.com/arthurSchgg/loja-online-backend/issues/190
- Manual da proprietária: `docs/MANUAL-UTILIZACAO-LOJINHA-2026-11-21.md`

**Não declarar “produção totalmente homologada” enquanto os itens bloqueantes estiverem abertos.**

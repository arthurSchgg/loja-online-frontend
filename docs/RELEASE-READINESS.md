# Preparação da próxima entrega — Lojinha da Kátia

> **Status atual: implementação técnica disponível; homologação integrada e aprovação comercial pendentes.** O merge anterior de `develop` em `main` não significa que o sistema esteja aprovado para publicação. Não substituir dados oficiais por dados de demonstração em produção.

## O que já existe no código

| Componente | Situação técnica | O que ainda verificar |
| --- | --- | --- |
| Vitrine HTML/CSS/JS | Páginas e build `dist/` disponíveis | Layout real, acessibilidade, navegação e conteúdo oficial |
| Catálogo live | Cliente para produtos, categorias, filtros, paginação e preços vigentes | Respostas reais do Spring Boot, promoções, indisponibilidade e imagens |
| Painel administrativo | Build separado `dist-admin/` e telas de gestão | Operações com sessão/CSRF e PostgreSQL real |
| Experiências e serviços | Telas e contratos de integração implementados | Quiz completo, recomendações, velas, oficinas, locações e WhatsApp |
| Homologação local | `npm run build:hml` e Compose no backend | Execução efetiva com Docker, HTTPS, API, PostgreSQL e aceite humano |

**Atenção:** o build `npm run build` é de demonstração. Para a vitrine real, usar `npm run build:release` com `API_BASE_URL=/api/v1`. O bundle `dist-hml/` é exclusivo de homologação local e não deve ser publicado como site estático.

## Roteiro de validação no computador (Windows / PowerShell)

O IntelliJ pode ser usado para editar e acompanhar o projeto, mas não substitui Node.js para executar os scripts de build do frontend. Se `npm` não for reconhecido, instale o **Node.js 22 ou superior** pelo canal oficial, abra um novo terminal e confira `node --version` e `npm --version`. O comando abaixo é executado no terminal do IntelliJ ou no PowerShell.

1. Clone os repositórios como pastas irmãs: `loja-online-frontend` e `loja-online-backend`. Atualize `develop` com `git pull --ff-only origin develop`.
2. Na pasta do frontend, execute `npm run check`, `npm test`, `npm run build:release` com `API_BASE_URL=/api/v1` e `npm run build:admin` (sem publicar qualquer artefato).
3. Execute `npm run build:hml` para criar `dist-hml/`.
4. Siga **integralmente** o guia do backend [Homologação full stack local](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/FULLSTACK-HOMOLOGATION.md), incluindo os cuidados com senha fictícia, Compose, certificado HTTPS e limpeza da CA temporária.
5. Use apenas produtos e contatos fictícios no banco de homologação. Confira que as alterações feitas pelo painel aparecem no catálogo live; reinicie os contêineres sem apagar volumes e verifique persistência.
6. Registre resultados e evidências **sem senhas, cookies, tokens, e-mails reais ou dados pessoais** nas issues [HML-FE-001 #22](https://github.com/arthurSchgg/loja-online-frontend/issues/22) e [painel #60](https://github.com/arthurSchgg/loja-online-frontend/issues/60).

### Checklist mínimo de aceite manual

- [ ] Home, catálogo, detalhes, institucional, experiências, velas, contato, privacidade e estados vazios funcionam no celular e desktop.
- [ ] Login só libera o painel com sessão confirmada; logout e expiração bloqueiam ações protegidas.
- [ ] Cadastro e edição de marca, categoria, produto, imagem, preço e publicação refletem na API e na vitrine.
- [ ] Estoque e promoções apresentam valores corretos e mantêm histórico.
- [ ] Quizzes recomendam somente produtos elegíveis e publicados; opções de serviços e WhatsApp exigem confirmação.
- [ ] Falhas de API mostram estado de erro, sem injetar preço ou catálogo fictício.
- [ ] Sem rolagem horizontal, elementos inacessíveis por teclado ou animações obrigatórias com movimento reduzido.
- [ ] Há evidência de persistência PostgreSQL, verificação de HTTPS e revisão de segurança/admin.

## Bloqueio de CI no GitHub

No PR #75, os jobs `tests` e `browser-smoke` **nem iniciaram**: o GitHub informou falha de pagamento ou necessidade de ajustar limite de gastos da conta. O aviso sobre migração do `ubuntu-latest` para Ubuntu 26 não foi a causa desse bloqueio.

- Regularizar o faturamento/limites na conta do GitHub; a revisão do código não pode resolver esse bloqueio.
- Após regularização, reexecutar o workflow. **Não marcar checks como aprovados por ausência de execução.**
- Não remover `tests`, `browser-smoke`, proteção de branch ou controle de revisão para contornar o bloqueio.
- Mesmo com CI verde, homologação integrada e aprovação humana continuam obrigatórias.

## Dependências para publicação

- [ ] Conteúdo comercial oficial e direito de uso das imagens fornecidos pela responsável.
- [ ] Integração real validada em homologação, incluindo painel e banco independente.
- [ ] Domínio, infraestrutura, SMTP e segredos de produção definidos e protegidos.
- [ ] Política de privacidade e comunicação comercial revisadas.
- [ ] Testes e evidências de acessibilidade, desempenho e segurança avaliados.
- [ ] Aprovação técnica e comercial explícita registrada.

**Decisão atual: NO-GO para produção.** O desenvolvimento pode continuar em `feature/*` → `develop`; não é necessário inserir produtos oficiais até a homologação de dados fictícios estar aprovada.

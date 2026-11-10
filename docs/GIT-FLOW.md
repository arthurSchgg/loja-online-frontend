# Git Flow · Lojinha da Kátia — Frontend

## Branches
| Branch | Propósito | Política |
|---|---|---|
| `main` | Versões publicadas e aprovadas | Somente PR de `release/*` ou `hotfix/*` após HML |
| `develop` | Integração contínua | PR por história/tarefa, CI verde, sem deploy |
| `feature/US-###-slug` | Funcionalidade | Nasce de develop, volta a develop |
| `fix/BUG-FE-###-slug` | Correção | Nasce de develop |
| `release/vX.Y.Z` | Release candidate | Escopo congelado, validação HML, PR à main |
| `hotfix/vX.Y.Z-slug` | Correção urgente | Nasce de main, após release sincroniza develop |

## Commits semânticos
- `feat(catalog): add fragrance filters`
- `fix(whatsapp): validate availability before contact`
- `refactor(api): isolate HTTP client`
- `test(cart): cover drawer quantities`
- `docs(security): clarify same-origin session policy`
- `ci(frontend): validate build and tests`
- `chore(repo): update templates`

## PR, revisão e merge
1. Referenciar issue no PR; listar critérios, evidências, riscos, dispositivos e dados fictícios.
2. CI em PR para `develop`; a revisão automatizada é comentário técnico, **não assinatura do responsável técnico**.
3. O autor de PR não pode aprovar formalmente seu próprio PR em GitHub. Administradores podem mesclar **apenas quando as regras aplicáveis permitirem e os testes passarem**; deixar registro do procedimento.
4. Preferir squash merge mantendo título semântico (`feat(ui): ... (#N)`); nunca force-push main.
5. Não fechar issue de homologação porque o CI passou; exigir critérios funcionais e responsáveis.
6. Release só entra em main após HML-006, privacidade, conteúdo comercial, segurança operacional e decisão explícita.

## Rastreabilidade
Histórias `US-###` usam Story Points Fibonacci; tarefas `TASK-FE-###` não têm pontos. Toda issue inclui prioridade, critérios, dependências e links.
As issues de frontend #1–#15 formam o backlog inicial.

## Observação
A capacidade disponível do conector não inclui criação de labels personalizadas, milestones, GitHub Projects ou rulesets de branch protection. Esses controles precisam ser configurados na interface do GitHub; a existência deste documento não indica que foram ativados.

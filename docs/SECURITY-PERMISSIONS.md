# Permissões, responsabilidades e segurança

> Esta página é uma recomendação documentada. **Não altera** permissões de usuários, rulesets ou acessos na conta.

## Matriz proposta (menor privilégio)
| Sujeito | Permissões | Comentário |
|---|---|---|
| Visitante | Leitura pública de API e da vitrine publicada | Nunca recebe sessão administrativa, cookies cross-origin ou credenciais |
| Administradora da loja | Área /admin apenas autenticada, sessão HttpOnly, CSRF | Não é um papel GitHub; autorização no Spring Security |
| Colaborador de frontend | `Write` no repo em branches de feature | Não pode ser necessário ser `Admin` nem ter segredos cloud |
| Revisor técnico | `Maintain` ou PR review sem privilégios de infraestrutura | Aprovação de código não equivale a HML/go-live |
| Proprietário do GitHub | `Admin` | Configura branch protection, keys, secrets e permissões |
| GitHub Actions | `contents: read`, `actions: read` | Não precisa `contents: write`; **nenhum** deploy automático |
| Backend | API pública GET e POST WhatsApp controlado; admin protegido | CSRF e cookies só na origem correta; valida preço/estoque |

## Regras recomendadas no GitHub (configuração manual)
- Proteger `main`: exigir PR, um revisor humano habilitado, CI verde, impedir force-push/deletion.
- Proteger `develop`: exigir PR e status `tests` verde; restringir bypass.
- Não incluir chaves de produção nos secrets do workflow de PR; aplicar GitHub Environments com aprovação humana para deploy futuro.
- `CODEOWNERS` especifica revisores, **mas sozinho não altera permissão nem ativa aprovação obrigatória**.
- Não conceder admin para colaborar apenas com CSS/JS.
- Só disponibilizar o painel administrativo atrás de roteamento HTTPS que compartilhe origem com a API; a vitrine publica somente a API de leitura pública.
- Nunca usar localStorage/sessionStorage para senhas ou tokens de sessão; sacola de demonstração só guarda IDs e quantidades.

## Observação sobre autoaprovação
O GitHub não considera uma revisão do próprio autor como aprovação válida. O assistente pode auditar código, executar CI e realizar merges autorizados onde as regras permitem; isso **não** substitui a aprovação formal do responsável técnico pela especificação, privacidade, identidade visual e HML.

## Escopo do MVP
Sem checkout, pagamento, cadastro de cliente, compra online ou pedidos persistidos. O contato ocorre por WhatsApp após revalidação pelo backend.

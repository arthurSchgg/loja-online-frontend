# Fluxos da conta administrativa — integração de frontend

> Evidências técnicas do frontend, **não** homologação de SMTP/TLS ou produção.

## Implementação

O painel administrativo e as páginas de recuperação executam no **mesmo host/origem HTTPS** do backend Spring Boot. O navegador gerencia o cookie `JSESSIONID` HttpOnly; `AdminApi` guarda o CSRF somente em memória.

| Operação | Endpoint | Método / política |
|---|---|---|
| Trocar senha | `/api/v1/admin/security/change-password` | POST autenticado + CSRF; atual, nova e confirmação |
| Solicitar mudança de e-mail | `/api/v1/admin/security/change-email` | POST autenticado + CSRF; senha atual e novo e-mail |
| Solicitar recuperação | `/api/v1/auth/password-reset/request` | POST público + CSRF; resposta neutra, nunca confirma cadastro |
| Confirmar recuperação | `/api/v1/auth/password-reset/confirm` | POST público + CSRF; token de uso único, senha e confirmação |
| Confirmar e-mail | `/api/v1/auth/email-change/confirm` | POST público + CSRF; token de uso único |

Trocas de credenciais invalidam as sessões antigas no backend. Após troca de senha, o painel retorna ao login e não reutiliza a sessão. O token dos links é imediatamente retirado da barra de endereços com `history.replaceState`; não existe armazenamento local de senha/token.

## Build e URLs de link por e-mail

O build **público** (`npm run build`) só inclui vitrine; **não pode** conter `admin.html`, `reset-password.html`, `confirm-email.html` ou `admin/`.

O build **administrativo** (`npm run build:admin`) inclui as três páginas e scripts. É um artefato separado, a ser servido por HTTPS sob a origem da API, com política de cache **no-store** para as páginas HTML.

Ao provisionar o backend real, configurar **explicitamente**:

```dotenv
ADMIN_PASSWORD_RESET_URL=https://DOMINIO-APROVADO/reset-password.html
ADMIN_EMAIL_CHANGE_URL=https://DOMINIO-APROVADO/confirm-email.html
```

Substituir `DOMINIO-APROVADO` somente pelo domínio HTTPS aprovado; não inserir segredos em arquivos do frontend. Se o staging/backend atual usa URLs sem `.html`, atualizar a configuração do backend ou adicionar rewrites equivalentes antes de testar recuperação. **Os links não foram testados com SMTP externo.**

## Verificações pendentes antes de produção

- [ ] API de staging e frontend sob uma única origem TLS, testes de cookies/CSRF/401 reais em navegador.
- [ ] Envio SMTP/TLS real de links com URLs absolutas válidas; expiração/uso único; proteção contra replay e enumeração.
- [ ] Controles de acesso da área administrativa, cache, CSP, `Referrer-Policy: no-referrer`, proteção de logs e rate limit.
- [ ] Fluxos manuais de senha errada, conta bloqueada, alteração de e-mail e sessão revogada.
- [ ] WCAG 2.2 AA/teclado/leitor de tela, política de privacidade e aprovação técnica.

A presença de formulários de recuperação no frontend não os torna públicos na hospedagem da vitrine. 

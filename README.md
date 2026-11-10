# Lojinha da Kátia · Frontend

Frontend independente em **HTML, CSS e JavaScript puro** para a Lojinha da Kátia.

> **Repositório privado em implantação.** A `main` é a linha estável; `develop` recebe apenas PRs com CI. Nenhuma versão foi aprovada para produção.

## Fluxo de desenvolvimento

- `main`: somente releases homologados.
- `develop`: integração de alterações revisadas.
- `feature/US-xxx-descricao`: funcionalidades.
- `fix/BUG-xxx-descricao`: correções.
- `release/vX.Y.Z`: preparação da versão; `hotfix/*` para correções urgentes.
- Commits semânticos: `feat(scope): ...`, `fix(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `chore(scope): ...`.

Não desenvolver nem mesclar diretamente na `main`. A política completa fica em `docs/GIT-FLOW.md` na `develop`.

## Escopo

Vitrine editorial rosé/cobre baseada na logo original, catálogo de perfumes demonstrativo, quiz, produtos, sacola de **consulta** sem checkout, contatos via WhatsApp e painel administrativo integrado ao backend Spring Boot na **mesma origem HTTPS**. Dados fictícios não representam produtos reais da loja.

## Segurança

Nunca versionar senhas, tokens, dados de clientes ou chaves AWS. A API valida preços, estoque e opções na confirmação de contato. O frontend não realiza pagamentos nem armazena pedidos.

**Status:** preparação; não homologado nem publicado.

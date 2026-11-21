# Revisão final full-stack — Lojinha da Kátia

**Data:** 21/11/2026. **Objetivo:** consolidar qualidade, fluidez e confiabilidade sem redesenhar a vitrine aprovada, inventar valores ou modificar dados comerciais.

## Resumo do diagnóstico

| Item | Constatação | Tratamento |
|---|---|---|
| Render | Serviço Free; deploy manual, branch `feature/DEPLOY-001-render-neon` | Diagnóstico de runtime confirmado; versão de integração mantida separada da produção |
| API real | Primeiro health excedeu 25 s; catálogo Pages inicialmente 502 e depois 200. Health final 200 | Recuperação progressiva e limite de espera; latência de cold start continua dependente da hospedagem |
| Catálogo | 65 produtos publicados, 19 categorias. Primeira página por menor preço continha 12 zeros técnicos indisponíveis | Contrato nativo de preço pendente preparado no backend; frontend segue compatível com zero legado, sem liberar consulta |
| Painel | HTML de login respondeu 200 no Render; API administrativa anônima retornou 401 | Bundle sincronizado para não desaparecer em uma futura release. Login real e recuperação ainda não homologados |
| Código frontend | Previews em toda troca de filtro, reconstrução de cards, retries longos, observers retendo nós removidos | Correções de fluidez, estabilidade, cache e retomada após retorno à aba |
| Integração | Relacionados limitados à primeira página; flag manual confundida com estoque | Busca global backend, compatibilidade transitória, novo contrato e formulário administrativo |

O serviço publicado está em `b6963adb192fa3d6c740d3e4748fa1250140edcd` (17/11), e **já suporta sort/maxPrice**. Não considerar o contrato da branch `main` backend como prova da versão efetivamente servida. Não houve escrita na base de produção nem autenticação com credenciais reais.

## Melhorias implementadas

- Carregamento independente da home e dos blocos institucionais; snapshot local só nas telas que precisam dele.
- Prévia segura enquanto a API carrega; produtos despublicados são retirados ao receber 404. Páginas já carregadas não são misturadas com dados desatualizados, e a paginação adiciona apenas novos cards.
- Cancelamento de buscas antigas, timeout, retries breves apenas em falhas rápidas e possibilidade de atualizar a vitrine; revalidação quando o visitante retorna à aba (30 s ou back/forward cache).
- Cache de 30 segundos apenas para metadados públicos institucionais/de filtros com resposta 200; preço, estoque, promoções, serviços e WhatsApp permanecem no-store.
- Vídeo espera o poster prioritário; observadores descartam elementos retirados, leituras de geometria são agrupadas e o estado de rolagem é retomado ao voltar pelo navegador. Imagens, fontes, cores e layout editorial aprovados foram preservados.
- Build elimina a cascata de importação dos tokens CSS, pré-carrega o poster, configura headers estáticos e valida todos os arquivos JavaScript; bundle admin contém somente recursos necessários e aponta para a vitrine correta quando implantado no Render.
- Confirmação WhatsApp permite atualizar a informação quando muda e copiar mensagem validada, sem abrir conversa automaticamente.
- Administração permite escolher preço confirmado/sob consulta, distingue disponibilidade manual do saldo, reativa marcas/categorias, edita promoções programadas e protege formulários/diálogos contra respostas antigas.

## Validação desta revisão

| Escopo | Resultado |
|---|---|
| Backend Java 21 — Maven verify | 131 testes aprovados, nenhum ignorado |
| Cobertura backend | 90,73% de linhas (limite 80% aprovado) |
| PostgreSQL 16.16 e Flyway | Testes reais aprovados, inclusive V17→V19 |
| SMTP local isolado | Mailpit aprovado, sem e-mail real |
| Frontend | 172 testes Node aprovados; sintaxe de 98 arquivos JS e imagens verificadas |
| Build | Demo, release live, admin, HML e separação de segurança aprovados |
| Browser automatizado local | Tentativa bloqueada pelo ambiente de execução: Chromium não iniciou por restrição de socket/processo. Não considerar os testes Playwright executados nem reprovados por assertion do site. |
| Prévia Cloudflare, PR #112 | Build bem-sucedido com o quality gate; conferência manual da home, busca por Malbec e detalhes do produto, incluindo a recuperação segura quando a API não respondeu. |
| CI remota | Os jobs do GitHub Actions terminaram com falha em poucos segundos, sem etapas ou logs de execução disponíveis. Testes locais e quality gate do Cloudflare são evidências distintas; não declarar CI remota aprovada. |

Diagnóstico complementar: durante a conferência da prévia, tanto o domínio atual quanto o da prévia responderam HTTP 504 na consulta ao catálogo, enquanto a origem Render também excedeu 25 segundos. Os logs do serviço mostram inicialização anterior do Spring Boot em 135,996 segundos e uma nova inicialização no momento da conferência. Isso confirma a necessidade de considerar o tempo de inicialização do plano gratuito; aumentar indiscriminadamente o tempo de espera não substitui o modo seguro de recuperação nem uma hospedagem adequada.

Referências do backend: [contrato REST](https://github.com/arthurSchgg/loja-online-backend/blob/develop/docs/API.md), [issue #190](https://github.com/arthurSchgg/loja-online-backend/issues/190) e [release #189](https://github.com/arthurSchgg/loja-online-backend/issues/189).

## Pendências para liberação comercial segura

1. Homologar e promover a versão backend revisada com backup/restore verificado do Neon. A nova migração muda a representação do zero técnico; não aplicá-la automaticamente ao banco publicado.
2. Revisar os preços pendentes, quantidades físicas e canais oficiais. A informação anteriormente registrada era 54 produtos com valor a confirmar; não presumir mudanças comerciais.
3. Validar a proprietária no painel, sessão, edição de cadastro fictício, logout e recuperação de credenciais. Render Free bloqueia portas SMTP usuais; escolher transporte de e-mail compatível e autorizado.
4. Conferir direitos de uso das fotografias, conteúdo institucional, serviços/experiências e política de privacidade antes de aprovação comercial.
5. Restabelecer ou comprovar os runners GitHub Actions e executar Playwright/medições de Core Web Vitals em ambiente real. Não confundir os testes locais com homologação em iPhone, Safari e produção.

O layout público foi mantido. Recursos adicionais da especificação histórica que alterariam a experiência aprovada (carrossel/destaques manuais, galerias completas dos serviços, modelos editáveis de mensagem) devem ser planejados como próxima evolução funcional, com a proprietária, sem reformular a identidade atual.

Manual atualizado: [MANUAL-UTILIZACAO-LOJINHA-2026-11-21.md](MANUAL-UTILIZACAO-LOJINHA-2026-11-21.md).

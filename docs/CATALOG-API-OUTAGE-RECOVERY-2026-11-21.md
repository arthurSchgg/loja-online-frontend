# Recuperação da vitrine pública quando a API não responde — 21/11/2026

## Incidente observado
A proprietária enviou uma captura do Safari no iPad: `catalogo.html` exibia “Não foi possível carregar esta página” e nenhum cartão de produto. Conferi no PostgreSQL/Neon: **65 produtos estão publicados, todos com fotos**. A captura mostra também o filtro de categoria ausente, sinal de falha de carregamento da API pública ou da Functions do Cloudflare. Sem logs HTTP da Pages Function/Render não é possível concluir se a causa imediata é origin, serviço inativo, banco ou timeout.

## Correção resiliente
- `assets/js/public-catalog-snapshot.js` contém **somente informações previamente públicas** dos 65 itens publicados no Neon nesta data: nome, descrição, marca, categoria e URLs das fotografias. Não carrega estoque, preço, disponibilidade nem dados pessoais.
- Home: mostra oito produtos do snapshot imediatamente, depois tenta obter os valores atuais da API e substitui os cartões ao receber resposta. Se a API falha, preserva imagens/descrições e permite tentar novamente.
- Catálogo: mostra os 12 primeiros produtos imediatamente, mantém categorias públicas selecionáveis e atualiza os cartões quando obtém dados da API. Em modo de recuperação usa paginação local do snapshot, incluindo busca por nome e descrição e categorias.
- Detalhes: em erros temporários da API, pode mostrar foto e descrição do produto anteriormente publicado, mas nenhum link transacional. Um 404 explícito não exibe um produto potencialmente despublicado.
- Todo cartão de recuperação recebe **“Informações em atualização”** e o preço fica **“Preço a confirmar”**. WhatsApp não pode ser aberto a partir desse estado. Operações comerciais só são liberadas após consulta à API atualizada.
- Filtros e ordenação por preço não podem ser avaliados a partir do snapshot, e a interface informa essa limitação. Nenhum valor fictício é mostrado.
- Requisições abortadas por mudança de filtros, HTTP 401/403 e erros de programação **não** acionam essa recuperação.

## Diagnóstico operacional ainda necessário
1. Conferir nos logs HTTP do Cloudflare Pages Function `/api/v1/products?page=0&size=12&sort=recent` o código de erro original e conferir a variável de ambiente **PUBLIC_API_ORIGIN**. Ela deve apontar para o endpoint HTTPS público do Render permitido pela allowlist da Function, sem caminho, query ou credenciais.
2. Conferir o serviço backend do Render, estado de inicialização, resposta de `GET /api/v1/products?page=0&size=12` e conectividade com o Neon.
3. Rever timeout de 18 segundos na Function versus tempo de ativação do Render gratuito, além de erros 502/503/504.
4. Revisar contrato de filtros entre o backend `main` atualmente publicado e a frontend: `sort` e `maxPrice` não aparecem na assinatura do controller `main` do backend. Não integrar a `develop` inteira sem homologar Flyway, segurança e aprovação técnica.
5. Quando a API voltar, comprovar o carregamento normal dos preços/estados e acesso ao WhatsApp somente após confirmação.
6. Atualizar e remover produtos do snapshot em cada release com alterações de publicação, para evitar imagens de itens descontinuados.

## Garantias
- Não alterei dados nem disponibilidade no Neon.
- A recuperação **não é substituto** para o backend e nunca confirma preço ou estoque.
- A fotografia é a própria imagem cadastrada e anteriormente publicada; não se inventaram perfumes.
- Testes Node verificam 65 itens sem preço/estoque, paginação, busca, regras de segurança e não exibição de ações comerciais. Testes Playwright (quando houver runner) cobrem cenário 503 e retorno de cards.
- A confirmação visual no Safari e a execução do browser-smoke ainda dependem de homologação real.

## Reversibilidade
Em caso de problema, o PR pode ser revertido sem migração de banco, já que todas as alterações são estáticas no frontend.

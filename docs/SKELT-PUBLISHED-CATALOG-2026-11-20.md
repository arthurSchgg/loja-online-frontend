# Skelt — catálogo visual publicado sem estoque (20/11/2026)

## Operação autorizada
O usuário solicitou publicar os produtos e suas imagens, **sem cadastrar ou alterar estoque**.

Oito produtos que já constavam no Neon `lojinha_da_katia` foram marcados como `published=true`, mantendo `available=false` e `stock_quantity=0` **sem atualizar a coluna de estoque nem registrar movimentações**. Nomes, descrições, preços e categorias originais não foram modificados. Os valores eram os do catálogo de referência anterior e ainda exigem validação comercial antes de liberar vendas.

Em `product_images`, a posição 0 de cada produto recebeu uma foto individual de resolução 800px do catálogo público oficial da Skelt, substituindo a miniatura local provisória como imagem principal. Alteração executada em uma transação, incluindo oito registros no log `administrative_audit_events` identificados como execução SQL autorizada, não como requisição administrativa HTTP.

## Produtos / imagens
| Produto | Foto principal (origem fabricante) |
| --- | --- |
| Maquiagem Corporal Bronzeado Instantâneo | https://skelt.vtexassets.com/arquivos/ids/157568-800-auto |
| Kit Miniaturas Sellers Set | https://skelt.vtexassets.com/arquivos/ids/157774-800-auto |
| Kit miniaturas Exótic Set | https://skelt.vtexassets.com/arquivos/ids/157776-800-auto |
| Kit Miniaturas Trends Set | https://skelt.vtexassets.com/arquivos/ids/157778-800-auto |
| Mousse Autobronzeador Dark | https://skelt.vtexassets.com/arquivos/ids/157559-800-auto |
| Luva aplicadora de autobronzeador | https://skelt.vtexassets.com/arquivos/ids/157587-800-auto |
| Autobronzeador Bifásico | https://skelt.vtexassets.com/arquivos/ids/157535-800-auto |
| Maquiagem Corporal Iluminador | https://skelt.vtexassets.com/arquivos/ids/157572-800-auto |

As URLs completas na base Neon usam parâmetros de transformação/versão do CDN do fabricante. O frontend mantém miniaturas locais somente como fallback em caso de erro ao carregar a imagem oficial. Não usar as miniaturas de 256px como imagens primárias em produção.

**Direitos de uso:** fotos do fabricante continuam sujeitas à autorização/licenciamento para reutilização comercial pela revendedora. Verificar essa permissão e preferir cópias otimizadas autorizadas, hospedadas na mesma origem, antes da versão definitiva.

## Regras comerciais preservadas
- `published=true` torna o item consultável em `GET /api/v1/products`, se o backend atual estiver conectado ao Neon.
- `available=false` mantém a indicação `Indisponível` e oculta o botão de WhatsApp. A vitrine não inventa inventário.
- A confirmação de estoque e disponibilidade será realizada posteriormente pela proprietária no admin.
- Preços já cadastrados devem ser conferidos; não foram importadas promoções nem preços novos.
- O frontend continua em `SITE_MODE=live` no build de release e não retorna silenciosamente produtos fictícios quando a API falha.

## Homologação pendente
- [ ] Conferir o funcionamento de `GET /api/v1/products` no endereço público do Cloudflare Pages após o Render acordar.
- [ ] Conferir oito cartões, imagens corretas, preço cadastrado e badge Indisponível, inclusive no celular.
- [ ] Testar carregamento lento ou bloqueio de `skelt.vtexassets.com`: imagem local fallback deve aparecer.
- [ ] Conferir individualmente as URLs e o direito de utilização das fotos oficiais.
- [ ] Validar preços e estoque somente quando a proprietária tiver as informações reais.
- [ ] Integrar release após CI, testes de navegador e homologação comercial.

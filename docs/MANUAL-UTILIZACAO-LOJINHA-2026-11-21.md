# Manual de utilização — Lojinha da Kátia

**Edição:** 21/11/2026 · **Público:** proprietária e responsável pela operação  
**Vitrine pública:** https://main.loja-online-frontend.pages.dev/  
**Estado deste manual:** a vitrine, a API e o painel revisados foram publicados. As migrações V18/V19 foram aplicadas após backup restaurado e homologação. A proprietária ainda precisa confirmar seu próprio acesso, os dados comerciais e a entrega de e-mail real.

## 1. O que a loja faz

A Lojinha da Kátia é uma **vitrine de produtos e experiências**. Ela permite conhecer os produtos, consultar descrições e fotos, pesquisar, selecionar categorias, conferir preços disponíveis e, quando a API autoriza, abrir uma solicitação via WhatsApp. **Não é um checkout:** não recebe pagamentos, não cria pedidos automáticos e não exige cadastro de visitantes.

## 2. Como navegar pelo site

1. Abra https://main.loja-online-frontend.pages.dev/ no Safari, Chrome ou outro navegador.
2. Use a navegação para **Conheça a Loja**, **Produtos**, **Viva sua Experiência**, **Espaço das Velas** e **Contato**.
3. Na página inicial, a vitrine mostra até oito produtos de destaque e um link para o catálogo completo.
4. O banner e as fotografias editoriais ilustram a identidade da loja; nem toda fotografia editorial representa um item à venda.

**Atenção:** o catálogo possui um modo de recuperação para falhas de conexão. Nesse modo, as fotos, nomes e descrições previamente publicados continuam visíveis com aviso **Informações em atualização**. O preço e a disponibilidade só ficam confiáveis após a resposta atualizada da API.

## 3. Encontrar e consultar um produto

1. Acesse **Produtos / Catálogo**.
2. Use **Buscar nome ou descrição** para pesquisar; os filtros por categoria e preço dependem da API, embora a busca textual/categoria possa funcionar na vitrine de recuperação.
3. Em **Ordenar por**, selecione a ordenação desejada. **Preço e ordenação por preço exigem a API atual e compatível**, não a prévia offline.
4. Navegue pelas páginas do catálogo. O modo normal utiliza lotes de 12 itens.
5. Toque em **Ver detalhes** para ver descrição, fotos e status. Quando houver várias fotos, selecione a miniatura; a imagem principal pode ser ampliada.

**Como interpretar os estados:**

| Indicação | Significado | O que fazer |
|---|---|---|
| Preço exibido e disponível | Dados atuais do backend, quando a API respondeu | Use a confirmação pelo WhatsApp, se habilitada |
| Indisponível | Produto publicado sem disponibilidade autorizada | Não abra solicitação de compra |
| Valor sob consulta / Preço a confirmar | Preço ainda não confirmado comercialmente | Aguardar cadastro do valor válido |
| Informações em atualização | API indisponível; foto/descrição salvas são apenas consulta | Tentar novamente; não interpretar como estoque/preço atualizado |

## 4. Como funciona o WhatsApp

Quando o produto ou serviço possui valor válido, está disponível e o backend permite, a página exibe um botão de consulta. A solicitação **confirma os dados no servidor** antes de abrir o WhatsApp. Revise o nome, preço e personalizações e confirme. Na versão revisada, também é possível copiar a mensagem confirmada; se os dados mudarem, use **Atualizar informações** e confira o novo valor antes de confirmar novamente. **Não há compra ou pagamento dentro do site.**

## 5. Experiências e Espaço das Velas

As páginas públicas mostram as experiências, oficinas, velas e locações **somente quando cadastradas e publicadas**. Se não houver conteúdo, isso não significa erro de navegação: significa que a administração ainda não publicou esses itens. A personalização de velas, quando existente, usa apenas as opções ativas do cadastro; valores podem depender de confirmação via WhatsApp.

**Estado conferido em 21/11/2026:** sem experiências e sem serviços cadastrados/publicados no banco consultado.

## 6. Contato e história da loja

A página **Contato** reúne canais oficiais cadastrados pela proprietária, como WhatsApp, Instagram e e-mail, e informações opcionais de horários e região. **Não adicione números, endereços ou perfis não aprovados.** A página **Conheça a Loja** mostra os textos institucionais quando estão publicados.

**Estado conferido em 21/11/2026:** as tabelas de dados da loja e de seções institucionais estavam vazias. Portanto, o site pode mostrar mensagens discretas de informações em atualização. Esses campos precisam ser preenchidos com informações oficiais.

## 7. Painel administrativo: pré-requisito para acesso

O arquivo de login administrativo existe no endereço HTTPS do backend: https://lojinha-da-katia-api-rjvx.onrender.com/admin.html. O build público do Cloudflare **não inclui o painel**. Não tente fazer login pela vitrine pública nem coloque senhas em sites de demonstração.

O painel é servido sob a mesma origem HTTPS da API Spring Boot, com sessão segura e proteção CSRF. A página respondeu HTTP 200 e a consulta administrativa sem login retornou 401. Login, CSRF, cookies e logout foram homologados em ambiente fictício HTTPS; a proprietária deve testar a própria conta antes de alterar dados comerciais. As funções revisadas já integram a versão publicada.

### 7.1 Entrar e sair

1. Abra o endereço administrativo HTTPS acima, utilizando apenas credenciais da proprietária.
2. Digite o usuário e a senha da conta administrativa; clique **Entrar com segurança**.
3. Se o sistema solicitar nova autenticação, entre novamente: a sessão é controlada pelo servidor, com expiração após 30 minutos de inatividade.
4. Ao terminar, use **Encerrar sessão**. Nunca compartilhe senha, código de recuperação ou captura do token CSRF.

### 7.2 Selecionar um módulo

No campo **Módulo** do painel, escolha Marcas, Categorias, Produtos, Velas/oficinas/locações, Conteúdo institucional, Banners e campanhas, Informações da loja ou Auditoria. O painel tem formulário à esquerda e registros à direita. Para alterar, escolha **Editar**, revise, clique **Salvar alterações** e confira a confirmação. Para buscar registros recentes, use **Atualizar**.

### 7.3 Marcas e categorias

Cadastre primeiro as marcas e categorias necessárias. Cada uma recebe um ID usado nos demais cadastros. Evite duplicatas e mantenha uma grafia consistente. Produtos podem ter múltiplas categorias.

### 7.4 Produtos

1. Em **Produtos**, escolha o cadastro existente ou **Novo cadastro**.
2. Informe **Nome**, **Descrição**, **Preço base (R$)**, **ID da marca** e os **IDs das categorias** separados por vírgulas. Escolha **Situação do preço**: preço confirmado (valor positivo informado) ou **Valor sob consulta** (sem preço numérico). Não atribua valores fictícios; produtos sem preço confirmado não liberam solicitação.
3. Em **Imagens HTTPS**, forneça uma por linha no formato `URL|descrição`. Preserve caminhos internos das fotos do catálogo já cadastrados; imagens novas exigem URL HTTPS autorizada. Na publicação, o produto precisa de pelo menos uma imagem válida.
4. Marque **Publicado** para exibir na vitrine; use **Disponível manualmente** somente quando o item puder de fato ser consultado.
5. Salve e confira o cadastro no site público. Atualize a página caso exista cache no navegador.

**Estoque:** no registro do produto, abra **Estoque**; use **Entrada**, **Saída** ou **Ajuste** com quantidade e motivo. Confira o saldo e o histórico após salvar. Não use o formulário para inventar unidades. Na conferência de 21/11, o banco tinha 65 produtos, todos cadastrados com uma unidade.

**Promoções:** no registro do produto, abra **Promoções**, informe o preço promocional e as datas locais. Na versão revisada, promoções programadas podem ser editadas; promoções encerradas permanecem no histórico. O preço vigente precisa ser conferido no catálogo após alteração.

### 7.5 Velas, oficinas e locações

No módulo correspondente, informe título, descrição, tipo (`CANDLE`, `WORKSHOP` ou `RENTAL`), foto HTTPS, disponibilidade e publicação. O preço pode ser `sob consulta` nos fluxos de serviços. Opções de personalização só devem ser disponibilizadas após confirmação de modelos, aromas e embalagens reais.

### 7.6 Conteúdo institucional e canais

Em **Informações da loja**, preencha o nome público, slogan, descrição, WhatsApp com DDI+DDD (somente dígitos), URL HTTPS oficial do Instagram, e-mail, horários, endereço e região, apenas se aprovados. Em **Conteúdo institucional**, cadastre identificador (slug), título, texto, imagem, ordem e publicação. Uma seção não publicada não deve aparecer para visitantes.

### 7.7 Banners, quizzes e auditoria

Em **Banners e campanhas**, revise título, imagem, destino interno, ordem, datas e publicação. A área **Quizzes e recomendações** fica em `admin-experiences.html` no build administrativo, exige API compatível e permite vincular produtos por perfil. **Auditoria** permite consultar operações registradas; não apague trilhas de histórico para ocultar erros.

### 7.8 Segurança da conta

Em **Segurança da conta**, a interface prevê troca de senha com senha atual e solicitação de alteração de e-mail. A recuperação por link exige URL de mesmo domínio e envio de e-mail validado. Os fluxos foram homologados com destinatários fictícios; o transporte HTTPS em produção depende de remetente oficial e credencial de envio autorizada. Veja o [guia de configuração](https://github.com/arthurSchgg/loja-online-backend/blob/main/docs/ADMIN-EMAIL-HTTPS.md). Não compartilhe tokens ou senhas. Mudança de senha invalida sessões abertas.

## 8. O que fazer quando algo não funcionar

| Situação | Procedimento seguro |
|---|---|
| Catálogo mostra “Informações em atualização” | Atualize a página; tente novamente. Nomes/fotos podem estar salvos, mas preço/disponibilidade não são atuais |
| Produto não permite WhatsApp | Verifique preço válido, disponibilidade e resposta da API. Não contorne a validação |
| Contato ou história não aparecem | Verifique se os dados oficiais foram salvos e publicados; no banco conferido ainda não havia dados |
| Produto aparece sem imagem | Confira a URL HTTPS e a imagem da galeria do produto |
| Painel administrativo não abre na vitrine | Comportamento esperado: ele não está incluído no Cloudflare público |
| Sessão do admin expirou | Entre novamente na origem HTTPS autorizada; não desative a segurança do navegador |
| Problema persiste | Registre página, horário, mensagem e dispositivo para diagnóstico; **não envie senha** |

## 9. Rotina de operação recomendada

**Ao cadastrar produtos:** revisar nome, descrição, imagem, marca, categorias, preço e disponibilidade.  
**Toda semana:** conferir preços, pedidos de alteração, fotografias, canais de contato e itens sem estoque.  
**Antes de campanha:** testar banner, destino, datas, promoções e link de WhatsApp.  
**Antes de atualização do sistema:** fazer backup verificável, testar staging, revisar PR e só então publicar.  
**Na manutenção:** conservar documentos de licença das imagens, não divulgar informações pessoais e revisar o resultado no iPhone e no computador.

## 10. Situação real e próximos passos

O catálogo registra **65 produtos publicados** com imagens, **11 com preço confirmado/disponível** e **54 com valor sob consulta**, agora sem preço técnico zero. Foram preservados os preços confirmados, estoques registrados, imagens e demais dados comerciais; a comparação de 17 tabelas com a cópia homologada não encontrou divergências. Não há dados oficiais de contato, conteúdo institucional, serviços ou experiências cadastrados. A proprietária deve conferir valores e estoque físico antes das vendas.

O backend passou por publicação em duas etapas, com snapshot Neon restaurado, migração V18/V19 e reversão de aplicação testada. A vitrine foi conferida no navegador, incluindo ordenação com valores confirmados primeiro. O plano Free do Render continua com demora de inicialização após inatividade; as fotos e descrições salvas permanecem disponíveis durante a recuperação e não são confundidas com valores atuais. O GitHub Actions permanece sem runner, embora o build do Render e os testes locais tenham passado. Detalhes: [homologação da release](https://github.com/arthurSchgg/loja-online-backend/blob/main/docs/RELEASE-2026-11-21.md).

Para concluir a operação comercial: (1) testar o login da proprietária; (2) cadastrar canais, horários e história oficiais; (3) revisar os preços pendentes, estoque físico e direitos de uso das fotos; (4) configurar o envio HTTPS de e-mail e validar a recuperação real; (5) programar os backups externos cifrados e restaurar periodicamente; (6) restabelecer os runners GitHub Actions e homologar o percurso no iPhone.

**Este manual não substitui a homologação.** Não inserir senhas, dados de cartão ou credenciais em arquivos compartilhados.

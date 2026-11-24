# Painel da proprietária

O design da vitrine continua inalterado quando não há banners ativos ou destaques manuais.
Use somente o novo endereço HTTPS administrativo fornecido diretamente à proprietária.
Não existe mais atalho na vitrine pública; os endereços antigos são bloqueados.
O login continua obrigatório; o endereço não substitui a autenticação.
Quando o autenticador for ativado na configuração privada do servidor, informe também
o código de seis dígitos do aplicativo. Nunca envie a chave do autenticador pelo chat.
No painel, abra **Produtos** para buscar por nome, marca, categoria, publicação e disponibilidade.
Em telas pequenas a lista de registros aparece antes do editor; use Novo cadastro ou Editar.

1. Selecione marca/categorias pelos nomes. Crie os cadastros correspondentes nos módulos Marcas e
   Categorias quando necessário. Informe apenas preço e estoque reais.
2. Em Fotos e galeria, use Adicionar fotos ou Escolher da biblioteca. A primeira foto será a
   capa; Subir/Descer altera a sequência. Revise, clique Salvar alterações e confira a vitrine.
3. Em Biblioteca de fotos, acompanhe o espaço disponível e exclua apenas fotos sem vínculo.
   O envio prepara o arquivo no navegador e valida novamente no backend. HEIC depende do
   suporte nativo do dispositivo; JPEG e PNG são as alternativas compatíveis.
4. Em Destaques da página inicial, busque produtos publicados, selecione até oito e ordene;
   desmarque a seleção personalizada para retornar ao modo automático.
5. Em Banners e campanhas, escolha a foto, título, destino interno e período. Salve e marque
   Publicado somente quando estiver pronto. O carrossel aparece apenas com campanhas válidas.
6. Em Conteúdo institucional, escolha Conheça a Loja ou Política de privacidade e publique
   o conteúdo oficial após revisão. Em Mensagens do WhatsApp, personalize os textos mantendo
   as variáveis obrigatórias; use a prévia fictícia, que não envia mensagens.
7. Em Quizzes e recomendações, use nomes de experiências, perfis e produtos. O sistema mantém
   as chaves internamente e preserva os resultados que continuam cadastrados.

As páginas públicas não contêm o painel administrativo nem cookies de autenticação encaminhados
à API. A função Cloudflare permite a leitura de fotos públicas raster com ETag por até uma hora;
as configurações comerciais são buscadas da API sem cache. O build release continua executando
checks e testes Node, e o build admin deve ser sincronizado para a mesma origem protegida da API.

O catálogo também usa uma prévia de fotos e descrições públicas, atualizada a cada
consulta bem-sucedida da primeira página e dos destaques, conservada por até uma hora.
Se a API gratuita estiver despertando, a prévia aparece sem preços, estoque ou botões
de consulta. Enquanto a página estiver visível, a recuperação repete a consulta
com intervalo crescente e limite de tentativas; nunca mantém o serviço acordado em segundo plano.

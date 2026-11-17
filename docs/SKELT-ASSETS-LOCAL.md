# Prévia dos produtos Skelt — fotos e banco local

O frontend em `SITE_MODE=live` busca produtos diretamente do endpoint Spring Boot. O frontend **não guarda preços nem disponibilidade no HTML**. As oito fotos temporárias extraídas do vídeo **já foram adicionadas nesta branch** em `assets/images/catalogo/skelt/*.webp`; são prévias compactadas de 256×256 px e devem ser substituídas por fotos oficiais de melhor qualidade antes da publicação.

O backend (PR #183) está recebendo suporte para os caminhos relativos limitados `assets/images/catalogo/<marca>/<arquivo>.webp` (PR backend #183). Caminhos com traversal/query/extensões arbitrárias não são permitidos.

## Estado atual

- O vídeo fornecido contém oito produtos Skelt; **os oito arquivos WebP já estão versionados na branch e são miniaturas temporárias**, não substituem fotos originais de qualidade.
- Estoque não foi confirmado; importação local deve **manter os produtos indisponíveis** para consulta e disponibilidade.
- A vitrine live (páginas HTML) renderiza produtos da API; a publicação no site local pode ser utilizada para revisão visual, mas **não publicar a loja externamente** sem conferência de fotos, disponibilidade e preços.

## Preparação do PC

Descompactar o pacote `catalogo_skelt_instalacao_local.zip` fornecido no ChatGPT e executar o instalador Python de dentro da pasta do pacote. Ele copia as imagens para `assets/images/catalogo/skelt`, prepara uma pasta de prévia live **local** (com API do IntelliJ em `http://localhost:8080`) e executa um SQL transacional no banco **local** (não no staging ou produção) quando for utilizado `--aplicar`.

A base `preview-live` é apenas uma cópia temporária de HTML e assets para homologação. Ela adiciona a origem da API à CSP somente na versão gerada; não modifica a configuração de release do frontend.

No final, servir os arquivos com Python integrado ao Windows:

```powershell
cd C:\Users\ARTHURMS-PC\IdeaProjects\loja-online-frontend
python -m http.server 5500 --directory preview-live
```

Abrir `http://localhost:5500/catalogo.html` e `http://localhost:5500/previa-skelt.html`. O backend deve estar executando pelo IntelliJ em `http://localhost:8080` com o banco local Docker e o CORS `http://localhost:5500`.

Após conferir estoque, disponibilidade e imagens originais, editar as quantidades via API de movimentações de estoque e publicar definitivamente apenas em ambiente autorizado.

**Não usar este pacote de imagens como publicação final em produção.** As imagens geradas do vídeo são provisórias, com resolução baixa. Não versionar senhas nem arquivos `.env`.

## Conferências antes do merge

`npm run check:skelt` valida o formato RIFF/WEBP dos oito arquivos no repositório e o build público copia automaticamente o diretório `assets/`. A CI deve ficar verde antes de integrar o PR #80. O backend importa o JSON versionado em `docs/catalogo-skelt-2026-11-17.json` pela API local, sem alterar dados de produção. Nenhum produto foi importado no PC pelo GitHub.

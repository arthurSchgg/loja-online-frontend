# Revisão de fluidez, animação das imagens e responsividade

## Implementado no frontend

- As imagens da vitrine, das coleções e das seções editoriais usam **deslocamento vertical muito pequeno durante a rolagem** (até ±14 px) por `transform`, sem alterar posições no layout.
- `IntersectionObserver` só mantém ativas imagens próximas da região visível. Um único `requestAnimationFrame` atualiza as imagens ativas e o indicador de progresso; eventos `scroll`/`resize` são passivos.
- Produtos renderizados mais tarde pela API também são observados. Em dispositivos abaixo de 769 px, conexões Save-Data e configurações de movimento reduzido, os efeitos extras de imagem não são ativados.
- Hover/teclado em cards e coleções compartilham variáveis CSS com o movimento de rolagem para evitar transformações concorrentes.
- Menu móvel fecha ao clicar em link, fora do menu, pressionar `Escape` (foco retorna ao botão) ou aumentar a janela para desktop. O botão usa `aria-expanded` e `aria-controls`.
- Em telas menores que 560 px, o catálogo passa a uma coluna, os filtros a uma coluna, os textos e imagens do hero se adaptam e controles preservam áreas de toque acessíveis.
- `scroll-padding-top` e `scroll-margin-top` evitam que âncoras fiquem escondidas sob o cabeçalho fixo.

## Validação de implementação

```bash
npm run check
npm test
SITE_MODE=live API_BASE_URL=/api/v1 npm run build
npm run build:admin
npm run check:security
```

## Teste visual/homologação que ainda depende de navegador real

- [ ] 320 px, 375 px, 430 px, 768 px, 1024 px e desktop amplo, sem rolagem horizontal ou botões cortados
- [ ] Animações suaves na rolagem lenta e rápida, sem tremores, com APIs lenta e produtos carregados depois
- [ ] `prefers-reduced-motion: reduce` e Save-Data; animações decorativas ausentes, conteúdo intacto
- [ ] Teclado: botão/menu, `Escape`, links e foco visível; leitor de tela no catálogo e nos diálogos
- [ ] LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1 (p75) em condições representativas e sem bloqueio de CPU
- [ ] Testes reais de Safari/iOS, Firefox e Chrome/Android com animações e imagens
- [ ] Integração entre frontend `SITE_MODE=live` e backend no HTTPS de homologação

O CI automatizado garante sintaxe, contratos e montagem dos bundles, **não** substitui a avaliação visual WCAG/CWV nem a aprovação comercial. Mantenha a `main` e produção protegidas até HML-FE-001.

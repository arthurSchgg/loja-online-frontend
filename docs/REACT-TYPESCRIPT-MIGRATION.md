# React, TypeScript e movimento editorial

## Arquitetura desta etapa

O frontend continua uma aplicação multipágina: rotas HTML, conteúdo institucional e CSS são preservados para SEO e carregamento progressivo. O Vite compila os componentes interativos TypeScript em módulos locais, separados por entrada. O cliente HTTP, contratos comerciais, snapshots, paginação e confirmação de WhatsApp existentes permanecem a fonte de verdade. Não há nova API nem novos dados comerciais.

| Área | Implementação |
| --- | --- |
| Cabeçalho e rodapé | React, estado do menu, Lucide, Motion, links ativos inclusive em URLs sem extensão |
| Home e páginas institucionais | Timelines GSAP, ScrollTrigger e CSS com movimento limitado |
| Catálogo publicado, demonstrativo e relacionados | Cards React com IDs estáveis e transição de posição Motion |
| Produto publicado | React, galeria, zoom e transição de fotografia |
| Contato e experiências | React, TanStack Query, DTOs TypeScript, progresso do quiz |
| Estúdio 3D | Three.js e React Three Fiber, frasco conceitual, controles de ângulo e acabamento, carregamento sob demanda |
| Painel administrativo | Resumo React tipado, com indicadores e atalhos; formulários, sessão e editores existentes preservados |
| API e regras de negócio | Módulos existentes preservados |

## Build e execução

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run build
npm run dev
API_BASE_URL=/api/v1 npm run build:release
npm run build:admin
npm run check:security
````

O build público gera `dist/assets/modern/` e exclui tudo que pertence à administração. O build de administração compila a entrada exclusiva `dist-admin/admin/modern/dashboard.js` e continua separado. Não execute um servidor estático diretamente na raiz de fonte. Sempre utilize o build antes de testar o navegador.

## Movimento e acessibilidade

Enquanto a proprietária não publicar conteúdo personalizado, os espaços institucionais, categorias, serviços, banner e experiências podem apresentar conteúdo editorial genérico. Esses exemplos não criam registros, preços, links de WhatsApp ou IDs fictícios. O conteúdo publicado pela API substitui as apresentações automaticamente. Os campos administrativos têm sugestões visuais (placeholders), sem salvar dados de exemplo.

O quiz ilustrativo funciona mesmo sem experiências cadastradas ou quando a API responde com erro. Três perguntas calculam localmente uma família olfativa, sem enviar respostas ao servidor. Um quiz oficial disponível mantém prioridade; o visitante pode escolher a alternativa ilustrativa enquanto aguarda o backend ou se ocorrer falha na avaliação.

A segunda revisão visual adiciona revelação por linhas no título da home, moldura editorial vinculada ao scroll, indicação para descobrir a coleção, cabeçalho aderente, botão de retorno ao topo com foco restaurado, menu móvel escalonado, microinterações nos cards e acabamento visual do estúdio. O movimento do frasco usa interpolação de ângulo com renderização sob demanda; controles de arraste por mouse e slider mantêm a rolagem nativa.

- Sem bloqueio de rolagem ou carregamento de scripts por CDN.
- Respeitar redução de movimento, Save-Data e foco por teclado.
- GSAP controla o movimento editorial do hero e das camadas, Motion controla transições de interface; evitar animar o mesmo elemento com dois motores.
- Manter animações de catálogo curtas; nunca atrasar confirmação ou atualização comercial.
- O estúdio Three.js/R3F só baixa o módulo pesado quando solicitado pelo visitante. A cena tem renderização sob demanda, densidade limitada e alternativa fotográfica se WebGL falhar. O frasco é autoral e explicitamente conceitual; modelos específicos de produtos exigem assets correspondentes e autorizados. Não adicionamos shaders GLSL personalizados sem necessidade.

## Próximas etapas

1. Migrar a lógica de catálogo e carregamento para serviços/hooks tipados sem alterar contratos de paginação, recuperação ou dados comerciais.
2. Migrar as seções institucionais, banners e quiz da home para componentes React.
3. Migrar os demais editores e formulários administrativos em features isoladas, mantendo a sessão/CSRF e a compilação restrita.
4. Executar homologação iPhone/WebKit, full stack, Core Web Vitals e revisão de conteúdo antes de qualquer release pública.

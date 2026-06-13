# Contexto do Trabalho Atual - Customizações do Heroic Games Launcher

Este arquivo serve como memória persistente para o Antigravity (ou qualquer desenvolvedor) sobre o estado atual do desenvolvimento.

## Branch Atual: `heroic_launcher_WIP/2026-06-05`

---

## 🛠️ O que foi feito recentemente (Modificações Locais Ativas)

### 1. **Filtro de Alfabeto (A-Z) Personalizável**
- **Arquivos:**
  - [index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/AlphabetFilter/index.tsx)
  - [index.css](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/AlphabetFilter/index.css)
- **Melhorias:**
  - Adicionado suporte a estilos customizados para os botões das letras: degradê de cores (opcional), borda customizável, raio da borda (border radius), opacidade de fundo, opacidade no hover, e opacidade do botão ativo.
  - Implementado efeitos de escala física (`transform: scale(1.08)`) no hover e transições suaves.
  - Adicionado suporte a `backdrop-filter: blur` para os botões das letras.
  - **Sincronização com o Contador de Jogos:** O badge/balão que exibe a quantidade total de jogos (ex: "27") agora está dinamicamente sincronizado com as configurações de estilo dos botões do alfabeto. Ele herda automaticamente o arredondamento de borda, cor do texto, fundo degradê ou sólido, borda customizada e efeito de desfoque de vidro (backdrop-filter) definidos pelo usuário na tela de personalização. Além disso, foi remodelado para ter dimensões equivalentes às letras (min-width/height de 36px), transformando-se de forma elegante em uma pílula flexível caso o número de dígitos aumente.
  - **Remoção de Estilos Conflitantes:** Removido o seletor fixo da classe `.numberOfgames` com `!important` do arquivo [App.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/App.tsx) para permitir a aplicação direta dos estilos dinâmicos de personalização.

### 2. **Configurações Rápidas do Jogo (Inline Game Settings)**
- **Arquivos:**
  - [index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/InlineGameSettings/index.tsx)
- **Melhorias:**
  - **Filtro de Duplicidade:** Adicionada validação ao carregar as ações do menu para evitar ids duplicados ou inválidos salvos no localStorage (garante que apenas ações válidas sejam exibidas).
  - **Design do Cabeçalho:**
    - Botão de fechar (X) estilizado para ser transparente com transição suave de cor.
    - Abas "Avançado" e "Organizar Seções" redesenhadas para usar elementos `<button>` elegantes em vez de `<div>` com bordas simples.
  - **Alinhamento dos Ícones e Botões (Organizar Seções):**
    - **Olho Indicador (Visibilidade):** Centralizado perfeitamente no centro vertical do botão utilizando `top: 50%` e `transform: translateY(-50%)`, e alinhado com a margem interna (`right: 16px`) para um design limpo e profissional.
    - **Margens e Padding:** Adicionado `paddingRight: '48px'` no `ActionButton` para garantir que o texto das ações nunca sobreponha o ícone do olho.
    - **Ícones da Esquerda:** Definida largura e altura fixa de `24px` e `flex-shrink: 0` no contêiner dos ícones da esquerda para garantir que os textos de todas as ações comecem no mesmo recuo horizontal exato, independentemente da proporção nativa de cada ícone (MUI ou FontAwesome).
    - **Estiramento do Grid:** Aplicado `width: '100%'` no contêiner `draggable` para garantir que todos os cartões ocupem a largura total disponível das colunas do grid igualmente.

### 3. **Tela de Personalização (Personalization Screen)**
- **Arquivos:**
  - [index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Personalization/index.tsx)
- **Melhorias:**
  - Adicionado o painel completo de personalização para os botões do Alfabeto, contendo:
    - Controle de arredondamento de borda (limite de 18px).
    - Alternador de Degradê (com seletor de Cor Inicial e Cor Final).
    - Alternador de Borda.
    - Slider de Opacidade de Fundo das letras.
    - Slider de Opacidade no Hover.
    - Slider de Opacidade Ativa (letra selecionada).
    - Paleta de cores HSV/SVBox mapeada especificamente para as cores do alfabeto.

### 4. **Ajustes de Foco e Contorno (Outline/Focus Rings)**
- **Arquivos:**
  - [index.scss](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/components/UI/SearchBar/index.scss)
  - [themes.scss](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/themes.scss)
  - [Dialog.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/components/UI/Dialog/components/Dialog.tsx)
- **Melhorias:**
  - **Barra de Pesquisa:** Substituído o contorno/sombra branco padrão por uma borda azul ciano com brilho neon (`#00ffff`) elegante quando a barra de pesquisa é focada (`:focus-within`).
  - **Remoção de Outlines:** Desativado o contorno feio de foco padrão do navegador (incluindo o contorno amarelo/branco que aparecia ao clicar no botão "X" de limpar busca).
  - **Botão de Fechar Modal/Changelog:** Aplicado `outline: none !important` e desativada a sombra de foco no botão de fechar (`IconButton`) do componente de Diálogo principal (corrigindo o contorno cinza/amarelo que aparecia ao interagir ou focar no "X" dos modais como o de Changelog/Release Notes).
  - **Reset Global:** Implementado um reset no CSS de temas globais para impedir que contornos de foco padrão do navegador (outline) apareçam em botões, campos de texto, e dropdowns, preservando puramente a estética limpa azul e ciano do tema customizado.

### 5. **Botão de Rolar para o Fundo (Go to Bottom)**
- **Arquivos:**
  - [index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/index.tsx)
  - [index.css](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/index.css)
- **Melhorias:**
  - **Novo Botão:** Adicionado o botão flutuante `goToBottomBtn` com o ícone de seta para baixo (`ArrowDropDown`) posicionado verticalmente abaixo do botão de voltar ao topo (`backToTopBtn`) (o botão de subir fica em cima e o de descer fica embaixo, tornando o layout intuitivo).
  - **Lógica de Scroll:** Implementada a função `goToBottom()` que faz um scroll suave e foca no último card visível da biblioteca ao ser clicado.
  - **Exibição Inteligente:** O botão de rolar para o fundo segue a mesma lógica do botão de voltar ao topo: só aparece se o usuário rolar para baixo mais de 450px (`scrollTop > 450`) e some automaticamente conforme se aproxima do final do conteúdo (menos de 450px do fundo), evitando poluição visual ao estar no topo da biblioteca.
  - **Navegação com Controle (Gamepad):** Totalmente integrado ao sistema de navegação por controle direcional (gamepad), com mapeamento invertido e ajustado para a nova ordem física dos botões (o botão de topo está acima do botão de fundo, facilitando a navegação).

### 6. **Filtro e Design das Etapas do Zoom (Lupa)**
- **Arquivos:**
  - [index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/index.tsx)
- **Melhorias:**
  - **Filtro Seletivo de Zoom:** Removidos apenas os passos `220px`, `260px`, `300px` e `320px` que não causavam impacto visual de colunas/tamanhos (mantendo a proporção `1fr` padrão que preenche a tela inteira).
  - **Etapas Ativas:** A lupa agora navega e cicla apenas entre os valores: `[160, 180, 200, 240, 280, 340, 360]`.
  - **Design Minimalista e Moderno:** Redesenhado completamente o controle flutuante do zoom:
    - Removido o emoji `🔍` e adicionada uma lupa vetorial (SVG) minimalista na cor ciano neon.
    - Tornado o painel totalmente transparente (removido o fundo escuro, o desfoque de vidro e o sombreamento do container) para que as informações flutuem diretamente sobre a tela.
    - Ajustada a altura de ancoragem inferior para `bottom: 3px` para obter um alinhamento estético perfeito na base da tela.
    - Removida a borda/contorno azul (cyan) externa (`border: none`).
    - Substituídos os caracteres de texto `-` e `+` por ícones SVG vetoriais modernos, com áreas circulares de hover suaves e transição dinâmica de cores.
    - Adicionado divisor vertical para separar a lupa dos controles.

---

## 📋 Próximos Passos / O que falta fazer
- [ ] Testar a interface de personalização do alfabeto no Heroic rodando o comando local `pnpm start`.
- [ ] Validar a responsividade e comportamento do novo menu de ações personalizáveis.
- [ ] Confirmar se o salvamento de todas as novas configurações de opacidade/degradê no `localStorage` está refletindo instantaneamente na tela da biblioteca.
- [ ] Realizar commits ou build para produção quando estiver validado.

---

## 🚀 Como rodar o projeto
Para abrir a interface gráfica do Heroic Games Launcher com as alterações:
1. Abra um terminal interativo local no VS Code ou PowerShell.
2. Execute o comando:
   ```bash
   pnpm start
   ```

# Review das Alterações - 12/06/2026

Compilado de todas as modificações de estilo, alinhamento, estrutura e novas funcionalidades aplicadas no Ghost Games Launcher (antigo Heroic) hoje.

---

## 📋 Resumo das Alterações Realizadas

### 1. Rebranding Completo para "Ghost Games Launcher"
* **Problema:** Customização do launcher para se distanciar da marca original "Heroic Games Launcher", redefinindo nome, logos e caminhos de repositório.
* **Solução:**
  - Renomeamos o produto para **Ghost Games Launcher** no arquivo `electron-builder.yml`.
  - Atualizamos a versão para `0.0.1-beta` e o repositório GitHub para `alazter/HeroicGamesLauncher` no `package.json` e arquivos de configuração.
  - Atualizamos as constantes de APIs do GitHub e caminhos de release em `src/backend/constants/urls.ts` e diálogos de atualização automática em `src/backend/updater.ts`.
  - Substituímos os logos e ícones padrão do app nos formatos PNG e SVG em `public/` e `src/frontend/assets/`.

### 2. Customização do Filtro de Alfabeto e Badge Sincronizado
* **Problema:** A visualização do alfabeto e o contador de jogos não herdavam adequadamente as configurações de estilo e cores do painel de personalização.
* **Solução:**
  - Adicionamos suporte a degradê de cores, bordas, raio de borda, opacidade padrão/hover/ativa e efeitos de escala e desfoque nos botões das letras do alfabeto.
  - **Sincronização com o Contador de Jogos:** O badge indicador da quantidade total de jogos agora é estilizado automaticamente com os mesmos atributos e propriedades do alfabeto (vidro/backdrop blur, degradê, bordas e raio), adaptando-se elegantemente em formato pílula.

### 3. Melhorias no Sideload Auto-Scanner e Gerenciamento de Blacklist
* **Problema:** A detecção de jogos duplicados falhava em executáveis renomeados ou subdiretórios variantes. Não era possível visualizar quais jogos estavam na blacklist de varredura.
* **Solução:**
  - Criamos o helper `src/backend/storeManagers/sideload/steamgridHelper.ts` para normalizar títulos de busca (removendo sufixos de edições, anos e repacks) a fim de aumentar a taxa de acerto de capas via SteamGridDB.
  - Implementamos normalização profunda de caminhos (`normalizePathForComparison`) e títulos (`normalizeTitleForComparison` eliminando acentos e caracteres não-alfanuméricos) na detecção de duplicados.
  - O scanner agora atualiza automaticamente capas ausentes para jogos que já existem na biblioteca caso os encontre na busca.
  - Criamos um modal específico para a Blacklist (`blacklist-modal`), permitindo visualizar todos os caminhos bloqueados e remover itens individuais ou limpar toda a blacklist de forma prática.

### 4. Botão de Rolar para o Fundo (Go to Bottom)
* **Problema:** Faltava um controle fácil para navegar até o fim da biblioteca de jogos rapidamente de forma análoga ao botão "Voltar ao topo".
* **Solução:**
  - Adicionamos um botão flutuante para rolar ao fundo (`goToBottomBtn`) posicionado logo abaixo do botão de ir ao topo.
  - O botão aparece condicionalmente quando o scroll passa de 450px e some ao se aproximar do fim do grid de jogos.
  - Totalmente integrado à navegação por Gamepad e controles direcionais.

### 5. Lupa de Zoom da Biblioteca Polida
* **Problema:** O controle de zoom continha etapas desnecessárias que não causavam impacto real de colunas e usava emojis e texto rudimentares (`🔍`, `+`, `-`).
* **Solução:**
  - Limitamos as etapas de zoom aos valores úteis `[160, 180, 200, 240, 280, 340, 360]`.
  - Redesenhamos os botões para usar ícones SVG vetoriais elegantes e fundo transparente flutuante sobre a tela.

### 6. Reset de Outlines de Foco do Navegador
* **Problema:** O contorno de foco padrão do navegador (outline cinza/amarelo) poluía a estética neon do launcher em modais, barras de pesquisa e botões de fechamento (X).
* **Solução:**
  - Substituímos o outline padrão da barra de busca por um contorno cyan/glow neon (`#00ffff`).
  - Adicionamos regras CSS globais em `themes.scss` e `Dialog.tsx` anulando outlines residuais em inputs e botões de fechar.

### 7. Rebranding e Creditação no README.md
* **Problema:** O documento README do repositório ainda continha a marca original "Heroic Games Launcher" e faltava o novo logotipo e atribuição de créditos adequada.
* **Solução:**
  - Inserimos o novo logotipo de fantasma colorido (`logo.png`) no topo do arquivo ao lado do nome do software.
  - Atualizamos as descrições e títulos para **Ghost Games Launcher**.
  - Adicionamos uma seção específica de créditos para atribuir a autoria do projeto base ao **Heroic Games Launcher** e seus desenvolvedores/contribuidores.
  - Atualizamos os badges de download e releases para direcionar ao repositório customizado do usuário.

---

## 🛠️ Arquivos Modificados e Criados

### Configuração e Metadados
- [MODIFY] [electron-builder.yml](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/electron-builder.yml)
- [MODIFY] [package.json](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/package.json)
- [MODIFY] [index.html](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/index.html)
- [MODIFY] [README.md](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/README.md)
- [NEW] [TODO.md](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/TODO.md)
- [NEW] [logo.png](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/public/logo.png)

### Backend
- [NEW] [steamgridHelper.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/storeManagers/sideload/steamgridHelper.ts)
- [MODIFY] [main.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/main.ts)
- [MODIFY] [updater.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/updater.ts)
- [MODIFY] [constants/urls.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/constants/urls.ts)
- [MODIFY] [storeManagers/sideload/scanner.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/storeManagers/sideload/scanner.ts)
- [MODIFY] [storeManagers/sideload/library.ts](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/backend/storeManagers/sideload/library.ts)

### Frontend
- [MODIFY] [App.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/App.tsx)
- [MODIFY] [SideloadDialog/index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/InstallModal/SideloadDialog/index.tsx)
- [MODIFY] [GamesList/index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/GamesList/index.tsx)
- [MODIFY] [InlineGameSettings/index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/InlineGameSettings/index.tsx)
- [MODIFY] [Personalization/index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Personalization/index.tsx)
- [MODIFY] [themes.scss](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/themes.scss)
- [MODIFY] [Dialog.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/components/UI/Dialog/components/Dialog.tsx)
- [MODIFY] [AlphabetFilter/index.tsx](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/AlphabetFilter/index.tsx)
- [MODIFY] [AlphabetFilter/index.css](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/screens/Library/components/AlphabetFilter/index.css)
- [MODIFY] [SearchBar/index.scss](file:///c:/Users/alazt/Documents/GitHub/Projetos/HeroicGamesLauncher/src/frontend/components/UI/SearchBar/index.scss)

# Salas compartilhadas de Crisol RPG

## Objetivo

Adicionar uma experiência multiplayer leve: o Mestre cria uma sala com código; Jogadores entram com esse código, criam suas fichas e o Mestre acompanha a lista de participantes e as fichas atualizadas.

## Implementação

- Transformar o site estático em um servidor Node.js com API HTTP e frontend estático.
- Habilitar Server + Database gerenciados no projeto.
- Criar tabelas `rooms` e `room_players` com schema versionado e inicialização idempotente.
- Usar códigos curtos de sala e tokens aleatórios de sessão salvos no navegador; não haverá login nesta primeira entrega.
- Expor endpoints para criar sala, entrar, consultar sala, salvar ficha e atualizar presença.
- Sincronizar por polling leve no frontend para funcionar em publicação sem WebSocket obrigatório.
- Manter a ficha atual em JSON no banco, preservando os recursos existentes: classe, atributos, XP, status, inventário, magias, lesões e cooldown da Ult.

## Fluxo do usuário

1. O Mestre escolhe “Mestre” e cria uma sala; recebe código e painel de participantes.
2. O Jogador escolhe “Jogador”, informa nome + código da sala e entra.
3. Ao entrar, o Jogador acessa a criação de classe/ficha já vinculada à sala.
4. A ficha é salva automaticamente na sala quando gerada e após alterações importantes.
5. O Mestre vê nomes, classes, levels, Vida, XP, lesões e uma ficha detalhada de cada jogador, atualizada automaticamente.

## Design

**Movimento:** dark fantasy editorial com linguagem de painel de mesa, 0.06 de probabilidade.

**Princípios:** código de sala sempre visível; estados de conexão claros; leitura rápida para o Mestre; nenhuma tela genérica de login.

**Paleta:** carvão e verde-musgo para a base compartilhada, dourado para ações de criação e ferrugem para lesões/alertas.

**Layout:** a entrada de sala ocupa o centro da landing; o painel do Mestre usa uma barra de sala e cartões verticais de jogadores, evitando esconder participantes em menus.

**Interações:** feedback imediato em criação/entrada, atualização automática discreta e mensagens de erro acionáveis.

**Tipografia:** Cinzel para nomes e títulos; Manrope para textos de leitura; DM Mono para códigos e métricas.

**Voz:** direta, ritualística e útil. Exemplos: “A mesa está aberta.” e “Entre pelo código que o Mestre entregou.”

## Estrutura

- `server.js`: servidor HTTP, API de salas e serving dos arquivos estáticos.
- `db.js`: conexão MySQL e inicialização idempotente do schema.
- `schema.sql`: tabelas e índices da sala.
- `index.html`: telas de entrada e painéis Mestre/Jogador.
- `app.js`: estado do frontend, API client, sincronização e ficha.
- `styles.css`: componentes visuais dos fluxos de sala.
- `package.json`: scripts de desenvolvimento e produção.

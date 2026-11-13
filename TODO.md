# Entregas

- [x] **Tela inicial de escolha de papel**
  - O site começa com uma página inicial para escolher entre jogar como Jogador ou como Mestre.
  - O modo Jogador abre a criação de personagem.
  - O modo Mestre abre um painel de consulta das origens disponíveis e pode voltar à tela inicial.

- [x] **Seleção de classe e consulta da classe**
  - O jogador pode escolher entre Orc, Mago, Profeta, Soldado e Bandido.
  - A tela mostra vida, status, itens iniciais, armaduras, ataques, magias e habilidade ativa conforme o documento do RPG.
  - A interface inclui um espaço reservado para a futura imagem da raça de cada classe.
  - Os textos pequenos e danos das armas foram ampliados para melhorar a leitura.

- [x] **Status e atributos com leitura visual**
  - Os status de cada classe aparecem com valores e barras visuais.
  - Força, Agilidade, Percepção, Foco, Furtividade e Iniciativa começam em 1.
  - O jogador distribui exatamente 3 pontos adicionais entre os seis atributos.
  - Um gráfico SVG com seis pontas mostra visualmente a distribuição dos atributos e atualiza junto dos controles.
  - Cada ponto indica quantos dados serão lançados nos testes.

- [x] **Progressão da ficha**
  - Todo personagem começa no level 1 com 0 XP.
  - O botão Adicionar XP permite registrar a experiência recebida durante a campanha.
  - O custo para subir segue 100 XP do level 1 para 2, 150 XP do 2 para 3 e aumenta 50 XP por level.
  - Ao alcançar o custo, o site exige a escolha de um status para receber +1 antes de confirmar o novo level.
  - A escolha de evolução é feita apenas entre os status de classe, nunca entre os atributos de teste.
  - A Vida é sempre calculada como Vitalidade × 2 e acompanha os aumentos de Vitalidade.

- [x] **Herança e inventário**
  - A Herança da ficha contém somente a habilidade ativa da classe.
  - Armas, escudos, magias e armadura aparecem em um Inventário separado.
  - O jogador pode alterar a quantidade de dados de armas e escudos entre 1 e 5.
  - O jogador pode alterar separadamente o tipo de dado entre D4, D6, D8, D10 e D12.
  - O cajado do Mago e o selo sagrado do Profeta permitem alterar o limite máximo de magias ou feitiços.
  - Mago e Profeta podem cadastrar novos poderes com nome e dados de dano.
  - A armadura permite alterar separadamente o valor da redução e o tipo de dano reduzido.
  - O Mago possui uma seção própria chamada Magias.
  - O Profeta possui uma seção própria chamada Feitiços.
  - O sistema bloqueia o cadastro quando a capacidade máxima de magias ou feitiços foi atingida.
  - A capacidade alterada do cajado ou selo é aplicada imediatamente ao limite.

- [x] **Lesões de combate**
  - A ficha possui uma seção Lesões com registro de olho, perna ou braço.
  - Cada lesão pode ser Leve, Grave ou Permanente.
  - Lesão no olho aplica -4 nos testes de Foco e Percepção.
  - Lesão na perna aplica -4 nos testes de Iniciativa e Agilidade.
  - Lesão no braço aplica -4 no teste de Força e no dano da arma.
  - Lesão leve mostra Cura suave; lesão grave mostra que precisa achar alguém específico; lesão permanente mostra que não tem cura.
  - Lesões leves e graves podem ser marcadas como curadas; permanentes permanecem sem opção de remoção.

- [x] **Ficha final pronta para consulta**
  - O jogador informa nome e idade.
  - A ficha combina dados pessoais, classe, atributos, status, level, XP e conteúdo predefinido da classe.
  - O jogador pode voltar e ajustar a criação antes de gerar novamente.

- [x] **Atmosfera visual responsiva**
  - A interface usa uma estética sombria de fantasia, com cores escuras inspiradas em Elden Ring.
  - O layout funciona em telas grandes e pequenas usando HTML, CSS e JavaScript.

- [x] **Habilidade Ultimate com cooldown**
  - A ficha possui um botão Usar Ult.
  - Depois do uso, o botão fica bloqueado por 30 minutos.
  - Um contador regressivo mostra o tempo restante até a habilidade ficar pronta novamente.
  - O cooldown continua correto mesmo se a página for recarregada no mesmo navegador.

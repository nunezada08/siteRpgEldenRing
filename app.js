const classes = [
  {
    id: 'orc', name: 'Orc', index: '01', kicker: 'A força que não se curva', description: 'Uma presença brutal no campo de batalha, capaz de transformar fúria em força devastadora.', life: 60,
    stats: { Fé: 0, Inteligência: 0, Fortitude: 20, Resistência: 0, 'Dano furtivo': 0, Vitalidade: 30 },
    equipment: [{ name: 'Porrete de madeira', detail: '2D8', type: 'Arma 1' }, { name: 'Porrete de madeira', detail: '2D8', type: 'Arma 2' }],
    armor: '-2 ataque físico', ability: { title: 'Fúria', cooldown: '1 × a cada 5 batalhas', description: 'O usuário joga o dobro de dados que jogaria normalmente com a arma para dano em um turno.' }, spells: []
  },
  {
    id: 'mago', name: 'Mago', index: '02', kicker: 'O conhecimento é uma lâmina', description: 'Um estudioso das forças ocultas que troca resistência por um domínio absoluto da magia.', life: 40,
    stats: { Fé: 0, Inteligência: 30, Fortitude: 0, Resistência: 0, 'Dano furtivo': 0, Vitalidade: 20 },
    equipment: [{ name: 'Cajado mágico simples', detail: 'máx. 2 magias', type: 'Arma 1' }, { name: 'Espada curta', detail: '2D4', type: 'Arma 2' }],
    armor: '-4 ataques mágicos', ability: { title: 'Poder total', cooldown: '1 × a cada 5 batalhas', description: 'Utiliza todo seu poder para um ataque mágico supremo. Jogue todos os dados de dano de suas magias disponíveis e some-os.' }, spells: [{ name: 'Pedrilhante', detail: '2D8 dano' }]
  },
  {
    id: 'profeta', name: 'Profeta', index: '03', kicker: 'A fé acende o impossível', description: 'Um canal vivo entre o sagrado e o campo de batalha, capaz de ferir e restaurar com a mesma prece.', life: 30,
    stats: { Fé: 25, Inteligência: 0, Fortitude: 0, Resistência: 5, 'Dano furtivo': 0, Vitalidade: 15 },
    equipment: [{ name: 'Selo sagrado simples', detail: 'máx. 2 feitiços', type: 'Arma 1' }, { name: 'Escudo de madeira simples', detail: '1D4 defesa', type: 'Arma 2' }],
    armor: '-4 ataques de feitiçaria', ability: { title: 'Cura da fé', cooldown: '1 × a cada 7 batalhas', description: 'Utiliza toda sua sabedoria para curar aliados mortos em batalha. Só pode ser usado durante batalhas e não pode ser feito em si próprio.' }, spells: [{ name: 'Bola de fogo pequena', detail: '1D8 dano' }, { name: 'Cura básica', detail: '1D6 cura' }]
  },
  {
    id: 'soldado', name: 'Soldado', index: '04', kicker: 'Disciplina vence o medo', description: 'Treinado para permanecer de pé quando tudo ao redor desaba, com uma resposta para cada ameaça.', life: 60,
    stats: { Fé: 0, Inteligência: 0, Fortitude: 10, Resistência: 10, 'Dano furtivo': 0, Vitalidade: 30 },
    equipment: [{ name: 'Espada de ferro', detail: '2D6', type: 'Arma 1' }, { name: 'Escudo de ferro', detail: '1D6 defesa', type: 'Arma 2' }],
    armor: '-4 ataques físicos', ability: { title: 'Foco máximo', cooldown: '1 × a cada 4 batalhas', description: 'Escolha uma de suas armas para dar um crítico garantido junto com uma lesão no mínimo grave.' }, spells: []
  },
  {
    id: 'bandido', name: 'Bandido', index: '05', kicker: 'A sombra chega primeiro', description: 'Uma ameaça que não anuncia sua chegada. O golpe perfeito nasce do silêncio e desaparece com ele.', life: 36,
    stats: { Fé: 0, Inteligência: 0, Fortitude: 15, Resistência: '—', 'Dano furtivo': 27, Vitalidade: 18 },
    equipment: [{ name: 'Adaga de ferro', detail: '2D4', type: 'Arma 1' }, { name: 'Adaga de ferro', detail: '2D4', type: 'Arma 2' }],
    armor: '-2 ataques mágicos e -2 ataques de feitiçaria', ability: { title: 'Invisibilidade', cooldown: '1 × a cada 5 batalhas', description: 'Concentra-se em todas as suas técnicas de furtividade e fica completamente invisível. Em batalha, fica invisível por 2 turnos. Também pode ser utilizada fora de batalhas.' }, spells: []
  }
];

const attributes = ['Força', 'Agilidade', 'Percepção', 'Foco', 'Furtividade', 'Iniciativa'];
const state = { selectedClass: classes[0], allocation: Object.fromEntries(attributes.map((attribute) => [attribute, 1])) };
let playerCharacter = null;

const $ = (selector) => document.querySelector(selector);
const classList = $('#class-list');
const attributeList = $('#attribute-list');
const form = $('#character-form');
const formError = $('#form-error');
const landingView = $('#landing-view');
const playerModeButton = $('#player-mode-button');
const masterModeButton = $('#master-mode-button');
const masterView = $('#master-view');

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

function renderClassList() {
  classList.innerHTML = classes.map((characterClass) => `
    <button class="class-option ${characterClass.id === state.selectedClass.id ? 'active' : ''}" data-class="${characterClass.id}" type="button" aria-pressed="${characterClass.id === state.selectedClass.id}">
      <span class="option-number">${characterClass.index}</span>
      <span><strong>${characterClass.name}</strong><small>${characterClass.kicker}</small></span>
    </button>`).join('');

  classList.querySelectorAll('.class-option').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedClass = classes.find((characterClass) => characterClass.id === button.dataset.class);
      renderClassList();
      renderClassDetails();
      clearError();
    });
  });
}

function renderClassDetails() {
  const characterClass = state.selectedClass;
  const classLife = characterClass.stats.Vitalidade * 2;
  $('#class-name').textContent = characterClass.name;
  $('#class-index').textContent = characterClass.index;
  $('#class-kicker').textContent = characterClass.kicker;
  $('#class-description').textContent = characterClass.description;
  $('#class-life').textContent = classLife;
  $('#class-life-bar').style.width = `${Math.max(22, Math.min(100, (classLife / 60) * 100))}%`;
  $('#class-armor').textContent = characterClass.armor;
  $('#ability-title').textContent = characterClass.ability.title;
  $('#ability-cooldown').textContent = characterClass.ability.cooldown;
  $('#ability-description').textContent = characterClass.ability.description;
  $('#class-portrait').innerHTML = `<span class="portrait-rune">${characterClass.name === 'Bandido' ? '◇' : characterClass.name === 'Profeta' ? '☼' : characterClass.name === 'Mago' ? '✧' : characterClass.name === 'Soldado' ? '⚔' : '✦'}</span><small>Imagem da<br />raça em breve</small>`;
  $('#class-portrait').setAttribute('aria-label', `Espaço reservado para a imagem da raça ${characterClass.name}`);
  $('#class-stats').innerHTML = Object.entries(characterClass.stats).map(([label, value]) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const meter = numericValue === 0 ? 0 : Math.max(12, Math.min(100, (numericValue / 30) * 100));
    return `<div class="stat-row"><span>${label}</span><div class="stat-meter"><i style="width:${meter}%"></i></div><strong>${value}</strong></div>`;
  }).join('');
  $('#class-equipment').innerHTML = characterClass.equipment.map((item) => `<div class="equipment-item"><strong>${item.name}</strong><small>${item.detail}</small></div>`).join('');
  $('#spell-list').innerHTML = characterClass.spells.length ? characterClass.spells.map((spell) => `<span class="spell-pill">${spell.name} <b>· ${spell.detail}</b></span>`).join('') : '';
}

function remainingPoints() {
  return 3 - attributes.reduce((sum, attribute) => sum + (state.allocation[attribute] - 1), 0);
}

function renderAttributeWheel() {
  const size = 280;
  const center = size / 2;
  const radius = 92;
  const angles = attributes.map((_, index) => (-90 + (index * 60)) * (Math.PI / 180));
  const point = (distance, angle) => `${(center + Math.cos(angle) * distance).toFixed(2)},${(center + Math.sin(angle) * distance).toFixed(2)}`;
  const grid = [1, 2, 3].map((level) => `<polygon points="${angles.map((angle) => point(radius * (level / 3), angle)).join(' ')}" />`).join('');
  const axes = angles.map((angle) => `<line x1="${center}" y1="${center}" x2="${(center + Math.cos(angle) * radius).toFixed(2)}" y2="${(center + Math.sin(angle) * radius).toFixed(2)}" />`).join('');
  const values = angles.map((angle, index) => point(radius * Math.min(1, state.allocation[attributes[index]] / 4), angle)).join(' ');
  const labels = angles.map((angle, index) => {
    const labelPoint = point(radius + 25, angle);
    return `<text x="${labelPoint.split(',')[0]}" y="${labelPoint.split(',')[1]}" text-anchor="middle">${attributes[index]}</text>`;
  }).join('');
  const dots = angles.map((angle, index) => {
    const [x, y] = point(radius * Math.min(1, state.allocation[attributes[index]] / 4), angle).split(',');
    return `<circle cx="${x}" cy="${y}" r="3.5" />`;
  }).join('');
  $('#attribute-wheel').innerHTML = `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Atributos: ${attributes.map((attribute) => `${attribute} ${state.allocation[attribute]}`).join(', ')}"><g class="wheel-grid">${grid}</g><g class="wheel-axes">${axes}</g><polygon class="wheel-values" points="${values}" /> <g class="wheel-dots">${dots}</g><g class="wheel-labels">${labels}</g></svg><span class="wheel-center">${attributes.reduce((sum, attribute) => sum + state.allocation[attribute], 0)}<small>essência</small></span>`;
}

function renderAttributes() {
  const pointsLeft = remainingPoints();
  $('#points-counter').innerHTML = `<strong>${pointsLeft}</strong><span>de 3<br />pontos</span>`;
  renderAttributeWheel();
  attributeList.innerHTML = attributes.map((attribute) => {
    const value = state.allocation[attribute];
    const atBase = value === 1;
    const noPoints = pointsLeft === 0;
    return `<div class="attribute-row"><span class="attribute-name">${attribute}</span><span class="attribute-controls"><button class="attr-button" type="button" data-action="decrease" data-attribute="${attribute}" aria-label="Diminuir ${attribute}" ${atBase ? 'disabled' : ''}>−</button><strong class="attribute-value">${value}</strong><button class="attr-button" type="button" data-action="increase" data-attribute="${attribute}" aria-label="Aumentar ${attribute}" ${noPoints ? 'disabled' : ''}>+</button></span></div>`;
  }).join('');

  attributeList.querySelectorAll('.attr-button').forEach((button) => {
    button.addEventListener('click', () => {
      const attribute = button.dataset.attribute;
      const direction = button.dataset.action === 'increase' ? 1 : -1;
      if (direction === 1 && remainingPoints() === 0) return;
      if (direction === -1 && state.allocation[attribute] === 1) return;
      state.allocation[attribute] += direction;
      renderAttributes();
      clearError();
    });
  });
}

function clearError() { formError.textContent = ''; }
function showError(message) { formError.textContent = message; }

function xpToNextLevel(level) {
  return 100 + ((level - 1) * 50);
}

function renderStatusGrid() {
  const status = playerCharacter.status;
  $('#sheet-status').innerHTML = Object.entries(status).map(([label, value]) => {
    const meter = Math.max(0, Math.min(100, (value / 35) * 100));
    return `<div class="sheet-status-row"><div><span>${label}</span><strong>${value}</strong></div><i><b style="width:${meter}%"></b></i></div>`;
  }).join('');
}

function renderProgression() {
  const level = playerCharacter.level;
  const needed = xpToNextLevel(level);
  const percentage = Math.max(0, Math.min(100, (playerCharacter.xp / needed) * 100));
  $('#sheet-level').textContent = level;
  $('#sheet-xp').textContent = playerCharacter.xp;
  $('#sheet-xp-needed').textContent = needed;
  $('#sheet-xp-bar').style.width = `${percentage}%`;
  $('#sheet-xp-caption').textContent = `${needed - playerCharacter.xp} XP para o próximo level`;
}

function renderLevelUpOptions() {
  $('#status-upgrade-options').innerHTML = Object.entries(playerCharacter.status).map(([label, value]) => `<button class="status-upgrade-option" type="button" data-status="${label}"><span class="upgrade-symbol">＋</span><span><strong>${label}</strong><small>${value} → ${value + 1}</small></span><b>Escolher</b></button>`).join('');
  $('#status-upgrade-options').querySelectorAll('.status-upgrade-option').forEach((button) => {
    button.addEventListener('click', () => {
      const statusName = button.dataset.status;
      playerCharacter.status[statusName] += 1;
      playerCharacter.level += 1;
      playerCharacter.pendingLevelUps -= 1;
      renderSheet(playerCharacter.name, playerCharacter.age);
      if (playerCharacter.pendingLevelUps > 0) {
        openLevelUpModal();
      } else {
        $('#level-up-modal').hidden = true;
      }
    });
  });
}

function openLevelUpModal() {
  renderLevelUpOptions();
  $('#level-up-modal').hidden = false;
}

function registerExperience(amount) {
  playerCharacter.xp += amount;
  while (true) {
    const pendingLevel = playerCharacter.level + playerCharacter.pendingLevelUps;
    const required = xpToNextLevel(pendingLevel);
    if (playerCharacter.xp < required) break;
    playerCharacter.xp -= required;
    playerCharacter.pendingLevelUps += 1;
  }
  $('#xp-modal').hidden = true;
  renderSheet(playerCharacter.name, playerCharacter.age);
  if (playerCharacter.pendingLevelUps > 0) openLevelUpModal();
}

function parseDice(detail) {
  const match = String(detail).match(/([1-5])D(4|6|8|10|12)/i);
  return match ? { count: Number(match[1]), type: `D${match[2]}` } : null;
}

function renderInventory() {
  const diceTypes = ['D4', 'D6', 'D8', 'D10', 'D12'];
  $('#sheet-inventory').innerHTML = playerCharacter.inventory.map((item, index) => {
    const dice = item.dice;
    const currentDetail = dice ? `${dice.count}${dice.type}` : item.detail;
    const editor = dice ? `<div class="damage-editor"><label>Dados</label><select class="dice-count" data-inventory-index="${index}" aria-label="Quantidade de dados de ${item.name}">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${dice.count === value ? 'selected' : ''}>${value}</option>`).join('')}</select><span>×</span><select class="dice-type" data-inventory-index="${index}" aria-label="Tipo de dado de ${item.name}">${diceTypes.map((type) => `<option value="${type}" ${dice.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>` : '<span class="inventory-static">Não editável</span>';
    return `<div class="inventory-item"><div class="inventory-item-icon">${item.type === 'Armadura' ? '◈' : item.type === 'Magia' ? '✧' : '◇'}</div><div class="inventory-item-copy"><span class="inventory-kind">${item.type}</span><strong>${item.name}</strong><small>${currentDetail}</small></div>${editor}</div>`;
  }).join('');
  $('#sheet-inventory').querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', () => {
      const item = playerCharacter.inventory[Number(select.dataset.inventoryIndex)];
      if (select.classList.contains('dice-count')) item.dice.count = Number(select.value);
      if (select.classList.contains('dice-type')) item.dice.type = select.value;
      renderInventory();
    });
  });
}

function renderSheet(characterName, age) {
  const characterClass = state.selectedClass;
  const currentLife = playerCharacter.status.Vitalidade * 2;
  $('#sheet-name').textContent = characterName;
  $('#sheet-subtitle').textContent = `${characterClass.name} · ${age} anos`;
  $('#sheet-life').textContent = currentLife;
  $('#sheet-class').textContent = characterClass.name;
  $('#sheet-age').textContent = age;
  renderProgression();
  renderStatusGrid();
  renderInventory();
  $('#sheet-attributes').innerHTML = attributes.map((attribute) => `<div class="sheet-attribute"><span>${attribute}</span><strong>${state.allocation[attribute]}</strong><small>${state.allocation[attribute]} dado${state.allocation[attribute] === 1 ? '' : 's'} por teste</small></div>`).join('');
  $('#sheet-class-content').innerHTML = `<div class="sheet-section"><h4>Habilidade ativa · ${characterClass.ability.cooldown}</h4><p><strong>${characterClass.ability.title}.</strong> ${characterClass.ability.description}</p></div>`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#character-name').value.trim();
  const age = Number($('#character-age').value);
  if (!name) { showError('Dê um nome ao personagem antes de gerar a ficha.'); $('#character-name').focus(); return; }
  if (!age || age < 1) { showError('Informe uma idade válida para continuar.'); $('#character-age').focus(); return; }
  if (remainingPoints() !== 0) { showError(`Distribua os ${remainingPoints()} ponto${remainingPoints() === 1 ? '' : 's'} restante${remainingPoints() === 1 ? '' : 's'} antes de gerar.`); return; }
  playerCharacter = {
    name,
    age,
    level: 1,
    xp: 0,
    pendingLevelUps: 0,
    status: Object.fromEntries(Object.entries(state.selectedClass.stats).map(([label, value]) => [label, typeof value === 'number' ? value : 0])),
    inventory: [...state.selectedClass.equipment.map((item) => ({ ...item, dice: parseDice(item.detail) })), ...state.selectedClass.spells.map((spell) => ({ type: 'Magia', name: spell.name, detail: spell.detail, dice: null })), { type: 'Armadura', name: 'Armadura da classe', detail: state.selectedClass.armor, dice: null }]
  };
  renderSheet(name, age);
  $('.app-layout').hidden = true;
  $('.site-footer').hidden = true;
  $('#sheet-view').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#back-button').addEventListener('click', () => {
  $('#sheet-view').hidden = true;
  $('.app-layout').hidden = false;
  $('.site-footer').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#add-xp-button').addEventListener('click', () => {
  if (playerCharacter.pendingLevelUps > 0) return openLevelUpModal();
  $('#xp-error').textContent = '';
  $('#xp-amount').value = '';
  $('#xp-modal').hidden = false;
  $('#xp-amount').focus();
});

$('#xp-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = Number($('#xp-amount').value);
  if (!Number.isInteger(amount) || amount < 1) {
    $('#xp-error').textContent = 'Informe uma quantidade inteira de XP maior que zero.';
    return;
  }
  registerExperience(amount);
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', () => { $(`#${button.dataset.closeModal}`).hidden = true; });
});

function renderMasterGrid() {
  $('#master-class-grid').innerHTML = classes.map((characterClass) => `<article class="master-class-card"><div class="master-class-symbol">${characterClass.name === 'Bandido' ? '◇' : characterClass.name === 'Profeta' ? '☼' : characterClass.name === 'Mago' ? '✧' : characterClass.name === 'Soldado' ? '⚔' : '✦'}</div><div><span class="mini-label">${characterClass.index} · origem</span><h3>${characterClass.name}</h3><p>${characterClass.description}</p><div class="master-class-meta"><span>Vida <b>${characterClass.stats.Vitalidade * 2}</b></span><span>${characterClass.ability.title}</span></div></div></article>`).join('');
}

function showMode(mode) {
  landingView.hidden = true;
  $('.site-footer').hidden = true;
  if (mode === 'master') {
    masterView.hidden = false;
    renderMasterGrid();
  } else {
    $('.app-layout').hidden = false;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

playerModeButton.addEventListener('click', () => showMode('player'));
masterModeButton.addEventListener('click', () => showMode('master'));
$('#master-back-button').addEventListener('click', () => {
  masterView.hidden = true;
  landingView.hidden = false;
  $('.site-footer').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  $('.app-layout').hidden = true;
  masterView.hidden = true;
  $('#sheet-view').hidden = true;
  landingView.hidden = false;
  $('.site-footer').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderClassList();
renderClassDetails();
renderAttributes();

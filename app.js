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
let ultTimer = null;
const ULT_COOLDOWN_MS = 30 * 60 * 1000;
const injuryCatalog = {
  eye: { label: 'Lesão no olho', effect: '-4 nos testes de Foco e Percepção' },
  leg: { label: 'Lesão na perna', effect: '-4 nos testes de Iniciativa e Agilidade' },
  arm: { label: 'Lesão no braço', effect: '-4 no teste de Força e no dano da arma' }
};
const severityCatalog = {
  light: { label: 'Leve', cure: 'Cura suave', className: 'light' },
  grave: { label: 'Grave', cure: 'Precisa achar alguém específico', className: 'grave' },
  permanent: { label: 'Permanente', cure: 'Não tem cura', className: 'permanent' }
};

function ultStorageKey() {
  return `crisol-ult-${playerCharacter.classId}-${playerCharacter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function readUltTimestamp() {
  try { return Number(localStorage.getItem(ultStorageKey())) || 0; } catch { return 0; }
}

function renderUltButton() {
  const button = $('#use-ult-button');
  const cooldown = $('#ult-cooldown');
  const remaining = Math.max(0, (playerCharacter.ultUsedAt + ULT_COOLDOWN_MS) - Date.now());
  button.disabled = remaining > 0;
  if (remaining > 0) {
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    cooldown.textContent = `${minutes}:${seconds}`;
    if (!ultTimer) ultTimer = setInterval(renderUltButton, 1000);
  } else {
    cooldown.textContent = 'Pronta';
    if (ultTimer) { clearInterval(ultTimer); ultTimer = null; }
  }
}

function startUltCooldown() {
  playerCharacter.ultUsedAt = Date.now();
  try { localStorage.setItem(ultStorageKey(), String(playerCharacter.ultUsedAt)); } catch { /* armazenamento opcional */ }
  renderUltButton();
  scheduleSheetSync();
  if (ultTimer) clearInterval(ultTimer);
  ultTimer = setInterval(renderUltButton, 1000);
}

const $ = (selector) => document.querySelector(selector);
const classList = $('#class-list');
const attributeList = $('#attribute-list');
const form = $('#character-form');
const formError = $('#form-error');
const landingView = $('#landing-view');
const playerModeButton = $('#player-mode-button');
const masterModeButton = $('#master-mode-button');
const masterView = $('#master-view');
const playerEntryView = $('#player-entry-view');
const masterEntryView = $('#master-entry-view');
const roomSession = { role: null, code: '', token: '', playerId: null };
let roomPollTimer = null;
let sheetSyncTimer = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

async function roomApi(path, options = {}) {
  const response = await fetch(path, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível conectar à sala.');
  return payload;
}

function setRoomSession(payload) {
  roomSession.role = payload.role;
  roomSession.code = payload.code;
  roomSession.token = payload.token;
  roomSession.playerId = payload.playerId || null;
  document.querySelectorAll('.session-code').forEach((node) => { node.textContent = `Sala ${payload.code}`; });
}

function stopRoomPolling() {
  if (roomPollTimer) { clearInterval(roomPollTimer); roomPollTimer = null; }
}

function scheduleSheetSync() {
  if (roomSession.role !== 'player' || !playerCharacter) return;
  clearTimeout(sheetSyncTimer);
  sheetSyncTimer = setTimeout(syncCurrentSheet, 350);
}

async function syncCurrentSheet() {
  if (roomSession.role !== 'player' || !playerCharacter) return;
  try {
    await roomApi(`/api/rooms/${roomSession.code}/players/${roomSession.token}?token=${roomSession.token}`, { method: 'PUT', body: { name: playerCharacter.name, sheet: playerCharacter } });
  } catch (error) {
    console.warn('Falha ao sincronizar a ficha', error);
  }
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
  $('#add-xp-button').hidden = roomSession.role !== 'master';
}

function renderLevelUpOptions() {
  // Players cannot modify status - only masters can
  if (roomSession.role !== 'master') {
    $('#status-upgrade-options').innerHTML = '';
    return;
  }
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
  // Players cannot open the level-up modal
  if (roomSession.role !== 'master') return;
  renderLevelUpOptions();
  $('#level-up-modal').hidden = false;
}

function registerExperience(amount) {
  applyExperienceToSheet(playerCharacter, amount);
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

function parseSpellSlots(detail) {
  const match = String(detail).match(/máx\.\s*(\d+)\s*(magias|feitiços)/i);
  return match ? { count: Number(match[1]), label: match[2] } : null;
}

function parseArmor(detail) {
  const match = String(detail).match(/-(\d+)\s+(.+)/i);
  if (!match) return { reduction: 0, type: 'ataques físicos' };
  const rawType = match[2].toLowerCase();
  const type = rawType.includes('ataques mágicos') && rawType.includes('feitiçaria') ? 'ataques mágicos e de feitiçaria' : rawType.includes('físic') ? 'ataques físicos' : rawType.includes('mágic') ? 'ataques mágicos' : rawType.includes('feitiçaria') ? 'ataques de feitiçaria' : match[2];
  return { reduction: Number(match[1]), type };
}

function getSpellCapacity() {
  return playerCharacter.inventory.find((item) => item.spellSlots)?.spellSlots.count || 0;
}

function renderInventoryItem(item, index, diceTypes, spellSlotOptions, armorTypes) {
  const dice = item.dice;
  const currentDetail = item.armor ? `-${item.armor.reduction} ${item.armor.type}` : item.spellSlots ? `máx. ${item.spellSlots.count} ${item.spellSlots.label}` : dice ? `${dice.count}${dice.type}` : item.detail;
  const editor = dice ? `<div class="damage-editor"><label>Dados</label><select class="dice-count" data-inventory-index="${index}" aria-label="Quantidade de dados de ${item.name}">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${dice.count === value ? 'selected' : ''}>${value}</option>`).join('')}</select><span>×</span><select class="dice-type" data-inventory-index="${index}" aria-label="Tipo de dado de ${item.name}">${diceTypes.map((type) => `<option value="${type}" ${dice.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>` : item.spellSlots ? `<div class="damage-editor"><label>Limite</label><select class="spell-slots" data-inventory-index="${index}" aria-label="Quantidade máxima de ${item.name}">${spellSlotOptions.map((value) => `<option value="${value}" ${item.spellSlots.count === value ? 'selected' : ''}>${value}</option>`).join('')}</select><span>${item.spellSlots.label}</span></div>` : item.armor ? `<div class="damage-editor armor-editor"><label>Redução</label><select class="armor-reduction" data-inventory-index="${index}" aria-label="Redução da armadura">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => `<option value="${value}" ${item.armor.reduction === value ? 'selected' : ''}>-${value}</option>`).join('')}</select><select class="armor-type" data-inventory-index="${index}" aria-label="Tipo de dano reduzido">${armorTypes.map((type) => `<option value="${type}" ${item.armor.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>` : '<span class="inventory-static">Não editável</span>';
  return `<div class="inventory-item"><div class="inventory-item-icon">${item.type === 'Armadura' ? '◈' : item.type === 'Magia' ? '✧' : '◇'}</div><div class="inventory-item-copy"><span class="inventory-kind">${item.type}</span><strong>${item.name}</strong><small>${currentDetail}</small></div>${editor}</div>`;
}

function renderInventory() {
  const diceTypes = ['D4', 'D6', 'D8', 'D10', 'D12'];
  const spellSlotOptions = [1, 2, 3, 4, 5];
  const armorTypes = ['ataques físicos', 'ataques mágicos', 'ataques de feitiçaria', 'ataques mágicos e de feitiçaria'];
  const equipment = playerCharacter.inventory.map((item, index) => ({ item, index })).filter(({ item }) => item.type !== 'Magia');
  const spells = playerCharacter.inventory.map((item, index) => ({ item, index })).filter(({ item }) => item.type === 'Magia');
  const isArcaneClass = ['mago', 'profeta'].includes(playerCharacter.classId);
  const spellCapacity = getSpellCapacity();
  const spellLimitReached = spells.length >= spellCapacity;
  $('#magic-panel').hidden = !isArcaneClass;
  $('#magic-title').textContent = playerCharacter.classId === 'profeta' ? 'Feitiços' : 'Magias';
  $('#magic-hint').textContent = `${spells.length} / ${spellCapacity} espaços usados`;
  $('#add-spell-button').textContent = spellLimitReached ? 'Limite atingido' : (playerCharacter.classId === 'profeta' ? '+ Adicionar feitiço' : '+ Adicionar magia');
  $('#add-spell-button').disabled = spellLimitReached;
  $('#add-spell-button').hidden = roomSession.role !== 'master';
  $('#sheet-inventory').innerHTML = equipment.map(({ item, index }) => renderInventoryItem(item, index, diceTypes, spellSlotOptions, armorTypes)).join('');
  $('#sheet-spells').innerHTML = spells.map(({ item, index }) => renderInventoryItem(item, index, diceTypes, spellSlotOptions, armorTypes)).join('');
  document.querySelectorAll('#sheet-inventory select, #sheet-spells select').forEach((select) => {
    select.disabled = roomSession.role !== 'master';
    select.addEventListener('change', () => {
      const item = playerCharacter.inventory[Number(select.dataset.inventoryIndex)];
      if (select.classList.contains('dice-count')) item.dice.count = Number(select.value);
      if (select.classList.contains('dice-type')) item.dice.type = select.value;
      if (select.classList.contains('spell-slots')) item.spellSlots.count = Number(select.value);
      if (select.classList.contains('armor-reduction')) item.armor.reduction = Number(select.value);
      if (select.classList.contains('armor-type')) item.armor.type = select.value;
      renderInventory();
    });
  });
  scheduleSheetSync();
}

function renderInjuryPreview() {
  const body = injuryCatalog[$('#injury-body').value];
  const severity = severityCatalog[$('#injury-severity').value];
  $('#injury-preview').innerHTML = `<strong>${body.label}</strong><span>${body.effect}</span><small>${severity.label} · ${severity.cure}</small>`;
}

function renderInjuries() {
  const injuries = playerCharacter.injuries;
  const canEdit = roomSession.role === 'master';
  $('#injury-hint').textContent = injuries.length ? `${injuries.length} lesão${injuries.length === 1 ? '' : 'ões'} registrada${injuries.length === 1 ? '' : 's'}` : 'Nenhuma lesão registrada';
  $('#sheet-injuries').innerHTML = injuries.length ? injuries.map((injury) => {
    const body = injuryCatalog[injury.body];
    const severity = severityCatalog[injury.severity];
    const cureAction = injury.severity === 'permanent' ? '<span class="injury-no-cure">Sem cura</span>' : canEdit ? `<button class="cure-injury" type="button" data-injury-id="${injury.id}">Marcar como curada</button>` : '<span class="injury-no-cure">Aguarda o Mestre</span>';
    return `<article class="injury-card ${severity.className}"><div class="injury-mark">!</div><div class="injury-copy"><div><strong>${body.label}</strong><span class="injury-severity">${severity.label}</span></div><p>${body.effect}</p><small>${severity.cure}</small></div>${cureAction}</article>`;
  }).join('') : '<div class="injury-empty"><span>✦</span><p>Nenhuma marca registrada. Um crítico de boss pode mudar isso.</p></div>';
  $('#add-injury-button').hidden = !canEdit;
  $('#sheet-injuries').querySelectorAll('.cure-injury').forEach((button) => {
    button.addEventListener('click', () => {
      playerCharacter.injuries = playerCharacter.injuries.filter((injury) => injury.id !== Number(button.dataset.injuryId));
      renderInjuries();
    });
  });
  scheduleSheetSync();
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
  renderInjuries();
  renderUltButton();
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
    ultUsedAt: 0,
    status: Object.fromEntries(Object.entries(state.selectedClass.stats).map(([label, value]) => [label, typeof value === 'number' ? value : 0])),
    injuries: [],
    classId: state.selectedClass.id,
    inventory: [...state.selectedClass.equipment.map((item) => ({ ...item, dice: parseDice(item.detail), spellSlots: parseSpellSlots(item.detail) })), ...state.selectedClass.spells.map((spell) => ({ type: 'Magia', name: spell.name, detail: spell.detail, dice: parseDice(spell.detail) })), { type: 'Armadura', name: 'Armadura da classe', detail: state.selectedClass.armor, dice: null, armor: parseArmor(state.selectedClass.armor) }]
  };
  playerCharacter.ultUsedAt = readUltTimestamp();
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

$('#use-ult-button').addEventListener('click', () => {
  if (!playerCharacter || playerCharacter.ultUsedAt + ULT_COOLDOWN_MS > Date.now()) return;
  startUltCooldown();
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

$('#add-spell-button').addEventListener('click', () => {
  if (playerCharacter.inventory.filter((item) => item.type === 'Magia').length >= getSpellCapacity()) return;
  $('#spell-error').textContent = '';
  $('#spell-name').value = '';
  $('#spell-dice-count').value = '1';
  $('#spell-dice-type').value = 'D8';
  $('#spell-modal').hidden = false;
  $('#spell-name').focus();
});

$('#spell-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#spell-name').value.trim();
  if (!name) {
    $('#spell-error').textContent = 'Informe o nome da magia ou feitiço.';
    return;
  }
  if (playerCharacter.inventory.filter((item) => item.type === 'Magia').length >= getSpellCapacity()) {
    $('#spell-error').textContent = `O limite de ${getSpellCapacity()} poderes já foi atingido. Aumente a capacidade do cajado ou selo sagrado.`;
    $('#spell-modal').hidden = true;
    renderInventory();
    return;
  }
  const dice = { count: Number($('#spell-dice-count').value), type: $('#spell-dice-type').value };
  playerCharacter.inventory.push({ type: 'Magia', name, detail: `${dice.count}${dice.type} dano`, dice });
  $('#spell-modal').hidden = true;
  renderInventory();
});

$('#add-injury-button').addEventListener('click', () => {
  $('#injury-body').value = 'eye';
  $('#injury-severity').value = 'light';
  $('#injury-error').textContent = '';
  renderInjuryPreview();
  $('#injury-modal').hidden = false;
});

$('#injury-body').addEventListener('change', renderInjuryPreview);
$('#injury-severity').addEventListener('change', renderInjuryPreview);

$('#injury-form').addEventListener('submit', (event) => {
  event.preventDefault();
  playerCharacter.injuries.push({ id: Date.now(), body: $('#injury-body').value, severity: $('#injury-severity').value });
  $('#injury-modal').hidden = true;
  renderInjuries();
});

let masterPlayers = [];
let masterSelectedPlayerId = null;

function sheetSpellCapacity(sheet) {
  return sheet.inventory?.find((item) => item.spellSlots)?.spellSlots.count || 0;
}

function syncSheetItemDetail(item) {
  if (item.armor) item.detail = `-${item.armor.reduction} ${item.armor.type}`;
  else if (item.spellSlots) item.detail = `máx. ${item.spellSlots.count} ${item.spellSlots.label}`;
  else if (item.dice) item.detail = `${item.dice.count}${item.dice.type}`;
}

function renderMasterItemEditor(item, index) {
  const diceTypes = ['D4', 'D6', 'D8', 'D10', 'D12'];
  const armorTypes = ['ataques físicos', 'ataques mágicos', 'ataques de feitiçaria', 'ataques mágicos e de feitiçaria'];
  const controls = item.dice ? `<select class="master-item-control" data-item-index="${index}" data-control="dice-count">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${item.dice.count === value ? 'selected' : ''}>${value}</option>`).join('')}</select><span>×</span><select class="master-item-control" data-item-index="${index}" data-control="dice-type">${diceTypes.map((type) => `<option ${item.dice.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select>` : item.spellSlots ? `<select class="master-item-control" data-item-index="${index}" data-control="spell-slots">${[1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${item.spellSlots.count === value ? 'selected' : ''}>${value}</option>`).join('')}</select><span>espaços</span>` : item.armor ? `<select class="master-item-control" data-item-index="${index}" data-control="armor-reduction">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => `<option value="${value}" ${item.armor.reduction === value ? 'selected' : ''}>-${value}</option>`).join('')}</select><select class="master-item-control" data-item-index="${index}" data-control="armor-type">${armorTypes.map((type) => `<option ${item.armor.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select>` : '<span>sem editor</span>';
  return `<li class="master-item-editor"><div><span class="inventory-kind">${escapeHTML(item.type)}</span><input class="master-item-name" data-item-index="${index}" value="${escapeHTML(item.name)}" aria-label="Nome do item" /><small>${escapeHTML(item.detail || '')}</small></div><div class="master-item-controls">${controls}${item.type === 'Magia' ? `<button class="master-remove-spell" data-item-index="${index}" type="button" aria-label="Remover magia">×</button>` : ''}</div></li>`;
}

async function saveMasterSheet(player) {
  try {
    await roomApi(`/api/rooms/${roomSession.code}/players/${player.id}?token=${roomSession.token}&role=master`, { method: 'PATCH', body: { sheet: player.sheet } });
    $('#master-detail-message').textContent = 'Alteração salva para o jogador.';
    renderMasterGrid(masterPlayers);
  } catch (error) {
    $('#master-detail-message').textContent = error.message;
  }
}

function applyExperienceToSheet(sheet, amount) {
  sheet.xp = Number(sheet.xp) || 0;
  sheet.pendingLevelUps = Number(sheet.pendingLevelUps) || 0;
  sheet.xp += amount;
  while (true) {
    const pendingLevel = sheet.level + sheet.pendingLevelUps;
    const required = xpToNextLevel(pendingLevel);
    if (sheet.xp < required) break;
    sheet.xp -= required;
    sheet.pendingLevelUps += 1;
  }
}

function renderMasterPlayerDetail(player) {
  masterSelectedPlayerId = player?.id || null;
  const detail = $('#master-player-detail');
  if (!player || !player.sheet) {
    detail.innerHTML = '<div class="master-detail-empty"><span>✦</span><p>Este jogador ainda está escolhendo sua classe.</p></div>';
    return;
  }
  const sheet = player.sheet;
  const characterClass = classes.find((item) => item.id === sheet.classId);
  const life = (sheet.status?.Vitalidade || 0) * 2;
  const attributesMarkup = Object.entries(sheet.allocation || {}).map(([label, value]) => `<label>${escapeHTML(label)} <input class="master-sheet-number" data-sheet-group="allocation" data-sheet-key="${escapeHTML(label)}" type="number" min="1" value="${value}" /></label>`).join('');
  const statusMarkup = Object.entries(sheet.status || {}).map(([label, value]) => `<label>${escapeHTML(label)} <input class="master-sheet-number" data-sheet-group="status" data-sheet-key="${escapeHTML(label)}" type="number" min="0" value="${value}" /></label>`).join('');
  const inventoryMarkup = (sheet.inventory || []).map((item, index) => renderMasterItemEditor(item, index)).join('');
  const injuriesMarkup = (sheet.injuries || []).map((injury) => `<li>${escapeHTML(injuryCatalog[injury.body]?.label || injury.body)} · ${escapeHTML(severityCatalog[injury.severity]?.label || injury.severity)} ${injury.severity !== 'permanent' ? `<button class="master-cure-injury" data-injury-id="${injury.id}" type="button">Curar</button>` : ''}</li>`).join('');
  const spellLabel = sheet.classId === 'profeta' ? 'feitiço' : 'magia';
  detail.innerHTML = `<div class="master-detail-header"><div><span class="mini-label">Ficha selecionada</span><h3>${escapeHTML(sheet.name || player.name)}</h3><p>${escapeHTML(characterClass?.name || sheet.classId || 'Classe não escolhida')} · ${sheet.age || '—'} anos</p></div><div class="master-detail-header-actions"><span class="master-detail-level">LV ${sheet.level || 1}</span><button id="master-edit-sheet-button" class="secondary-button" type="button">Editar ficha</button></div></div><div class="master-detail-vitals"><div><span>Vida</span><strong>${life}</strong></div><div><span>XP</span><strong>${sheet.xp || 0}</strong></div><div><span>Lesões</span><strong>${(sheet.injuries || []).length}</strong></div></div><section class="master-detail-controls"><h4>Editar ficha do jogador</h4><p class="master-edit-helper">Use os controles abaixo para alterar XP, itens, magias, feitiços e lesões. As alterações são salvas automaticamente.</p><div class="master-xp-controls"><input id="master-xp-amount" type="number" min="1" placeholder="XP recebido" /><button id="master-add-xp" class="secondary-button" type="button">Adicionar XP</button></div><p id="master-detail-message" class="master-detail-message">Somente o Mestre altera XP, itens, magias e lesões.</p></section><section class="master-detail-section"><h4>Atributos</h4><div class="master-detail-values">${attributesMarkup}</div></section><section class="master-detail-section"><h4>Status</h4><div class="master-detail-values">${statusMarkup}</div></section><section class="master-detail-section"><h4>Inventário · editável pelo Mestre</h4><ul class="master-detail-list master-inventory-list">${inventoryMarkup || '<li>Nenhum item registrado</li>'}</ul></section><section class="master-detail-section"><h4>${spellLabel[0].toUpperCase() + spellLabel.slice(1)}s · ${sheet.inventory?.filter((item) => item.type === 'Magia').length || 0} / ${sheetSpellCapacity(sheet)}</h4><div class="master-add-spell"><input id="master-spell-name" type="text" maxlength="40" placeholder="Nome da ${spellLabel}" /><select id="master-spell-count"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select><select id="master-spell-type"><option>D4</option><option>D6</option><option selected>D8</option><option>D10</option><option>D12</option></select><button id="master-add-spell" class="secondary-button" type="button">Adicionar</button></div></section><section class="master-detail-section"><h4>Lesões · editável pelo Mestre</h4><div class="master-add-injury"><select id="master-injury-body"><option value="eye">Olho</option><option value="leg">Perna</option><option value="arm">Braço</option></select><select id="master-injury-severity"><option value="light">Leve</option><option value="grave">Grave</option><option value="permanent">Permanente</option></select><button id="master-add-injury" class="secondary-button" type="button">Registrar</button></div><ul class="master-detail-list">${injuriesMarkup || '<li>Nenhuma lesão registrada</li>'}</ul></section>`;
  $('#master-edit-sheet-button').addEventListener('click', () => { const controls = detail.querySelector('.master-detail-controls'); controls.classList.add('is-focused'); controls.scrollIntoView({ behavior: 'smooth', block: 'center' }); $('#master-xp-amount').focus(); });
  detail.querySelectorAll('.master-sheet-number').forEach((control) => control.addEventListener('change', async () => { const group = control.dataset.sheetGroup; const key = control.dataset.sheetKey; player.sheet[group][key] = Number(control.value) || 0; await saveMasterSheet(player); renderMasterPlayerDetail(player); }));

  detail.querySelectorAll('.master-item-control, .master-item-name').forEach((control) => control.addEventListener('change', async () => {
    const item = sheet.inventory[Number(control.dataset.itemIndex)];
    if (control.classList.contains('master-item-name')) item.name = control.value.trim() || item.name;
    if (control.dataset.control === 'dice-count') item.dice.count = Number(control.value);
    if (control.dataset.control === 'dice-type') item.dice.type = control.value;
    if (control.dataset.control === 'spell-slots') item.spellSlots.count = Number(control.value);
    if (control.dataset.control === 'armor-reduction') item.armor.reduction = Number(control.value);
    if (control.dataset.control === 'armor-type') item.armor.type = control.value;
    syncSheetItemDetail(item);
    await saveMasterSheet(player);
    renderMasterPlayerDetail(player);
  }));
  detail.querySelectorAll('.master-remove-spell').forEach((button) => button.addEventListener('click', async () => { sheet.inventory.splice(Number(button.dataset.itemIndex), 1); await saveMasterSheet(player); renderMasterPlayerDetail(player); }));
  $('#master-add-xp').addEventListener('click', async () => { const amount = Number($('#master-xp-amount').value); if (!Number.isInteger(amount) || amount < 1) { $('#master-detail-message').textContent = 'Informe uma quantidade de XP maior que zero.'; return; } applyExperienceToSheet(sheet, amount); await saveMasterSheet(player); renderMasterPlayerDetail(player); });
  $('#master-add-spell').addEventListener('click', async () => { const name = $('#master-spell-name').value.trim(); if (!name) { $('#master-detail-message').textContent = `Informe o nome da ${spellLabel}.`; return; } if ((sheet.inventory || []).filter((item) => item.type === 'Magia').length >= sheetSpellCapacity(sheet)) { $('#master-detail-message').textContent = 'A capacidade de magias ou feitiços foi atingida.'; return; } const dice = { count: Number($('#master-spell-count').value), type: $('#master-spell-type').value }; sheet.inventory.push({ type: 'Magia', name, detail: `${dice.count}${dice.type} dano`, dice }); await saveMasterSheet(player); renderMasterPlayerDetail(player); });
  $('#master-add-injury').addEventListener('click', async () => { sheet.injuries.push({ id: Date.now(), body: $('#master-injury-body').value, severity: $('#master-injury-severity').value }); await saveMasterSheet(player); renderMasterPlayerDetail(player); });
  detail.querySelectorAll('.master-cure-injury').forEach((button) => button.addEventListener('click', async () => { sheet.injuries = sheet.injuries.filter((injury) => injury.id !== Number(button.dataset.injuryId)); await saveMasterSheet(player); renderMasterPlayerDetail(player); }));
}

function renderMasterGrid(players = []) {
  masterPlayers = players;
  $('#master-player-count').textContent = `${players.length} jogador${players.length === 1 ? '' : 'es'}`;
  $('#master-class-grid').innerHTML = players.length ? players.map((player) => {
    const sheet = player.sheet;
    const characterClass = sheet && classes.find((item) => item.id === sheet.classId);
    const life = sheet ? (sheet.status?.Vitalidade || 0) * 2 : '—';
    return `<button class="master-player-card" data-player-id="${player.id}" type="button"><div class="master-class-symbol">${characterClass?.name === 'Bandido' ? '◇' : characterClass?.name === 'Profeta' ? '☼' : characterClass?.name === 'Mago' ? '✧' : characterClass?.name === 'Soldado' ? '⚔' : '✦'}</div><div><span class="mini-label">${sheet ? escapeHTML(characterClass?.name || 'Classe') : 'Aguardando ficha'}</span><h3>${escapeHTML(player.name)}</h3><p>${sheet ? `${life} Vida · Level ${sheet.level || 1} · ${sheet.xp || 0} XP` : 'Entrou na sala e ainda está criando o personagem.'}</p><div class="master-class-meta"><span>${sheet ? `${(sheet.injuries || []).length} lesão${(sheet.injuries || []).length === 1 ? '' : 'ões'}` : 'online'}</span><span>Ver ficha ↗</span></div></div></button>`;
  }).join('') : '<div class="master-room-empty"><span>✦</span><p>A sala está aberta. Compartilhe o código para seus jogadores entrarem.</p></div>';
  $('#master-class-grid').querySelectorAll('.master-player-card').forEach((card) => {
    card.addEventListener('click', () => renderMasterPlayerDetail(masterPlayers.find((player) => String(player.id) === card.dataset.playerId)));
  });
}

async function refreshMasterRoom() {
  if (roomSession.role !== 'master') return;
  try {
    const payload = await roomApi(`/api/rooms/${roomSession.code}?token=${roomSession.token}&role=master`);
    renderMasterGrid(payload.room.players);
    if (masterSelectedPlayerId) {
      const selected = payload.room.players.find((player) => player.id === masterSelectedPlayerId);
      if (selected) renderMasterPlayerDetail(selected);
    }
    $('#master-sync-status').textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    $('#master-sync-status').textContent = 'Falha ao sincronizar';
  }
}

async function refreshPlayerSheet() {
  if (roomSession.role !== 'player' || !playerCharacter) return;
  try {
    const payload = await roomApi(`/api/rooms/${roomSession.code}?token=${roomSession.token}&role=player`);
    const remotePlayer = payload.room.players.find((player) => player.id === roomSession.playerId);
    if (!remotePlayer?.sheet || JSON.stringify(remotePlayer.sheet) === JSON.stringify(playerCharacter)) return;
    playerCharacter = remotePlayer.sheet;
    state.selectedClass = classes.find((characterClass) => characterClass.id === playerCharacter.classId) || state.selectedClass;
    state.allocation = playerCharacter.allocation || state.allocation;
    renderSheet(playerCharacter.name, playerCharacter.age);
    if (playerCharacter.pendingLevelUps > 0 && $('#level-up-modal').hidden) openLevelUpModal();
  } catch (error) {
    console.warn('Falha ao atualizar a ficha recebida do Mestre', error);
  }
}

function openMasterRoom(payload) {
  setRoomSession(payload);
  $('#master-room-code').textContent = payload.code;
  $('#master-room-title').innerHTML = `${escapeHTML(payload.name)}<br /><em>aberta.</em>`;
  landingView.hidden = true;
  masterEntryView.hidden = true;
  playerEntryView.hidden = true;
  $('.app-layout').hidden = true;
  $('#sheet-view').hidden = true;
  masterView.hidden = false;
  $('.site-footer').hidden = true;
  stopRoomPolling();
  refreshMasterRoom();
  roomPollTimer = setInterval(refreshMasterRoom, 3000);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openPlayerBuilder(payload) {
  setRoomSession(payload);
  landingView.hidden = true;
  playerEntryView.hidden = true;
  masterEntryView.hidden = true;
  masterView.hidden = true;
  $('.app-layout').hidden = false;
  $('.site-footer').hidden = true;
  stopRoomPolling();
  roomPollTimer = setInterval(refreshPlayerSheet, 3000);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMode(mode) {
  landingView.hidden = true;
  $('.site-footer').hidden = true;
  if (mode === 'master') {
    masterEntryView.hidden = false;
    playerEntryView.hidden = true;
  } else {
    playerEntryView.hidden = false;
    masterEntryView.hidden = true;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

playerModeButton.addEventListener('click', () => showMode('player'));
masterModeButton.addEventListener('click', () => showMode('master'));
$('#player-entry-back').addEventListener('click', () => { playerEntryView.hidden = true; landingView.hidden = false; $('.site-footer').hidden = false; });
$('#master-entry-back').addEventListener('click', () => { masterEntryView.hidden = true; landingView.hidden = false; $('.site-footer').hidden = false; });
$('#master-back-button').addEventListener('click', () => { stopRoomPolling(); masterView.hidden = true; landingView.hidden = false; $('.site-footer').hidden = false; });
$('#master-refresh-button').addEventListener('click', refreshMasterRoom);

$('#copy-room-code').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(roomSession.code); $('#copy-room-code').textContent = 'Código copiado'; setTimeout(() => { $('#copy-room-code').textContent = 'Copiar código'; }, 1800); } catch { $('#copy-room-code').textContent = roomSession.code; }
});

$('#master-room-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#master-room-error').textContent = '';
  try { openMasterRoom(await roomApi('/api/rooms', { method: 'POST', body: { name: $('#master-room-name').value.trim() } })); } catch (error) { $('#master-room-error').textContent = error.message; }
});

$('#player-room-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#player-room-error').textContent = '';
  try { openPlayerBuilder(await roomApi('/api/rooms/join', { method: 'POST', body: { name: $('#player-room-name').value.trim(), code: $('#player-room-code').value.trim().toUpperCase() } })); } catch (error) { $('#player-room-error').textContent = error.message; }
});

$('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  stopRoomPolling();
  $('.app-layout').hidden = true;
  masterView.hidden = true;
  playerEntryView.hidden = true;
  masterEntryView.hidden = true;
  $('#sheet-view').hidden = true;
  landingView.hidden = false;
  $('.site-footer').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

renderClassList();
renderClassDetails();
renderAttributes();

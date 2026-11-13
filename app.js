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

const $ = (selector) => document.querySelector(selector);
const classList = $('#class-list');
const attributeList = $('#attribute-list');
const form = $('#character-form');
const formError = $('#form-error');

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
  $('#class-name').textContent = characterClass.name;
  $('#class-index').textContent = characterClass.index;
  $('#class-kicker').textContent = characterClass.kicker;
  $('#class-description').textContent = characterClass.description;
  $('#class-life').textContent = characterClass.life;
  $('#class-life-bar').style.width = `${Math.max(22, Math.min(100, (characterClass.life / 60) * 100))}%`;
  $('#class-armor').textContent = characterClass.armor;
  $('#ability-title').textContent = characterClass.ability.title;
  $('#ability-cooldown').textContent = characterClass.ability.cooldown;
  $('#ability-description').textContent = characterClass.ability.description;
  $('#class-stats').innerHTML = Object.entries(characterClass.stats).map(([label, value]) => `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`).join('');
  $('#class-equipment').innerHTML = characterClass.equipment.map((item) => `<div class="equipment-item"><strong>${item.name}</strong><small>${item.detail}</small></div>`).join('');
  $('#spell-list').innerHTML = characterClass.spells.length ? characterClass.spells.map((spell) => `<span class="spell-pill">${spell.name} <b>· ${spell.detail}</b></span>`).join('') : '';
}

function remainingPoints() {
  return 3 - attributes.reduce((sum, attribute) => sum + (state.allocation[attribute] - 1), 0);
}

function renderAttributes() {
  const pointsLeft = remainingPoints();
  $('#points-counter').innerHTML = `<strong>${pointsLeft}</strong><span>de 3<br />pontos</span>`;
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

function renderSheet(characterName, age) {
  const characterClass = state.selectedClass;
  $('#sheet-name').textContent = characterName;
  $('#sheet-subtitle').textContent = `${characterClass.name} · ${age} anos`;
  $('#sheet-life').textContent = characterClass.life;
  $('#sheet-class').textContent = characterClass.name;
  $('#sheet-age').textContent = age;
  $('#sheet-attributes').innerHTML = attributes.map((attribute) => `<div class="sheet-attribute"><span>${attribute}</span><strong>${state.allocation[attribute]}</strong><small>${state.allocation[attribute]} dado${state.allocation[attribute] === 1 ? '' : 's'} por teste</small></div>`).join('');
  const equipment = characterClass.equipment.map((item) => `<div class="sheet-item"><b>${item.type}:</b> ${item.name}<span>${item.detail}</span></div>`).join('');
  const spells = characterClass.spells.length ? `<div class="sheet-section"><h4>Magias / feitiços</h4><div class="sheet-items">${characterClass.spells.map((spell) => `<div class="sheet-item"><b>${spell.name}</b><span>${spell.detail}</span></div>`).join('')}</div></div>` : '';
  $('#sheet-class-content').innerHTML = `<div class="sheet-section"><h4>Equipamento inicial</h4><div class="sheet-items">${equipment}</div><p style="margin-top: 12px"><strong>Armadura:</strong> ${characterClass.armor}</p></div>${spells}<div class="sheet-section"><h4>Habilidade ativa · ${characterClass.ability.cooldown}</h4><p><strong>${characterClass.ability.title}.</strong> ${characterClass.ability.description}</p></div><div class="sheet-section"><h4>Status de classe</h4><p>${Object.entries(characterClass.stats).map(([label, value]) => `${label}: ${value}`).join('  ·  ')}</p></div>`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#character-name').value.trim();
  const age = Number($('#character-age').value);
  if (!name) { showError('Dê um nome ao personagem antes de gerar a ficha.'); $('#character-name').focus(); return; }
  if (!age || age < 1) { showError('Informe uma idade válida para continuar.'); $('#character-age').focus(); return; }
  if (remainingPoints() !== 0) { showError(`Distribua os ${remainingPoints()} ponto${remainingPoints() === 1 ? '' : 's'} restante${remainingPoints() === 1 ? '' : 's'} antes de gerar.`); return; }
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

renderClassList();
renderClassDetails();
renderAttributes();

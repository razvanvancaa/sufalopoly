// board.js
const RENT = {
  brown: { house: 50, hotel: 50, rents: [[2, 4, 10, 30, 90, 160, 250], [4, 8, 20, 60, 180, 320, 450]] },
  lightblue: { house: 50, hotel: 50, rents: [[6, 12, 30, 90, 270, 400, 550], [6, 12, 30, 90, 270, 400, 550], [8, 16, 40, 100, 300, 450, 600]] },
  pink: { house: 100, hotel: 100, rents: [[10, 20, 50, 150, 450, 625, 750], [10, 20, 50, 150, 450, 625, 750], [12, 24, 60, 180, 500, 700, 900]] },
  orange: { house: 100, hotel: 100, rents: [[14, 28, 70, 200, 550, 750, 950], [14, 28, 70, 200, 550, 750, 950], [16, 32, 80, 220, 600, 800, 1000]] },
  red: { house: 150, hotel: 150, rents: [[18, 36, 90, 250, 700, 875, 1050], [18, 36, 90, 250, 700, 875, 1050], [20, 40, 100, 300, 750, 925, 1100]] },
  yellow: { house: 150, hotel: 150, rents: [[22, 44, 110, 330, 800, 975, 1150], [22, 44, 110, 330, 800, 975, 1150], [24, 48, 120, 360, 850, 1025, 1200]] },
  green: { house: 200, hotel: 200, rents: [[26, 52, 130, 390, 900, 1100, 1275], [26, 52, 130, 390, 900, 1100, 1275], [28, 56, 150, 450, 1000, 1200, 1400]] },
  darkblue: { house: 200, hotel: 200, rents: [[35, 70, 175, 500, 1100, 1300, 1500], [50, 100, 200, 600, 1400, 1700, 2000]] },
};

function generateCardText(name, price, color, groupIndex) {
  const g = RENT[color];
  const rents = g.rents[groupIndex];
  return `
    <b style="font-size: 16px;">${name}</b><br>
    <span style="font-size: 12px; color: #555;">Preț: M${price} | Ipotecă: M${price / 2}</span><br><br>
    <b>Chirie cu set complet: M${rents[0] * 2}</b><br>
    <b>Chirie fără set: M${rents[0]}</b><br><br>
    Cu 1 casă: M${rents[1]}<br>
    Cu 2 case: M${rents[2]}<br>
    Cu 3 case: M${rents[3]}<br>
    Cu 4 case: M${rents[4]}<br>
    Cu Hotel: M${rents[5]}<br><br>
    Cost casă: M${g.house}<br>
    Cost hotel: M${g.hotel}
  `;
}

function makeStreet(name, price, color, groupIndex) {
  const g = RENT[color];
  return {
    type: 'street', name, price, color,
    mortgage: price / 2,
    houseCost: g.house,
    rents: g.rents[groupIndex],
    cardText: generateCardText(name, price, color, groupIndex)
  };
}

function makeStation(name, price) {
  return {
    type: 'station', name, price, mortgage: price / 2, rents: [25, 50, 100, 200],
    cardText: `
      <b style="font-size: 16px;">${name}</b><br>
      <span style="font-size: 12px; color: #555;">Preț: M${price} | Ipotecă: M${price / 2}</span><br><br>
      <b>1 Gara: M25</b><br>
      <b>2 Gări: M50</b><br>
      <b>3 Gări: M100</b><br>
      <b>4 Gări: M200</b>
    `
  };
}

function makeUtility(name, price) {
  return {
    type: 'utility', name, price, mortgage: price / 2,
    cardText: `
      <b style="font-size: 16px;">${name}</b><br>
      <span style="font-size: 12px; color: #555;">Preț: M${price} | Ipotecă: M${price / 2}</span><br><br>
      <b>Cu 1 utilitate: 4x zarul</b><br>
      <b>Cu 2 utilități: 10x zarul</b>
    `
  };
}

const BOARD = [
  { type: 'go', name: 'GOPO', cardText: 'Colectează M200 când treci pe aici.' },
  makeStreet('Pă câmp la Karelia', 60, 'brown', 0),
  { type: 'chest', name: 'Detectorul lui Dale' },
  makeStreet('Ulița lui Belu', 60, 'brown', 1),
  { type: 'tax', name: 'Taxa de șmecher', amount: 150 },
  makeStation('Stația de după gară', 200),
  makeStreet('Pă rătișe', 100, 'lightblue', 0),
  { type: 'chance', name: 'Șansă' },
  makeStreet('Ulița lui Hoboricu', 100, 'lightblue', 1),
  makeStreet('Gostat', 120, 'lightblue', 2),
  { type: 'jail', name: 'La Piroman' },
  makeStreet('Ulița din capătu satului', 140, 'pink', 0),
  makeUtility('Mapagral', 150),
  makeStreet('Căpătu satului', 140, 'pink', 1),
  makeStreet('Colectiv', 160, 'pink', 2),
  makeStation('Stația de la Finteuș', 200),
  makeStreet('Ulița lui Maricica', 180, 'orange', 0),
  { type: 'chest', name: 'Detectorul lui Dale' },
  makeStreet('Ulița lui Tiți', 180, 'orange', 1),
  makeStreet('Ulița lui Maria', 200, 'orange', 2),
  { type: 'free_parking', name: 'Stație electrică' },
  makeStreet('La drum', 220, 'red', 0),
  { type: 'chance', name: 'Șansă' },
  makeStreet('Cruci', 220, 'red', 1),
  makeStreet('Cartier', 240, 'red', 2),
  makeStation('Înainte de gară', 200),
  makeStreet('Lângă Marius Turda', 260, 'yellow', 0),
  makeStreet('Lângă Dorina', 260, 'yellow', 1),
  makeUtility('Voivodeasa', 150),
  makeStreet('După gară', 280, 'yellow', 2),
  { type: 'go_to_jail', name: 'Pușcăria' },
  makeStreet('Priblești, pula s-o belești', 300, 'green', 0),
  makeStreet('Hideaga', 300, 'green', 1),
  { type: 'chest', name: 'Detectorul lui Dale' },
  makeStreet('Mogador', 320, 'green', 2),
  makeStation('Stația de la Parc', 200),
  { type: 'chance', name: 'Șansă' },
  makeStreet('La Băltoc', 350, 'darkblue', 0),
  { type: 'tax', name: 'Taxă pă avere', amount: 150 },
  makeStreet('La Gară', 400, 'darkblue', 1),
];

const CHANCE = [
  { text: 'Avansează până la Drum. Dacă treci pe lângă Gopo, colectezi M200.', action: { type: 'goto', pos: 21, passGo: true } },
  { text: 'Avansează până la cea mai apropiată fabrică de bani (utilitate). Dacă ii pustie, poți s-o cumperi. Dacă e deținută, chiriașul primește chirie dublă.', action: { type: 'goto_nearest_utility', double: true } },
  { text: 'Avansează până la Gopo. Colectezi M200.', action: { type: 'goto', pos: 0, passGo: true } },
  { text: 'Bei la limentara cu Ioska, Gopo și Ionu cailor până nu mai știi de pula ta. Ajungi cumva până la cea mai apropiată gară. Dacă ii pustie, poți s-o cumperi. Dacă e deținută, chiriașul primește chirie dublă.', action: { type: 'goto_nearest_station', double: true } },
  { text: 'Avansează până la băltoc.', action: { type: 'goto', pos: 37 } },
  { text: 'Avansează până la colectiv.', action: { type: 'goto', pos: 14 } },
  { text: 'Du-te până la prima stație.', action: { type: 'goto_nearest_station', double: false } },
  { text: 'Te-o prins Neamtu cu radarul. Plătești M150.', action: { type: 'pay_bank', amount: 150 } },
  { text: 'Mânca-te pușcăria. Mânca-te pușcăria direct — nu-l vizitezi pe Gopo, nu primești M200.', action: { type: 'goto_jail' } },
  { text: 'Jucătorii votează: Dacă ești ales primar plătește spagă fiecăruia M50.', action: { type: 'pay_each', amount: 50 } },
  { text: 'Nu te mai mananca puscaria daca accepti certificat de handicap / poate fi ținută sau tranzacționată (Get Out of Jail Free).', action: { type: 'get_out_of_jail_free_handicap' } },
  { text: 'Ti-o dat piromanu foc la case. Plătește taxă de reparații: M25 de fiecare casă, M100 de fiecare hotel deținut.', action: { type: 'pay_repairs', house: 25, hotel: 100 } },
  // Cărți noi de bețivi
  { text: 'Te-o prins betivii de ziua ta la limentara. Plătești pentru toți bețivii scoși din pachet: 50 pentru fiecare bețiv simplu, 75 pentru fiecare bețiv dinsus.', action: { type: 'pay_for_betivs' } },
  { text: 'Dai de băut la toți bețivii. Plătești la bancă pentru fiecare bețiv scos din pachet.', action: { type: 'pay_for_betivs_to_bank' } },
  { text: 'O dat boala in tine si vine Mona sa-ti faca injectii', action: { type: 'pay_bank', amount: 200 } },
  // Cărți de peturi
  { text: 'Strângi 150 de peturi de la limentară. Dacă ai 2 cărți de acest tip în mână, primești automat M150.', action: { type: 'add_pet_card' } },
  { text: 'Strângi 150 de peturi de la limentară. Dacă ai 2 cărți de acest tip în mână, primești automat M150.', action: { type: 'add_pet_card' } },
  { text: 'Strângi 150 de peturi de la limentară. Dacă ai 2 cărți de acest tip în mână, primești automat M150.', action: { type: 'add_pet_card' } },
  { text: 'Strângi 150 de peturi de la limentară. Dacă ai 2 cărți de acest tip în mână, primești automat M150.', action: { type: 'add_pet_card' } },
  { text: 'Strângi 150 de peturi de la limentară. Dacă ai 2 cărți de acest tip în mână, primești automat M150.', action: { type: 'add_pet_card' } },
  { text: 'Ți-a furat vandam peturile din tomberon. Pierzi toate cărțile de "strâns peturi" din mână.', action: { type: 'steal_pet_cards' } },
];

const CHEST = [
  { text: 'Du-te la Gopo. Colectezi M200.', action: { type: 'goto', pos: 0, passGo: true } },
  { text: 'Primăria îți dă ajutor de lemne, luând bani de la ceilalți jucători. Colectezi M50 de la fiecare jucător.', action: { type: 'collect_each', amount: 50 } },
  { text: 'Moștenești un pământ în colțu pe care îl vinzi. Colectezi M100.', action: { type: 'collect_bank', amount: 100 } },
  { text: 'O intrat socializatul. Colectezi M50.', action: { type: 'collect_bank', amount: 50 } },
  { text: 'Dacă ai certificat de handicap, colectezi M100.', action: { type: 'collect_bank', amount: 100, requires: 'handicap' } },
  { text: 'Dacă ai certificat de handicap trebuie să plătești pastilele: plătești M100.', action: { type: 'pay_bank', amount: 100, requires: 'handicap' } },
  { text: 'Ești impegat cine are gară îți dă câte M50.', action: { type: 'collect_from_owners_of', tileType: 'station', amount: 50 } },
  { text: 'Minune cereasca, ti-o dat stangaciu datoria, primești M50.', action: { type: 'collect_bank', amount: 50 } },
  { text: 'Mostenesti pamant in Coltau. Primești M100.', action: { type: 'collect_bank', amount: 100 } },
  { text: 'Distributie la cotet. Plătești M50.', action: { type: 'pay_bank', amount: 50 } },
  { text: 'Nu ti-ai cosit ambrozia si te-o prins bujor. Plătești M40 pe fiecare casa și 115 pentru fiecare hotel.', action: { type: 'pay_repairs', house: 40, hotel: 115 } },
  { text: 'Ai câștigat locul doi la concursu de pompieri. Colectezi M50.', action: { type: 'collect_bank', amount: 50 } },
  { text: 'Mergi in cartier la un ciubuc. Colectezi M200.', action: { type: 'collect_bank', amount: 200 } },
  { text: 'Primesti legume la superpret de la Gopo. Salvezi 50M', action: { type: 'collect_bank', amount: 50 } },
  { text: 'Trei nunti intr-o luna, fute-le-ai. Platesti 200', action: { type: 'pay_bank', amount: 200 } },
  // Cărți noi pentru Detector
  { text: 'Faci ca Leonora și te duce la nebuni. Primești certificat de handicapat. Plătești 100.', action: { type: 'get_out_of_jail_free_handicap' } },
  { text: 'Faci ca Leonora și te duce la nebuni. Primești certificat de handicapat. Plătești 100.', action: { type: 'get_out_of_jail_free_handicap' } },
  { text: 'Dacă există doi nebuni primesc pachet comun la Sighet — fiecare nebun ia 50. Dacă nu există handicapati în joc, jucătorul care a extras cartea primește M150.', action: { type: 'handicap_bonus' } },
  { text: 'Primești M25 de la fiecare handicapat.', action: { type: 'collect_from_handicapped', amount: 25 } },
  { text: 'Nu mai merge ATM-ul la Bobocu — fiecare jucător îți decartează M50.', action: { type: 'collect_each', amount: 50 } },
  { text: 'Te întâlnești cu Gusti și îți cere de o bere. Plătești M50 (bețiv simplu).', action: { type: 'pay_bank', amount: 50, betivType: 'simplu' } },
  { text: 'Te întâlnești cu Tica și îți cere de o bere. Plătești M50 (bețiv dinsus).', action: { type: 'pay_bank', amount: 50, betivType: 'dinsus' } },
  { text: 'Te întâlnești cu Ionu Cailor și îți cere de o bere. Plătești M50 (bețiv simplu).', action: { type: 'pay_bank', amount: 50, betivType: 'simplu' } },
  { text: 'Te întâlnești cu Gopo și îți cere de o bere. Plătești M50 (bețiv dinsus).', action: { type: 'pay_bank', amount: 50, betivType: 'dinsus' } },
  { text: 'Ți-a furat vandam peturile din tomberon. Pierzi toate cărțile de "strâns peturi" din mână.', action: { type: 'steal_pet_cards' } },
];

module.exports = { BOARD, CHANCE, CHEST };

// --- Mecanica "Ești neam cu X?" ---
// Lista exactă de nume proprii date de Razvan. Pentru proprietăți (străzi),
// dacă proprietarul e confirmat "neam", primește chirie dublă. Pentru cărți
// (Șansă/Detector) care implică o plată, dacă jucătorul e confirmat "neam",
// plătește dublu.
const PROPER_NOUNS = [
  'Ulița lui Belu', 'Ulița lui Hoboricu', 'Ulița din căpătu satului', 'Căpătu satului',
  'Ulița lui Măricica', 'Ulița lui Tiți', 'Ulița lui Maria', 'Lângă Marius Turda', 'Lângă Dorina',
  'Priblești, pula s-o belești', 'Hideaga', 'La Bălioc', 'La Gară',
  'Ioska', 'Ionu cailor', 'Neamtu', 'piromanu', 'stangaciu', 'Coltau', 'bujor',
  'Distributie la cotet', 'Leonora', 'ATM-ul la Bobocu', 'Gusti', 'vandam', 'Primăria', 'Sighet',
  'La limentară', 'La nebuni', 'Pușcăria', 'Gopo',
];

function findProperNoun(text) {
  if (!text) return null;
  const sorted = [...PROPER_NOUNS].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (text.includes(name)) return name;
  }
  return null;
}

// Etichetăm proprietățile (doar străzile — au preț de cumpărare și chirie)
BOARD.forEach((t) => {
  if (t.type === 'street') {
    const noun = findProperNoun(t.name);
    if (noun) t.properNoun = noun;
  }
});

// Etichetăm cărțile Șansă / Detectorul lui Dale
[...CHANCE, ...CHEST].forEach((c) => {
  const noun = findProperNoun(c.text);
  if (noun) c.properNoun = noun;
});

module.exports.PROPER_NOUNS = PROPER_NOUNS;
module.exports.findProperNoun = findProperNoun;
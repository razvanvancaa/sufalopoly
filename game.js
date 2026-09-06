const { BOARD, CHANCE, CHEST } = require('./board');

const START_MONEY = 3000;
const PASS_GO_AMOUNT = 200;
const MAX_JAIL_TURNS = 3;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = []; // {id, name, money, pos, inJail, jailTurns, bankrupt, getOutOfJailFree, properties:[], petCards:0}
    this.owners = {};
    this.turnIndex = 0;
    this.started = false;
    this.chanceDeck = shuffle(CHANCE.map((c, i) => i));
    this.chestDeck = shuffle(CHEST.map((c, i) => i));
    this.log = [];
    this.pendingAction = null;
    this.freeParkingPot = 0;
    this.lastDice = null;
    this.lastDrawnCard = null;

    // Contor global bețivi
    this.betiviExtrasi = { simplu: 0, dinsus: 0 };

    // Contor peturi strânse (pentru reciclare)
    this.petCounter = 0;
  }

  addLog(msg) {
    this.log.push(msg);
    if (this.log.length > 200) this.log.shift();
  }

  addPlayer(id, name) {
    if (this.started) return false;
    if (this.players.length >= 6) return false;
    this.players.push({
      id, name, money: START_MONEY, pos: 0, inJail: false, jailTurns: 0,
      bankrupt: false, getOutOfJailFree: 0, handicap: false, pets: 0, properties: [], petCards: 0,
    });
    return true;
  }

  removePlayer(id) {
    const p = this.players.find(pl => pl.id === id);
    if (p) p.disconnected = true;
  }

  start() {
    if (this.players.length < 2) return false;
    this.started = true;
    this.turnIndex = 0;
    this.addLog(`Jocul a început cu ${this.players.length} jucători.`);
    return true;
  }

  currentPlayer() {
    return this.players[this.turnIndex];
  }

  nextTurn() {
    this.pendingAction = null;
    this.lastDice = null;
    this.lastDrawnCard = null;
    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
    } while (this.currentPlayer().bankrupt);
  }

  tile(pos) { return BOARD[pos]; }

  ownerOf(pos) {
    const o = this.owners[pos];
    if (!o) return null;
    return this.players.find(p => p.id === o.playerId);
  }

  playerNetWorth(p) {
    let worth = p.money;
    for (const idx of p.properties) {
      const t = BOARD[idx];
      const o = this.owners[idx];
      worth += o.mortgaged ? t.mortgage : t.price;
      if (t.type === 'street' && o.houses > 0) {
        worth += o.houses * t.houseCost;
      }
    }
    return worth;
  }

  countGroupOwned(color, playerId) {
    let total = 0, owned = 0;
    BOARD.forEach((t, i) => {
      if (t.type === 'street' && t.color === color) {
        total++;
        if (this.owners[i] && this.owners[i].playerId === playerId) owned++;
      }
    });
    return owned === total;
  }

  rentFor(pos, dice) {
    const t = BOARD[pos];
    const o = this.owners[pos];
    if (!o || o.mortgaged) return 0;
    const owner = this.ownerOf(pos);
    if (t.type === 'street') {
      let rent;
      if (o.houses === 0) {
        const hasSet = this.countGroupOwned(t.color, owner.id);
        rent = hasSet ? t.rents[0] * 2 : t.rents[0];
      } else {
        rent = t.rents[o.houses + 1];
      }
      // Bonus "ești neam cu X" — confirmat prin vot, dublează chiria
      if (o.claimBonus) rent *= 2;
      return rent;
    }
    if (t.type === 'station') {
      let count = 0;
      BOARD.forEach((tt, i) => { if (tt.type === 'station' && this.owners[i] && this.owners[i].playerId === owner.id) count++; });
      return t.rents[count - 1];
    }
    if (t.type === 'utility') {
      let count = 0;
      BOARD.forEach((tt, i) => { if (tt.type === 'utility' && this.owners[i] && this.owners[i].playerId === owner.id) count++; });
      const mult = count === 2 ? 10 : 4;
      return dice * mult;
    }
    return 0;
  }

  // --- Turn actions ---

  rollDice(playerId) {
    const p = this.currentPlayer();
    if (!p || p.id !== playerId) return { error: 'Nu e rândul tău.' };
    if (this.pendingAction) return { error: 'Rezolvă mai întâi acțiunea curentă.' };
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const isDouble = d1 === d2;
    this.lastDice = { d1, d2, isDouble };

    if (p.inJail) {
      if (isDouble) {
        p.inJail = false;
        p.jailTurns = 0;
        this.addLog(`${p.name} a dat dublă și a ieșit din pușcărie!`);
      } else {
        p.jailTurns++;
        if (p.jailTurns >= MAX_JAIL_TURNS) {
          p.inJail = false;
          p.jailTurns = 0;
          p.money -= 50;
          this.addLog(`${p.name} plătește M50 și iese din pușcărie.`);
        } else {
          this.addLog(`${p.name} rămâne în pușcărie (încercarea ${p.jailTurns}/3).`);
          this.doublesStreak = 0;
          return { dice: this.lastDice, stayedInJail: true };
        }
      }
    }

    this.doublesCount = (this.doublesCount || 0);
    if (isDouble) {
      this.doublesCount++;
      if (this.doublesCount === 3) {
        this.doublesCount = 0;
        p.inJail = true;
        p.pos = 10;
        this.addLog(`${p.name} a dat 3 duble la rând — direct la pușcărie!`);
        return { dice: this.lastDice, sentToJail: true };
      }
    } else {
      this.doublesCount = 0;
    }

    this.movePlayer(p, d1 + d2);
    return { dice: this.lastDice, newPos: p.pos, canRollAgain: isDouble && !p.inJail };
  }

  movePlayer(p, steps) {
    const before = p.pos;
    p.pos = (p.pos + steps) % 40;
    if (p.pos < before) {
      p.money += PASS_GO_AMOUNT;
      this.addLog(`${p.name} trece prin Gopo și colectează M200.`);
    }
    this.landOn(p);
  }

  landOn(p) {
    const t = BOARD[p.pos];
    if (t.type === 'street' || t.type === 'station' || t.type === 'utility') {
      const o = this.owners[p.pos];
      if (!o) {
        this.pendingAction = { type: 'awaiting_buy', tileIndex: p.pos, playerId: p.id };
      } else if (o.playerId !== p.id && !o.mortgaged) {
        const rent = this.rentFor(p.pos, (this.lastDice ? this.lastDice.d1 + this.lastDice.d2 : 0));
        this.transferMoney(p, this.ownerOf(p.pos), rent);
        this.addLog(`${p.name} plătește chirie M${rent} către ${this.ownerOf(p.pos).name} (${t.name}).`);
      }
    } else if (t.type === 'tax') {
      p.money -= t.amount;
      this.freeParkingPot += t.amount;
      this.addLog(`${p.name} plătește taxă M${t.amount} (${t.name}).`);
    } else if (t.type === 'go_to_jail') {
      p.pos = 10;
      p.inJail = true;
      this.addLog(`${p.name} merge direct la pușcărie!`);
    } else if (t.type === 'chance' || t.type === 'chest') {
      this.drawCard(p, t.type);
    } else if (t.type === 'free_parking') {
      if (this.freeParkingPot > 0) {
        p.money += this.freeParkingPot;
        this.addLog(`${p.name} încasează pot-ul de parcare gratuită: M${this.freeParkingPot}.`);
        this.freeParkingPot = 0;
      }
    }
    this.checkBankrupt(p);
  }

  drawCard(p, deckType) {
    const deck = deckType === 'chance' ? this.chanceDeck : this.chestDeck;
    const source = deckType === 'chance' ? CHANCE : CHEST;
    if (deck.length === 0) {
      const refill = shuffle(source.map((c, i) => i));
      deck.push(...refill);
    }
    const idx = deck.shift();
    const card = source[idx];
    this.addLog(`${p.name} trage o carte ${deckType === 'chance' ? 'Șansă' : 'Detectorul lui Dale'}: "${card.text}"`);

    this.lastDrawnCard = { text: card.text, type: deckType, playerId: p.id };

    if (card.properNoun) {
      // Cartea menționează un nume propriu — întrebăm întâi "ești neam cu X?"
      // și abia după ce se lămurește asta (eventual cu vot), aplicăm efectul cărții.
      this.pendingAction = {
        type: 'claim_question', subject: 'card', properNoun: card.properNoun,
        playerId: p.id, cardAction: card.action, cardText: card.text,
      };
    } else {
      this.applyCardAction(p, card.action);
    }
  }

  applyCardAction(p, action) {
    if (!action) return;
    switch (action.type) {
      case 'none': break;
      case 'goto': {
        const before = p.pos;
        p.pos = action.pos;
        if (action.passGo && p.pos < before) p.money += PASS_GO_AMOUNT;
        else if (action.passGo === false) { }
        this.landOn(p);
        break;
      }
      case 'goto_nearest_utility': {
        const utilPositions = [12, 28];
        const next = utilPositions.find(x => x > p.pos) ?? utilPositions[0];
        const before = p.pos;
        p.pos = next;
        if (p.pos < before) p.money += PASS_GO_AMOUNT;
        this.landOn(p);
        break;
      }
      case 'goto_nearest_station': {
        const stationPositions = [5, 15, 25, 35];
        const next = stationPositions.find(x => x > p.pos) ?? stationPositions[0];
        const before = p.pos;
        p.pos = next;
        if (p.pos < before) p.money += PASS_GO_AMOUNT;
        this.landOn(p);
        break;
      }
      case 'goto_jail':
        p.pos = 10; p.inJail = true; p.jailTurns = 0;
        break;
      case 'pay_bank':
        if (!action.requires || p[action.requires]) p.money -= action.amount;
        break;
      case 'collect_bank':
        if (!action.requires || p[action.requires]) p.money += action.amount;
        break;
      case 'pay_each':
        for (const other of this.players) {
          if (other.id !== p.id && !other.bankrupt) { p.money -= action.amount; other.money += action.amount; }
        }
        break;
      case 'collect_each':
        for (const other of this.players) {
          if (other.id !== p.id && !other.bankrupt) { other.money -= action.amount; p.money += action.amount; }
        }
        break;
      case 'collect_from_owners_of':
        for (const other of this.players) {
          if (other.id === p.id) continue;
          const hasType = other.properties.some(i => BOARD[i].type === action.tileType);
          if (hasType) { other.money -= action.amount; p.money += action.amount; }
        }
        break;
      case 'collect_from_handicapped':
        for (const other of this.players) {
          if (other.id !== p.id && other.handicap && !other.bankrupt) {
            other.money -= action.amount;
            p.money += action.amount;
          }
        }
        break;
      case 'get_out_of_jail_free':
        p.getOutOfJailFree++;
        break;
      case 'get_out_of_jail_free_handicap':
        // Dacă ești în pușcărie, alegerea (accept/refuz) se face acum interactiv în UI.
        if (p.inJail) {
          this.pendingAction = { type: 'handicap_offer', playerId: p.id, cost: 100 };
        } else {
          p.getOutOfJailFree++;
          this.addLog(`${p.name} primește o carte "ieșire liberă" (cu handicap). O poate folosi mai târziu.`);
        }
        break;
      case 'pay_repairs': {
        let total = 0;
        for (const idx of p.properties) {
          const o = this.owners[idx];
          if (o.houses >= 1 && o.houses <= 4) total += o.houses * action.house;
          if (o.houses === 5) total += action.hotel;
        }
        p.money -= total;
        break;
      }
      case 'add_betiv': {
        if (action.betivType === 'simplu') this.betiviExtrasi.simplu++;
        if (action.betivType === 'dinsus') this.betiviExtrasi.dinsus++;
        this.addLog(`Contor bețivi: ${this.betiviExtrasi.simplu} simpli, ${this.betiviExtrasi.dinsus} dinsus.`);
        break;
      }
      case 'pay_for_betivs': {
        const total = this.betiviExtrasi.simplu * 50 + this.betiviExtrasi.dinsus * 75;
        if (total > 0) {
          p.money -= total;
          this.addLog(`${p.name} plătește M${total} pentru bețivii scoși din pachet.`);
        }
        break;
      }
      case 'pay_for_betivs_to_bank': {
        const total = this.betiviExtrasi.simplu * 50 + this.betiviExtrasi.dinsus * 75;
        if (total > 0) {
          p.money -= total;
          this.addLog(`${p.name} plătește la bancă M${total} pentru bețivii scoși din pachet.`);
        }
        break;
      }
      case 'add_pet_card': {
        p.petCards++;
        this.addLog(`${p.name} are acum ${p.petCards} cărți de peturi.`);

        // Dacă are 2 cărți, primește automat 150M și le pierde pe amândouă
        if (p.petCards >= 2) {
          p.money += 150;
          p.petCards -= 2;
          this.addLog(`🎉 ${p.name} a strâns 2 cărți de peturi și primește M150!`);
        }
        break;
      }
      case 'steal_pet_cards': {
        const stolen = p.petCards;
        p.petCards = 0;
        this.addLog(`${p.name} și-a pierdut ${stolen} cărți de peturi (i le-a furat Vandam!).`);
        break;
      }
      case 'handicap_bonus': {
        const handicapped = this.players.filter(pl => pl.handicap && !pl.bankrupt);
        if (handicapped.length >= 2) {
          for (const h of handicapped) {
            h.money += 50;
            this.addLog(`${h.name} primește M50 (pachet comun la Sighet).`);
          }
        } else {
          p.money += 150;
          this.addLog(`${p.name} primește M150 (nu sunt destui handicapați în joc).`);
        }
        break;
      }
    }
    this.checkBankrupt(p);
  }

  transferMoney(from, to, amount) {
    from.money -= amount;
    if (to) to.money += amount;
  }

  buyProperty(playerId) {
    if (!this.pendingAction || this.pendingAction.type !== 'awaiting_buy') return { error: 'Nimic de cumpărat.' };
    const p = this.players.find(pl => pl.id === playerId);
    if (p.id !== this.pendingAction.playerId) return { error: 'Nu e rândul tău.' };
    const idx = this.pendingAction.tileIndex;
    const t = BOARD[idx];
    if (p.money < t.price) return { error: 'Nu ai destui bani.' };
    p.money -= t.price;
    p.properties.push(idx);
    this.owners[idx] = { playerId: p.id, houses: 0, mortgaged: false, claimBonus: false };
    this.addLog(`${p.name} cumpără ${t.name} pentru M${t.price}.`);

    if (t.properNoun) {
      // Proprietate cu nume propriu — întrebăm "ești neam cu X?" înainte de a continua tura.
      this.pendingAction = {
        type: 'claim_question', subject: 'property', tileIndex: idx,
        properNoun: t.properNoun, playerId: p.id,
      };
    } else {
      this.pendingAction = null;
    }
    return { ok: true };
  }

  declineBuy(playerId) {
    if (!this.pendingAction || this.pendingAction.type !== 'awaiting_buy') return { error: 'Nimic de refuzat.' };
    if (playerId !== this.pendingAction.playerId) return { error: 'Nu e rândul tău.' };
    this.addLog(`${this.currentPlayer().name} refuză să cumpere ${BOARD[this.pendingAction.tileIndex].name}.`);
    this.pendingAction = null;
    return { ok: true };
  }

  buildHouse(playerId, tileIndex) {
    const p = this.players.find(pl => pl.id === playerId);
    const t = BOARD[tileIndex];
    const o = this.owners[tileIndex];
    if (!o || o.playerId !== playerId) return { error: 'Nu deții proprietatea.' };
    if (t.type !== 'street') return { error: 'Doar pe străzi.' };
    if (!this.countGroupOwned(t.color, playerId)) return { error: 'Nu deții tot setul de culoare.' };
    if (o.houses >= 5) return { error: 'Deja are hotel.' };
    const groupIndices = BOARD.map((tt, i) => (tt.type === 'street' && tt.color === t.color) ? i : -1).filter(i => i >= 0);
    const minHouses = Math.min(...groupIndices.map(i => this.owners[i].houses));
    if (o.houses > minHouses) return { error: 'Trebuie construit egal pe tot setul.' };
    if (p.money < t.houseCost) return { error: 'Nu ai destui bani.' };
    p.money -= t.houseCost;
    o.houses++;
    this.addLog(`${p.name} construiește pe ${t.name} (acum ${o.houses === 5 ? 'hotel' : o.houses + ' case'}).`);
    return { ok: true };
  }

  sellHouse(playerId, tileIndex) {
    const p = this.players.find(pl => pl.id === playerId);
    const t = BOARD[tileIndex];
    const o = this.owners[tileIndex];
    if (!o || o.playerId !== playerId) return { error: 'Nu deții proprietatea.' };
    if (o.houses <= 0) return { error: 'Nimic de vândut.' };
    const groupIndices = BOARD.map((tt, i) => (tt.type === 'street' && tt.color === t.color) ? i : -1).filter(i => i >= 0);
    const maxHouses = Math.max(...groupIndices.map(i => this.owners[i].houses));
    if (o.houses < maxHouses) return { error: 'Trebuie vândut egal pe tot setul.' };
    o.houses--;
    p.money += Math.floor(t.houseCost / 2);
    this.addLog(`${p.name} vinde o casă de pe ${t.name}.`);
    return { ok: true };
  }

  toggleMortgage(playerId, tileIndex) {
    const p = this.players.find(pl => pl.id === playerId);
    const t = BOARD[tileIndex];
    const o = this.owners[tileIndex];
    if (!o || o.playerId !== playerId) return { error: 'Nu deții proprietatea.' };
    if (!o.mortgaged) {
      if (o.houses > 0) return { error: 'Vinde casele mai întâi.' };
      o.mortgaged = true;
      p.money += t.mortgage;
      this.addLog(`${p.name} ipotechează ${t.name}.`);
    } else {
      const cost = Math.ceil(t.mortgage * 1.1);
      if (p.money < cost) return { error: 'Nu ai destui bani pentru a scoate din ipotecă.' };
      p.money -= cost;
      o.mortgaged = false;
      this.addLog(`${p.name} scoate din ipotecă ${t.name}.`);
    }
    return { ok: true };
  }

  checkBankrupt(p) {
    if (p.money < 0 && !p.bankrupt) {
      const liquidatable = p.properties.reduce((sum, idx) => {
        const o = this.owners[idx]; const t = BOARD[idx];
        return sum + (o.mortgaged ? 0 : t.mortgage) + (o.houses > 0 ? o.houses * Math.floor(t.houseCost / 2) : 0);
      }, 0);
      if (p.money + liquidatable < 0) {
        p.bankrupt = true;
        this.addLog(`${p.name} a dat faliment!`);
        for (const idx of p.properties) delete this.owners[idx];
        p.properties = [];
        const remaining = this.players.filter(pl => !pl.bankrupt);
        if (remaining.length === 1) {
          this.addLog(`${remaining[0].name} a câștigat jocul!`);
          this.winner = remaining[0].id;
        }
      }
    }
  }

  payToGetOutOfJail(playerId) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p.inJail) return { error: 'Nu ești în pușcărie.' };
    if (p.getOutOfJailFree > 0) {
      p.getOutOfJailFree--;
      p.inJail = false; p.jailTurns = 0;
      this.addLog(`${p.name} folosește o cartelă "ieșire liberă din pușcărie".`);
    } else {
      if (p.money < 50) return { error: 'Nu ai destui bani.' };
      p.money -= 50;
      p.inJail = false; p.jailTurns = 0;
      this.addLog(`${p.name} plătește M50 și iese din pușcărie.`);
    }
    return { ok: true };
  }

  takeHandicap(playerId) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p.inJail) return { error: 'Nu ești în pușcărie.' };
    if (p.handicap) return { error: 'Ai deja certificat de handicap. Trebuie să plătești sau să dai dublă.' };

    p.handicap = true;
    p.inJail = false;
    p.jailTurns = 0;
    this.addLog(`♿ ${p.name} a ales să iasă din pușcărie obținând un Certificat de Handicap pe viață!`);
    return { ok: true };
  }

  useHandicapCard(playerId) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p.inJail) return { error: 'Nu ești în pușcărie.' };
    if (p.getOutOfJailFree <= 0) return { error: 'Nu ai cartea asta.' };

    // Folosește cartea care oferă handicap
    p.getOutOfJailFree--;
    p.handicap = true;
    p.inJail = false;
    p.jailTurns = 0;
    p.money -= 100;
    this.addLog(`${p.name} folosește cartea de handicap, plătește M100 și este liber!`);
    return { ok: true };
  }

  // --- Mecanica "Ești neam cu X?" ---

  answerClaim(playerId, related, reason) {
    const a = this.pendingAction;
    if (!a || a.type !== 'claim_question' || a.playerId !== playerId) return { error: 'Nimic de răspuns.' };
    const p = this.players.find(pl => pl.id === playerId);

    if (!related) {
      this.addLog(`${p.name} spune că NU e neam cu ${a.properNoun}.`);
      this.resolveClaim(a, false);
      return { ok: true };
    }

    if (!reason || !reason.trim()) return { error: 'Trebuie să scrii un motiv.' };
    const cleanReason = reason.trim().slice(0, 300);
    this.addLog(`${p.name} zice că E neam cu ${a.properNoun}: "${cleanReason}"`);

    const voters = this.players.filter(pl => pl.id !== playerId && !pl.bankrupt).map(pl => pl.id);
    if (voters.length === 0) {
      // Nimeni altcineva să voteze — se acceptă implicit pe cuvânt.
      this.resolveClaim(a, true);
      return { ok: true };
    }
    this.pendingAction = { ...a, type: 'claim_vote', reason: cleanReason, votes: {}, voters };
    return { ok: true };
  }

  voteClaim(voterId, believe) {
    const a = this.pendingAction;
    if (!a || a.type !== 'claim_vote') return { error: 'Nu există niciun vot activ.' };
    if (!a.voters.includes(voterId)) return { error: 'Nu poți vota la acest claim.' };
    if (a.votes[voterId] !== undefined) return { error: 'Ai votat deja.' };
    a.votes[voterId] = !!believe;

    if (Object.keys(a.votes).length >= a.voters.length) {
      const yes = Object.values(a.votes).filter(v => v).length;
      const no = Object.values(a.votes).length - yes;
      const confirmed = yes > no; // egalitate = neconfirmat
      this.addLog(`Vot încheiat: ${yes} cred povestea, ${no} nu o cred. ${confirmed ? '✅ CONFIRMAT' : '❌ RESPINS'}.`);
      this.resolveClaim(a, confirmed);
    }
    return { ok: true };
  }

  resolveClaim(a, confirmed) {
    const p = this.players.find(pl => pl.id === a.playerId);
    if (a.subject === 'property') {
      if (confirmed) {
        this.owners[a.tileIndex].claimBonus = true;
        this.addLog(`🏠 ${p.name} primește chirie DUBLĂ pe ${BOARD[a.tileIndex].name} (neam cu ${a.properNoun}).`);
      }
      this.pendingAction = null;
    } else if (a.subject === 'card') {
      let action = a.cardAction;
      const paysMoney = action && typeof action.type === 'string' && action.type.startsWith('pay_');
      if (confirmed && paysMoney) {
        action = { ...action };
        if (typeof action.amount === 'number') action.amount *= 2;
        if (typeof action.house === 'number') action.house *= 2;
        if (typeof action.hotel === 'number') action.hotel *= 2;
        this.addLog(`💸 ${p.name} plătește DUBLU fiindcă e neam cu ${a.properNoun}.`);
      }
      this.pendingAction = null;
      this.applyCardAction(p, action);
    } else {
      this.pendingAction = null;
    }
    this.checkBankrupt(p);
  }

  respondHandicapOffer(playerId, accept) {
    const a = this.pendingAction;
    if (!a || a.type !== 'handicap_offer' || a.playerId !== playerId) return { error: 'Nimic de răspuns.' };
    const p = this.players.find(pl => pl.id === playerId);
    if (accept) {
      if (p.money < a.cost) return { error: 'Nu ai destui bani.' };
      p.money -= a.cost;
      p.handicap = true;
      p.inJail = false;
      p.jailTurns = 0;
      this.addLog(`♿ ${p.name} acceptă certificatul de handicap, plătește M${a.cost} și e liber!`);
    } else {
      this.addLog(`${p.name} refuză certificatul de handicap și rămâne în pușcărie.`);
    }
    this.pendingAction = null;
    this.checkBankrupt(p);
    return { ok: true };
  }

  state() {
    return {
      roomCode: this.roomCode,
      started: this.started,
      players: this.players,
      owners: this.owners,
      turnIndex: this.turnIndex,
      pendingAction: this.pendingAction,
      freeParkingPot: this.freeParkingPot,
      lastDice: this.lastDice,
      log: this.log.slice(-30),
      winner: this.winner || null,
      board: BOARD,
      lastDrawnCard: this.lastDrawnCard || null,
      betiviExtrasi: this.betiviExtrasi,
    };
  }
}

module.exports = { Game, BOARD, CHANCE, CHEST };
const assert = require('node:assert/strict');
const { test } = require('node:test');

function load(config = {}) {
  const hooks = new Map();
  const commands = new Map();
  require('../plugins/commands/FreeShops.plugin').register({
    core: { PlayerRights: { OWNER: 3 } },
    getPluginConfig: (key, fallback) => (key in config ? config[key] : fallback),
    onCustomEvent: (name, handler) => hooks.set(name, handler),
    registerCommand: (name, handler, rights) => commands.set(name, { handler, rights }),
  });
  return { hooks, commands };
}

function player() {
  const attributes = new Map();
  const messages = [];
  return {
    messages,
    getAttribute: (key) => attributes.get(key),
    setAttribute: (key, value) => attributes.set(key, value),
    sendMessage: (text) => messages.push(text),
  };
}

test('::freeshops is owner-only and toggles free buying with no selling back', () => {
  const { hooks, commands } = load();
  assert.equal(commands.get('freeshops').rights, 3);
  const owner = player();
  const other = player();
  const price = (who) => { const r = { player: who, currency: 'TOKKUL', price: 750 }; hooks.get('shop:buy-price')(r); return r.price; };
  const sellable = (who) => { const r = { player: who, sellable: true }; hooks.get('shop:can-sell')(r); return r.sellable; };

  assert.equal(price(owner), 750);
  commands.get('freeshops').handler({ player: owner });
  assert.equal(price(owner), 0);
  assert.equal(sellable(owner), false);
  assert.equal(price(other), 750, 'other players still pay');
  assert.equal(sellable(other), true);

  commands.get('freeshops').handler({ player: owner });
  assert.equal(price(owner), 750);
  assert.equal(sellable(owner), true);
});

test('FreeShops:everyone makes shops free for every player', () => {
  const { hooks } = load({ 'FreeShops:everyone': true });
  const request = { player: player(), currency: 'COINS', price: 100 };
  hooks.get('shop:buy-price')(request);
  assert.equal(request.price, 0);
  const sale = { player: null, price: 40 };
  hooks.get('shop:sell-price')(sale);
  assert.equal(sale.price, 40, 'a price asked with no player is left alone');
});

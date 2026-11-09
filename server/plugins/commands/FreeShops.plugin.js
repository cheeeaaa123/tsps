/**
 * Free shops: everything a shop sells costs nothing, whatever its currency (coins, tokkul ...).
 * Shop stock still limits what can be bought. While shops are free they buy nothing back, so
 * free items can't be sold on for currency.
 *
 * - `::freeshops` (owner and up) toggles it for the player who runs it, until they log out.
 * - world.json `"pluginConfig": { "FreeShops:everyone": true }` makes it apply to every player.
 */
const ENABLED_ATTRIBUTE = "free-shops:enabled";
const EVERYONE_CONFIG = "FreeShops:everyone";

let api;

function appliesTo(player) {
  if (!player) return false;
  return api.getPluginConfig(EVERYONE_CONFIG, false) === true || player.getAttribute(ENABLED_ATTRIBUTE) === true;
}

function free(request) {
  if (appliesTo(request.player)) request.price = 0;
}

function refuseSale(request) {
  if (appliesTo(request.player)) request.sellable = false;
}

function noSellPrice(request) {
  if (appliesTo(request.player)) request.price = 0;
}

function toggle({ player }) {
  if (api.getPluginConfig(EVERYONE_CONFIG, false) === true) {
    player.sendMessage("Shops are free for everyone on this world (world.json FreeShops:everyone).");
    return true;
  }
  const enabled = player.getAttribute(ENABLED_ATTRIBUTE) !== true;
  player.setAttribute(ENABLED_ATTRIBUTE, enabled);
  player.sendMessage(enabled
    ? "Shops are now free for you. They won't buy items from you while this is on."
    : "Shops charge you their normal prices again.");
  return true;
}

module.exports = {
  name: "FreeShops",
  register(pluginApi) {
    api = pluginApi;
    api.onCustomEvent("shop:buy-price", free);
    api.onCustomEvent("shop:can-sell", refuseSale);
    api.onCustomEvent("shop:sell-price", noSellPrice);
    api.registerCommand("freeshops", toggle, api.core.PlayerRights.OWNER, "Toggle free shops for yourself");
  },
};

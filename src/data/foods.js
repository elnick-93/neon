// ─── Food Catalogue ───────────────────────────────────────────────────────────
// `hunger` / `happiness`: stat points restored
// `careBonus`: bonus added to careScore when fed
// `category`: 'basic' (always available) | 'gourmet' (rare pack) | 'special'
// `cooldownMs`: how soon you can feed this item again

export const FOODS = {
  kibble: {
    id: 'kibble',
    name: 'Kibble',
    emoji: '🍪',
    hunger: 20,
    happiness: 2,
    careBonus: 0.5,
    category: 'basic',
    cooldownMs: 0,
    description: 'Standard daily meal. Always available.',
    color: 0xD4A855,
  },
  berry: {
    id: 'berry',
    name: 'Lumi Berry',
    emoji: '🫐',
    hunger: 30,
    happiness: 8,
    careBonus: 1,
    category: 'basic',
    cooldownMs: 3600000,  // 1 hour cooldown
    description: 'Sweet and nutritious. Restores more hunger.',
    color: 0x7B61D4,
  },
  cake: {
    id: 'cake',
    name: 'Star Cake',
    emoji: '🎂',
    hunger: 15,
    happiness: 25,
    careBonus: 1.5,
    category: 'basic',
    cooldownMs: 7200000,  // 2 hour cooldown
    description: 'A treat! Big happiness boost but little nutrition.',
    color: 0xF9A8D4,
  },
  soup: {
    id: 'soup',
    name: 'Glow Soup',
    emoji: '🍜',
    hunger: 45,
    happiness: 10,
    careBonus: 2,
    category: 'gourmet',
    cooldownMs: 0,
    description: 'Warm and filling. High nutrition.',
    color: 0xFFD97D,
  },
  honey: {
    id: 'honey',
    name: 'Moon Honey',
    emoji: '🍯',
    hunger: 35,
    happiness: 30,
    careBonus: 3,
    category: 'gourmet',
    cooldownMs: 0,
    description: 'Rare honey that boosts both hunger and happiness.',
    color: 0xFBBF24,
  },
  crystal_apple: {
    id: 'crystal_apple',
    name: 'Crystal Apple',
    emoji: '🍎',
    hunger: 60,
    happiness: 40,
    careBonus: 5,
    health: 15,  // also restores health
    category: 'gourmet',
    cooldownMs: 0,
    description: 'Legendary food. Restores health too.',
    color: 0x4ADE80,
  },
};

export const FOOD_IDS = Object.keys(FOODS);
export const BASIC_FOODS  = FOOD_IDS.filter(id => FOODS[id].category === 'basic');
export const GOURMET_FOODS = FOOD_IDS.filter(id => FOODS[id].category === 'gourmet');

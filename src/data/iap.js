import { IAP_PRODUCTS } from '../constants.js';

// Product catalogue — IDs must match App Store Connect & Google Play Console exactly
export const IAP_CATALOGUE = [
  {
    id: IAP_PRODUCTS.BASE_GAME,
    name: 'Neon Block Raid',
    price: '$0.99',
    type: 'one_time',
    entitlement: 'base_game',
    description: 'Unlock the full game.',
  },
  {
    id: IAP_PRODUCTS.RAIDER_PASS,
    name: 'Raider Pass',
    price: '$2.99/mo',
    type: 'subscription',
    period: 'monthly',
    entitlement: 'raider_pass',
    description: 'Monthly pass: exclusive skins, weekly bonus boosters, gold board frame.',
  },
  {
    id: IAP_PRODUCTS.SKIN_NEON_CITY,
    name: 'Neon City Skin',
    price: '$1.99',
    type: 'one_time',
    entitlement: 'skin_neon_city',
    description: 'Neon City board theme with animated skyline border.',
  },
  {
    id: IAP_PRODUCTS.SKIN_CYBER,
    name: 'Cyber Grid Skin',
    price: '$1.99',
    type: 'one_time',
    entitlement: 'skin_cyber',
    description: 'Cyber Grid board theme with pulsing data-stream effects.',
  },
  {
    id: IAP_PRODUCTS.BOOST_SHUFFLE,
    name: 'Shuffle Pack ×3',
    price: '$0.99',
    type: 'consumable',
    qty: 3,
    consumableKey: 'shuffle',
    description: 'Refresh your piece queue 3 times mid-run.',
  },
  {
    id: IAP_PRODUCTS.BOOST_SKIP,
    name: 'Floor Skip',
    price: '$1.99',
    type: 'consumable',
    qty: 1,
    consumableKey: 'skip',
    description: 'Skip the current floor\'s clear target instantly.',
  },
  {
    id: IAP_PRODUCTS.BOOST_REVIVE,
    name: 'Cheat Death Token',
    price: '$0.99',
    type: 'consumable',
    qty: 1,
    consumableKey: 'revive',
    description: 'Revive once per run at 1 HP when you would die.',
  },
  {
    id: IAP_PRODUCTS.BUNDLE_STARTER,
    name: 'Starter Bundle',
    price: '$3.99',
    type: 'one_time',
    entitlement: 'bundle_starter',
    description: 'Neon City Skin + 3 Shuffles + 2 Revive Tokens. Best value!',
  },
];

export const IAP_BY_ID = Object.fromEntries(IAP_CATALOGUE.map(p => [p.id, p]));

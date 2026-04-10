import { IAP_PRODUCTS } from '../constants.js';

export const IAP_CATALOGUE = [
  {
    id: IAP_PRODUCTS.BASE_GAME,
    name: 'Lumipet',
    price: '$0.99',
    type: 'one_time',
    entitlement: 'base_game',
    description: 'Unlock your companion. One-time purchase, no ads, ever.',
  },
  {
    id: IAP_PRODUCTS.PET_HOTEL,
    name: 'Pet Hotel',
    price: '$1.99/mo',
    type: 'subscription',
    period: 'monthly',
    entitlement: 'pet_hotel',
    description: 'Your pet stays happy while you\'re away. Pauses stat decay.',
  },
  {
    id: IAP_PRODUCTS.EXTRA_PET_SLOT,
    name: 'Extra Pet Slot',
    price: '$1.99',
    type: 'one_time',
    entitlement: 'extra_slot',
    description: 'Raise a second Lumipet simultaneously.',
  },
  {
    id: IAP_PRODUCTS.GOURMET_PACK,
    name: 'Gourmet Pack',
    price: '$0.99',
    type: 'consumable',
    consumableKey: 'gourmet_food',
    qty: 10,
    description: '10 rare food items: Glow Soup, Moon Honey, Crystal Apples.',
  },
  {
    id: IAP_PRODUCTS.ACC_BUNDLE_1,
    name: 'Sky Garden Bundle',
    price: '$2.99',
    type: 'one_time',
    entitlement: 'bundle_acc_1',
    description: '5 accessories: Flower Crown, Star Hat, Moon Tiara, Heart Aura, Star Garden bg.',
  },
  {
    id: IAP_PRODUCTS.REVIVAL_CRYSTAL,
    name: 'Revival Crystal',
    price: '$0.99',
    type: 'consumable',
    consumableKey: 'revival',
    qty: 1,
    description: 'Revive your Lumipet once. Brings them back with full stats.',
  },
];

export const IAP_BY_ID = Object.fromEntries(IAP_CATALOGUE.map(p => [p.id, p]));

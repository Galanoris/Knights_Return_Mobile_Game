export interface ShopItem {
  name: string;
  upgradeKey: string;
  maxTier: number;
  prices: number[]; // price per tier (index = current tier before buying)
}

export const SHOP_ITEMS: ShopItem[] = [
  { name: 'Sword Speed',     upgradeKey: 'swordSpeed',    maxTier: 3, prices: [30, 60, 100] },
  { name: '+1 Heart',        upgradeKey: 'maxHearts',     maxTier: 2, prices: [50, 80] },   // 3→4→5
  { name: 'Arrow Capacity',  upgradeKey: 'arrowCapacity', maxTier: 3, prices: [20, 40, 60] },
];

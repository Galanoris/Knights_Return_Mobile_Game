import Phaser from 'phaser';
import { relayoutOnResize } from '../systems/ViewportFit';
import { SaveManager } from '../systems/SaveManager';
import { SHOP_ITEMS } from '../data/shop';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    relayoutOnResize(this); // centred layout: rebuild if the screen's shape changes
    const cx = this.scale.width / 2;
    const save = SaveManager.get();

    this.add.text(cx, 20, 'BLACKSMITH', { fontSize: '12px', color: '#ffdd00', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(cx, 35, `COINS: ${save.coins}`, { fontSize: '9px', color: '#ffdd00', fontFamily: 'monospace' }).setOrigin(0.5);

    SHOP_ITEMS.forEach((item, i) => {
      const y = 55 + i * 22;
      const upgrades = SaveManager.get().upgrades;
      const currentTier = upgrades[item.upgradeKey as keyof typeof upgrades] as number;
      const maxed = typeof currentTier === 'number' && currentTier >= item.maxTier;
      const label = maxed ? `${item.name}: MAXED` : `${item.name}: ${item.prices[currentTier as number]} coins`;
      const color = maxed ? '#666666' : '#ffffff';

      const btn = this.add.text(cx, y, `[ ${label} ]`, {
        fontSize: '8px', color, fontFamily: 'monospace',
      }).setOrigin(0.5);

      if (!maxed) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerup', () => this.purchase(item, currentTier as number));
      }
    });

    const done = this.add.text(cx, this.scale.height - 20, '[ CONTINUE ]', {
      fontSize: '9px', color: '#aaffaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    done.on('pointerup', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }

  private purchase(item: typeof SHOP_ITEMS[0], currentTier: number): void {
    const save = SaveManager.get();
    const price = item.prices[currentTier];
    if (save.coins < price) return;

    const newUpgrades = { ...save.upgrades };
    (newUpgrades as Record<string, number | boolean>)[item.upgradeKey] = currentTier + 1;
    SaveManager.save({ upgrades: newUpgrades, coins: save.coins - price });
    this.scene.restart();
  }
}

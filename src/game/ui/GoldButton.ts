import Phaser from 'phaser';

const CHALK_FONT = '"League Spartan", "Patrick Hand", sans-serif';

export interface GoldButtonConfig {
  scene: Phaser.Scene;
  /** Left edge X */
  x: number;
  /** Centre Y */
  y: number;
  width: number;
  height: number;
  label: string;
  /** Base depth for the container (default 0) */
  depth?: number;
  onClick: () => void;
}

/**
 * Draws a shiny gold gradient capsule button entirely with Phaser Graphics.
 * No external image required.
 *
 * Returns the Container so the caller can push it into a tracked array and
 * call destroy() when clearing the scene.
 */
export function createGoldButton(cfg: GoldButtonConfig): Phaser.GameObjects.Container {
  const { scene, x, y, width: w, height: h, label, depth = 0, onClick } = cfg;

  const cx = x + w / 2;
  const cy = y;
  const hw = w / 2;
  const hh = h / 2;
  const r  = hh;

  const container = scene.add.container(cx, cy).setDepth(depth);

  // Drop shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x1a0a00, 0.45);
  shadow.fillRoundedRect(-hw + 2, -hh + 5, w, h, r);
  container.add(shadow);

  // Main body — vertical gold gradient
  const body = scene.add.graphics();
  body.fillGradientStyle(0xf5d458, 0xf5d458, 0x9a6b08, 0x9a6b08, 1);
  body.fillRoundedRect(-hw, -hh, w, h, r);
  body.lineStyle(2, 0x5c3d08, 0.9);
  body.strokeRoundedRect(-hw, -hh, w, h, r);
  container.add(body);

  // Top highlight streak
  const hlH = Math.floor(h * 0.38);
  const hl  = scene.add.graphics();
  hl.fillStyle(0xfffae0, 0.48);
  hl.fillRoundedRect(-hw + 8, -hh + 5, w - 16, hlH, hlH / 2);
  container.add(hl);

  // Label
  const fontSize = Math.max(14, Math.floor(h * 0.40));
  const txt = scene.add.text(0, 0, label, {
    fontSize: `${fontSize}px`,
    color: '#1a0800',
    fontFamily: CHALK_FONT,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(txt);

  // Interactivity
  container.setSize(w, h).setInteractive({ useHandCursor: true });

  container.on('pointerover', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1.04, scaleY: 1.04,
      duration: 80, ease: 'Sine.easeOut',
    });
  });

  container.on('pointerout', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      duration: 80, ease: 'Sine.easeOut',
    });
  });

  container.on('pointerdown', () => {
    container.disableInteractive();
    scene.tweens.add({
      targets: container,
      scaleX: 0.95, scaleY: 0.95,
      duration: 60, yoyo: true, ease: 'Sine.easeIn',
      onComplete: onClick,
    });
  });

  return container;
}

export interface GoldBadgeConfig {
  scene: Phaser.Scene;
  /** Centre X */
  cx: number;
  /** Centre Y */
  cy: number;
  width: number;
  height: number;
  label: string;
  depth?: number;
}

/**
 * Non-interactive decorative gold pill badge (used for scene title labels).
 * Returns the Container for depth management / cleanup.
 */
export function createGoldBadge(cfg: GoldBadgeConfig): Phaser.GameObjects.Container {
  const { scene, cx, cy, width: w, height: h, label, depth = 0 } = cfg;
  const hw = w / 2;
  const hh = h / 2;
  const r  = hh;

  const container = scene.add.container(cx, cy).setDepth(depth);

  const body = scene.add.graphics();
  body.fillGradientStyle(0xf0cc44, 0xf0cc44, 0x8a5e06, 0x8a5e06, 1);
  body.fillRoundedRect(-hw, -hh, w, h, r);
  body.lineStyle(2, 0x4a2e04, 0.8);
  body.strokeRoundedRect(-hw, -hh, w, h, r);
  container.add(body);

  const hlH = Math.floor(h * 0.38);
  const hl  = scene.add.graphics();
  hl.fillStyle(0xfffae0, 0.40);
  hl.fillRoundedRect(-hw + 6, -hh + 4, w - 12, hlH, hlH / 2);
  container.add(hl);

  const fontSize = Math.max(13, Math.floor(h * 0.38));
  const txt = scene.add.text(0, 0, label, {
    fontSize: `${fontSize}px`,
    color: '#1a0800',
    fontFamily: CHALK_FONT,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(txt);

  return container;
}

import Phaser from 'phaser';
import type { SceneData } from '../../types';
import GameManager from '../GameManager';

type RiskLevel = 'low' | 'mid' | 'high';

interface ChoiceOption {
  label: string;
  choiceKey: string;
  riskLevel: RiskLevel;
}

interface DecisionNode {
  id: string;
  situationText: string;
  choices: ChoiceOption[];
}

const SCENE_INTRO_LINES = [
  'You have a 9 AM lecture and a lab report due Thursday.',
  "It's past midnight. You meant to be asleep an hour ago.",
  'Your phone is on your desk.',
  'The room is lit by your laptop screen.',
];

const INTRO_WORD_FADE_MS = 400;
const INTRO_WORD_STAGGER_MS = 100;
const INTRO_ROW_PAUSE_MS = 350;
const INTRO_SENTENCE_GAP = 12;
const BGM_VOLUME = 0.3;
const START_PULSE_Y_OFFSET = 10;
const START_PULSE_MS = 550;

interface WoodButtonParts {
  img: Phaser.GameObjects.Image;
  txt: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

// A choices: low risk (+3%), B choices: mid risk (-7%), C choices: high risk (-15%)
const ENERGY_DELTAS: Record<RiskLevel, number> = {
  low: 3,
  mid: -7,
  high: -15,
};

const NODES: DecisionNode[] = [
  {
    id: 'D1',
    situationText:
      'You decide to sleep. But now you need to actually wind down. ' +
      'What do you do in the next 20 minutes before closing your eyes?',
    choices: [
      {
        label: 'Put the phone in the drawer, turn off the laptop, try deep breathing.',
        choiceKey: 'NO_SCREEN',
        riskLevel: 'low',
      },
      {
        label: "Watch one more episode on your laptop. Just one. You'll feel more relaxed.",
        choiceKey: 'ONE_EPISODE',
        riskLevel: 'mid',
      },
      {
        label: 'Take the phone to bed and scroll until you naturally drift off.',
        choiceKey: 'SCROLL_BED',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D2',
    situationText:
      "You're in bed, lights off. But your mind starts running. " +
      "You remember you didn't reply to your lab partner about Thursday's division of work.\n\n" +
      'Your mind races. The unsent message hangs over you.',
    choices: [
      {
        label: 'Remind yourself it can wait until morning. Do box breathing. Sleep.',
        choiceKey: 'LET_GO',
        riskLevel: 'low',
      },
      {
        label: 'Pick up the phone, send a quick message, put it back face-down.',
        choiceKey: 'QUICK_CHECK',
        riskLevel: 'mid',
      },
      {
        label: 'Lie there running through everything that could go wrong with the report for 45 minutes.',
        choiceKey: 'WORRY_SPIRAL',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D3',
    situationText:
      "Your alarm rings. Energy bar: 35%. It's 8:10 AM. " +
      'You have 50 minutes to get ready and reach the lecture hall.\n\n' +
      "The alarm cuts through the darkness. You're exhausted but the day has started.",
    choices: [
      {
        label: 'Get up immediately. Splash water, grab your bag, go.',
        choiceKey: 'UP_FIRST',
        riskLevel: 'low',
      },
      {
        label: 'Snooze once (9 mins). Then up without checking your phone.',
        choiceKey: 'SNOOZE_ONCE',
        riskLevel: 'mid',
      },
      {
        label: 'Snooze three times. Rush out in a panic with no breakfast, almost late.',
        choiceKey: 'SNOOZE_MANY',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D4',
    situationText:
      'Walking to class, half-asleep. Your groupmate Haziq sends a voice note at 8:42 AM ' +
      "complaining that you didn't reply last night about the lab division. He sounds annoyed.\n\n" +
      "Your phone buzzes. Haziq's voice note plays. He's clearly frustrated.",
    choices: [
      {
        label: "Sorry for the late reply — let's sort it out now. What do you need from me?",
        choiceKey: 'CALM_REPLY',
        riskLevel: 'low',
      },
      {
        label: "Send a thumbs up and 'I'll text you after lecture.' Leave it at that.",
        choiceKey: 'SHORT_REPLY',
        riskLevel: 'mid',
      },
      {
        label: 'Send an angry voice note back about being tired and how he should have messaged earlier.',
        choiceKey: 'ANGRY_VOICE',
        riskLevel: 'high',
      },
    ],
  },
];

const CHALK_FONT = '"League Spartan", "Patrick Hand", sans-serif';
const DARK_BROWN = '#1a1008';
const PARCHMENT = 0xe8dcc8;
const CHOICE_BLUE = 0x2a4a7a;
const BACKGROUND_COUNT = 5;
const INTRO_BG_INDEX = 0;

function nodeBackgroundIndex(nodeIndex: number): number {
  return nodeIndex + 1;
}
const WOOD_BUTTON_KEY = 'wood-button';
const UI_DEPTH = 10;

function backgroundKey(index: number): string {
  return `sleep-bg-${index + 1}`;
}

function backgroundPath(index: number): string {
  return `/assets/backgrounds/sleep_decision_${index + 1}.png`;
}

export default class SleepDecisionsScene extends Phaser.Scene {
  private currentNodeIndex: number = 0;
  private nodeStartTime: number = 0;
  private currentNodeId: string = '';
  private nodeObjects: Phaser.GameObjects.GameObject[] = [];
  private backgroundImage?: Phaser.GameObjects.Image;
  private bgm?: Phaser.Sound.BaseSound;
  private startButtonPulseTargets: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'SleepDecisions' });
  }

  init(_data: Partial<SceneData>): void {
    this.currentNodeIndex = 0;
    this.nodeStartTime = 0;
    this.currentNodeId = '';
    this.nodeObjects = [];
    this.backgroundImage = undefined;
    this.stopBgm();
  }

  preload(): void {
    for (let i = 0; i < BACKGROUND_COUNT; i += 1) {
      this.load.image(backgroundKey(i), backgroundPath(i));
    }
    this.load.image(WOOD_BUTTON_KEY, '/assets/ui/button/wood_button.png');
    this.load.audio('btn-hover', '/assets/audio/hover.wav');
    this.load.audio('btn-click', '/assets/audio/click.wav');
    this.load.audio('clock-tick', '/assets/audio/clock-tick.wav');
  }

  create(): void {
    this.events.once('shutdown', this.stopBgm, this);
    this.startBgm();
    this.setBackground(INTRO_BG_INDEX);
    this.drawSceneBadge();
    this.drawBackButton();
    this.showSceneIntro();
  }

  private startBgm(): void {
    if (!this.cache.audio.exists('clock-tick')) return;
    this.bgm = this.sound.add('clock-tick', { loop: true, volume: BGM_VOLUME });
    this.bgm.play();
  }

  private stopBgm(): void {
    if (this.bgm?.isPlaying) {
      this.bgm.stop();
    }
    this.bgm = undefined;
  }

  private setBackground(nodeIndex: number): void {
    const { width: W, height: H } = this.scale;
    const key = backgroundKey(nodeIndex);

    if (this.backgroundImage) {
      this.backgroundImage.setTexture(key);
      this.fitBackgroundToScreen(this.backgroundImage, W, H);
      return;
    }

    this.backgroundImage = this.add.image(W / 2, H / 2, key);
    this.backgroundImage.setDepth(-10);
    this.fitBackgroundToScreen(this.backgroundImage, W, H);
  }

  private fitBackgroundToScreen(
    image: Phaser.GameObjects.Image,
    width: number,
    height: number,
  ): void {
    image.setPosition(width / 2, height / 2);
    image.setScale(Math.max(width / image.width, height / image.height));
  }

  private drawSceneBadge(): void {
    const cx = this.scale.width / 2;
    const cy = 52;
    const badge = this.add.image(cx, cy, WOOD_BUTTON_KEY);
    badge.setDisplaySize(260, 72);
    badge.setDepth(UI_DEPTH);

    this.add.text(cx, cy, 'Sleep Decisions', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1).disableInteractive();
  }

  private drawBackButton(): void {
    const margin = 24;
    const btnW = 120;
    const btnH = 52;
    const y = 52 - btnH / 2;
    this.drawWoodButton(
      margin,
      y,
      btnW,
      btnH,
      'Back',
      () => this.game.events.emit('navigateBack'),
      true,
    );
  }

  private clearNodeObjects(): void {
    this.stopStartButtonPulse();
    this.nodeObjects.forEach((obj) => obj.destroy());
    this.nodeObjects = [];
  }

  private showNode(index: number): void {
    this.clearNodeObjects();
    this.currentNodeIndex = index;
    this.setBackground(nodeBackgroundIndex(index));
    this.showDecisionScreen(NODES[index]);
  }

  private showSceneIntro(): void {
    const { width: W, height: H } = this.scale;
    const boxW = Math.floor(W * 0.88);
    const boxX = Math.floor((W - boxW) / 2);
    const pad = 28;
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '22px',
      color: DARK_BROWN,
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      align: 'center',
    };

    const contentW = boxW - pad * 2;
    const { totalHeight, lineLayouts } = this.measureIntroLines(SCENE_INTRO_LINES, contentW, textStyle);
    const boxH = totalHeight + pad * 2 + 50;
    const boxTop = Math.floor((H - boxH) / 2) - 20;
    const textCenterX = boxX + boxW / 2;
    const textStartY = boxTop + pad;

    this.drawParchmentBox(boxX, boxTop, boxW, boxH);

    const btnW = Math.min(200, Math.floor(boxW * 0.28));
    const btnH = 58;
    const btnY = boxTop + boxH + 20;

    const startBtn = this.drawWoodButton(
      boxX + Math.floor((boxW - btnW) / 2),
      btnY,
      btnW,
      btnH,
      'Start',
      () => {
        this.stopStartButtonPulse();
        this.showNode(0);
      },
    );

    this.animateIntroLines(lineLayouts, textCenterX, textStartY, textStyle, () => {
      this.startStartButtonPulse(startBtn);
    });
  }

  private startStartButtonPulse(button: WoodButtonParts): void {
    this.stopStartButtonPulse();
    const txt = button.txt;
    const baseY = txt.getData('pulseBaseY') as number;
    txt.setY(baseY);
    txt.setAlpha(1);
    this.startButtonPulseTargets = [txt];

    this.tweens.add({
      targets: txt,
      y: baseY - START_PULSE_Y_OFFSET,
      alpha: 0.45,
      duration: START_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopStartButtonPulse(): void {
    if (!this.startButtonPulseTargets.length) return;

    const txt = this.startButtonPulseTargets[0] as Phaser.GameObjects.Text;
    this.tweens.killTweensOf(txt);
    const baseY = txt.getData('pulseBaseY') as number | undefined;
    if (baseY !== undefined) txt.setY(baseY);
    txt.setAlpha(1);
    this.startButtonPulseTargets = [];
  }

  private measureIntroLines(
    lines: string[],
    maxWidth: number,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): { totalHeight: number; lineLayouts: string[][] } {
    const probe = this.make.text({ x: 0, y: 0, text: '', style, add: false });
    probe.setWordWrapWidth(maxWidth);

    const lineLayouts: string[][] = [];
    let totalHeight = 0;
    const lineSpacing = 8;

    lines.forEach((line, lineIndex) => {
      const rows = this.wrapLineIntoRows(line, maxWidth, style);
      lineLayouts.push(rows);
      rows.forEach((row) => {
        probe.setText(row);
        totalHeight += probe.height + lineSpacing;
      });
      if (lineIndex < lines.length - 1) {
        totalHeight += INTRO_SENTENCE_GAP;
      }
    });

    probe.destroy();
    return { totalHeight, lineLayouts };
  }

  private wrapLineIntoRows(
    line: string,
    maxWidth: number,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): string[] {
    const probe = this.make.text({ x: 0, y: 0, text: '', style, add: false });
    const words = line.split(' ');
    const rows: string[] = [];
    let current = '';

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      probe.setText(candidate);
      if (probe.width > maxWidth && current) {
        rows.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });

    if (current) rows.push(current);
    probe.destroy();
    return rows.length ? rows : [line];
  }

  private animateIntroLines(
    lineLayouts: string[][],
    centerX: number,
    startY: number,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    onComplete?: () => void,
  ): number {
    let y = startY;
    let delay = 0;
    const lineSpacing = 8;

    lineLayouts.forEach((rows, lineIndex) => {
      rows.forEach((row) => {
        const rowHeight = this.animateIntroRow(row, centerX, y, style, delay);
        delay += row.split(' ').length * INTRO_WORD_STAGGER_MS + INTRO_WORD_FADE_MS;
        y += rowHeight + lineSpacing;
      });

      if (lineIndex < lineLayouts.length - 1) {
        delay += INTRO_ROW_PAUSE_MS;
        y += INTRO_SENTENCE_GAP;
      }
    });

    if (onComplete) {
      this.time.delayedCall(delay, onComplete);
    }

    return delay;
  }

  private animateIntroRow(
    row: string,
    centerX: number,
    y: number,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    startDelay: number,
  ): number {
    const words = row.split(' ');
    const probes = words.map((word) =>
      this.make.text({ x: 0, y: 0, text: `${word} `, style, add: false }),
    );
    const totalWidth = probes.reduce((sum, probe) => sum + probe.width, 0);
    const rowHeight = probes[0]?.height ?? 22;

    let x = centerX - totalWidth / 2;
    words.forEach((word, i) => {
      const wordText = this.add
        .text(x, y, `${word}${i < words.length - 1 ? ' ' : ''}`, style)
        .setOrigin(0, 0)
        .setAlpha(0)
        .setDepth(UI_DEPTH + 2);

      this.nodeObjects.push(wordText);

      this.tweens.add({
        targets: wordText,
        alpha: 1,
        duration: INTRO_WORD_FADE_MS,
        delay: startDelay + i * INTRO_WORD_STAGGER_MS,
        ease: 'Sine.easeIn',
      });

      x += probes[i].width;
      probes[i].destroy();
    });

    return rowHeight;
  }

  private showDecisionScreen(node: DecisionNode): void {
    this.clearNodeObjects();
    this.currentNodeId = node.id;
    this.nodeStartTime = Date.now();
    GameManager.markNodeStart(node.id);

    const { width: W } = this.scale;
    const boxW = Math.floor(W * 0.88);
    const boxX = Math.floor((W - boxW) / 2);
    const boxTop = Math.floor(this.scale.height * 0.1);
    const pad = 24;

    const body = this.add.text(boxX + boxW / 2, 0, node.situationText, {
      fontSize: '20px',
      color: DARK_BROWN,
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: boxW - pad * 2 },
      lineSpacing: 6,
    }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 2);
    this.nodeObjects.push(body);

    const boxH = body.height + pad * 2;
    body.setY(boxTop + pad);
    this.drawParchmentBox(boxX, boxTop, boxW, boxH);

    const promptY = boxTop + boxH + 28;
    const prompt = this.add.text(W / 2, promptY, 'What you do?', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 2);
    this.nodeObjects.push(prompt);

    const choiceW = Math.floor(W * 0.78);
    const choiceX = Math.floor((W - choiceW) / 2);
    const choiceH = 68;
    const choiceGap = 14;
    let choiceY = promptY + prompt.height + 24;

    node.choices.forEach((choice) => {
      this.drawChoicePill(choiceX, choiceY, choiceW, choiceH, choice.label, () => {
        this.handleChoice(choice.choiceKey, choice.riskLevel);
      });
      choiceY += choiceH + choiceGap;
    });
  }

  private drawParchmentBox(x: number, y: number, w: number, h: number): void {
    const bg = this.add.graphics().setDepth(UI_DEPTH + 1);
    bg.fillStyle(PARCHMENT, 0.96);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.strokeRoundedRect(x, y, w, h, 10);
    this.nodeObjects.push(bg);
  }

  private drawWoodButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    persistent = false,
  ): WoodButtonParts {
    const cx = x + w / 2;
    const cy = y + h / 2;

    const img = this.add.image(cx, cy, WOOD_BUTTON_KEY);
    img.setDisplaySize(w, h);
    img.setDepth(UI_DEPTH + 3);
    if (!persistent) this.nodeObjects.push(img);

    const txt = this.add.text(cx, cy, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 4);
    txt.setData('pulseBaseY', cy);
    if (!persistent) this.nodeObjects.push(txt);

    const zone = this.add
      .zone(cx, cy, w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH + 5);

    zone.on('pointerover', () => this.sound.play('btn-hover'));
    zone.on('pointerdown', () => {
      zone.disableInteractive();
      this.sound.play('btn-click');
      onClick();
    });

    if (!persistent) this.nodeObjects.push(zone);
    return { img, txt, zone };
  }

  private drawChoicePill(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = h / 2;

    const bg = this.add.graphics().setDepth(UI_DEPTH + 1);
    const paint = (alpha: number) => {
      bg.clear();
      bg.fillStyle(CHOICE_BLUE, alpha);
      bg.fillRoundedRect(x, y, w, h, radius);
    };
    paint(0.82);
    this.nodeObjects.push(bg);

    const txt = this.add.text(x + 22, cy, label, {
      fontSize: '17px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      wordWrap: { width: w - 44 },
    }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 2);
    this.nodeObjects.push(txt);

    const zone = this.add
      .zone(cx, cy, w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH + 3);

    zone.on('pointerover', () => paint(0.95));
    zone.on('pointerout', () => paint(0.82));
    zone.on('pointerdown', () => {
      zone.disableInteractive();
      this.sound.play('btn-click');
      onClick();
    });

    this.nodeObjects.push(zone);
  }

  private handleChoice(choiceKey: string, riskLevel: RiskLevel): void {
    const reactionTimeMs = Date.now() - this.nodeStartTime;

    GameManager.recordChoice({ nodeId: this.currentNodeId, choiceKey, reactionTimeMs, riskLevel });
    GameManager.updateEnergy(ENERGY_DELTAS[riskLevel]);
    this.game.events.emit('updateEnergy', riskLevel);

    this.showNextNode();
  }

  private showNextNode(): void {
    this.currentNodeIndex += 1;
    if (this.currentNodeIndex >= NODES.length) {
      const sessionData = GameManager.endSession();
      this.game.events.emit('gameComplete', sessionData);
    } else {
      this.showNode(this.currentNodeIndex);
    }
  }
}

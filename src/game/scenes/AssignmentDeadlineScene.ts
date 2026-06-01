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

const SCENE_INTRO =
  "It's almost midnight. Your FYP progress report is due tomorrow at 8 AM. " +
  'You have two sections left to write. Your energy bar is at 75% but dropping. ' +
  'Your phone keeps buzzing.';

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
      'You sit down at your desk. The blank document stares back at you. ' +
      'Your phone lights up — your groupmate just posted a meme in the group chat. ' +
      'Your energy bar ticks down slightly.',
    choices: [
      {
        label: 'Open the document and start writing Section 1 right now.',
        choiceKey: 'START_WORKING',
        riskLevel: 'low',
      },
      {
        label: "Check the group chat first. Just for a minute, then you'll start.",
        choiceKey: 'SOCIAL_MEDIA',
        riskLevel: 'mid',
      },
      {
        label: "You're too stressed to start. Watch YouTube for a bit to calm down first.",
        choiceKey: 'PLAY_GAME',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D2',
    situationText:
      "It's now 1:30 AM. You've been working (or trying to). " +
      'Your energy bar hits 30%. Your eyes ache. Section 1 is half done. ' +
      "Section 2 hasn't been touched.\n\n" +
      'Your eyes burn. The coffee has gone cold. The document is half-finished.',
    choices: [
      {
        label: 'Set a 15-minute timer, lie down, then come back refreshed.',
        choiceKey: 'TAKE_BREAK',
        riskLevel: 'low',
      },
      {
        label: 'Power through. Sleep is for after submission. More coffee.',
        choiceKey: 'PUSH_THROUGH',
        riskLevel: 'mid',
      },
      {
        label: 'This is too much. Close the laptop. Whatever happens, happens.',
        choiceKey: 'GIVE_UP',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D3',
    situationText:
      '2:45 AM. A message pops up from your coursemate Amirah: ' +
      "'Hey still up? Wanna video call and study together? I'm stuck too.'\n\n" +
      'Your phone lights up. Amirah is still awake, struggling too.',
    choices: [
      {
        label: 'Join the call. Two stressed people are better than one stressed person alone.',
        choiceKey: 'JOIN_FRIEND',
        riskLevel: 'low',
      },
      {
        label: "Leave it on read. You're in the zone now. No distractions.",
        choiceKey: 'IGNORE_MESSAGE',
        riskLevel: 'mid',
      },
      {
        label: "Reply 'can't' then spend 20 minutes checking everyone else's stories to see who else is still up.",
        choiceKey: 'SPIRAL_PHONE',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D4',
    situationText:
      '7:52 AM. Section 2 is rough but done. You export the PDF. ' +
      'The submission portal is open. Your hand hovers over the submit button. ' +
      'You notice two typos.',
    choices: [
      {
        label: 'Submit immediately. Done is better than perfect at 7:52 AM.',
        choiceKey: 'SUBMIT_NOW',
        riskLevel: 'low',
      },
      {
        label: 'Fix both typos, re-export, submit at 7:58 AM. Cutting it close.',
        choiceKey: 'FIX_TYPOS',
        riskLevel: 'mid',
      },
      {
        label: 'Start re-reading the whole thing. Begin making changes. Miss the deadline.',
        choiceKey: 'SPIRAL_FIX',
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
const WOOD_BUTTON_KEY = 'wood-button';
const UI_DEPTH = 10;

function nodeBackgroundIndex(nodeIndex: number): number {
  return nodeIndex + 1;
}

function backgroundKey(index: number): string {
  return `assignment-bg-${index + 1}`;
}

function backgroundPath(index: number): string {
  return `/assets/backgrounds/assignment_deadline_${index + 1}.png`;
}

export default class AssignmentDeadlineScene extends Phaser.Scene {
  private currentNodeIndex: number = 0;
  private nodeStartTime: number = 0;
  private currentNodeId: string = '';
  private nodeObjects: Phaser.GameObjects.GameObject[] = [];
  private backgroundImage?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'AssignmentDeadline' });
  }

  init(_data: Partial<SceneData>): void {
    this.currentNodeIndex = 0;
    this.nodeStartTime = 0;
    this.currentNodeId = '';
    this.nodeObjects = [];
    this.backgroundImage = undefined;
  }

  preload(): void {
    for (let i = 0; i < BACKGROUND_COUNT; i += 1) {
      this.load.image(backgroundKey(i), backgroundPath(i));
    }
    this.load.image(WOOD_BUTTON_KEY, '/assets/ui/button/wood_button.png');
  }

  create(): void {
    this.setBackground(INTRO_BG_INDEX);
    this.drawSceneBadge();
    this.showSceneIntro();
  }

  // Background
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
    const badge = this.add.image(168, 52, WOOD_BUTTON_KEY);
    badge.setDisplaySize(300, 72);
    badge.setDepth(UI_DEPTH);

    const title = this.add.text(168, 52, 'Assignment Deadline', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);
    title.disableInteractive();
  }

  // Per-node rendering

  private clearNodeObjects(): void {
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

    const body = this.add.text(0, 0, SCENE_INTRO, {
      fontSize: '22px',
      color: DARK_BROWN,
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: boxW - pad * 2 },
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 2);
    this.nodeObjects.push(body);

    const boxH = body.height + pad * 2 + 50;
    const boxTop = Math.floor((H - boxH) / 2) - 20;
    body.setPosition(boxX + boxW / 2, boxTop + boxH / 2 - 20);
    this.drawParchmentBox(boxX, boxTop, boxW, boxH);

    const btnW = Math.min(200, Math.floor(boxW * 0.28));
    const btnH = 58;
    const btnY = boxTop + boxH + 20;

    this.drawWoodButton(
      boxX + 24,
      btnY,
      btnW,
      btnH,
      'Back',
      () => this.game.events.emit('navigateBack'),
    );

    this.drawWoodButton(
      boxX + boxW - btnW - 24,
      btnY,
      btnW,
      btnH,
      'Start',
      () => this.showNode(0),
    );
  }

  private showDecisionScreen(node: DecisionNode): void {
    this.clearNodeObjects();
    this.currentNodeId = node.id;
    this.nodeStartTime = Date.now();
    GameManager.markNodeStart(node.id);

    const { width: W, height: H } = this.scale;
    const boxW = Math.floor(W * 0.88);
    const boxX = Math.floor((W - boxW) / 2);
    const boxTop = Math.floor(H * 0.1);
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
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;

    const img = this.add.image(cx, cy, WOOD_BUTTON_KEY);
    img.setDisplaySize(w, h);
    img.setDepth(UI_DEPTH + 3);
    this.nodeObjects.push(img);

    const txt = this.add.text(cx, cy, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 4);
    this.nodeObjects.push(txt);

    const zone = this.add
      .zone(cx, cy, w, h)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_DEPTH + 5);

    zone.on('pointerdown', () => {
      zone.disableInteractive();
      onClick();
    });

    this.nodeObjects.push(zone);
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
      onClick();
    });

    this.nodeObjects.push(zone);
  }

  // Choice handling

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

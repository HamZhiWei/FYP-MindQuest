import Phaser from 'phaser';
import type { SceneData } from '../../types';
import GameManager from '../GameManager';

type RiskLevel = 'low' | 'mid' | 'high';

interface NpcMessage {
  sender: string;
  message: string;
}

interface ChoiceOption {
  label: string;
  choiceKey: string;
  riskLevel: RiskLevel;
}

interface DecisionNode {
  id: string;
  situationText: string;
  npcMessage: NpcMessage;
  choices: ChoiceOption[];
}

const SCENE_INTRO =
  "It's mid-semester crunch week. Your group assignment is due Friday at 11:59 PM. " +
  'Your team of four has been out of sync for days — two members have gone quiet on the group chat, ' +
  'one keeps sending voice notes at midnight, and your part is only half done. On top of that, ' +
  "a close friend hasn't replied to your texts since Tuesday, and your lecturer just sent a message " +
  'asking everyone to "see their submission tracker."';

const ENERGY_DELTAS: Record<RiskLevel, number> = {
  low: 3,
  mid: -7,
  high: -15,
};

const NODES: DecisionNode[] = [
  {
    id: 'D1',
    situationText:
      "Your groupmate Siti messages about the assignment. Two other members haven't contributed yet " +
      "and the deadline is tomorrow night. You're already behind on your own section.",
    npcMessage: {
      sender: 'Siti (group chat)',
      message:
        "Hey, can you write the discussion section? I've done the intro. " +
        "The others aren't responding and we need it done tonight.",
    },
    choices: [
      {
        label: "Sure, I'll cover it. Share what you have and I'll fit my part around yours.",
        choiceKey: 'HELP_FULLY',
        riskLevel: 'low',
      },
      {
        label: "I'll try but I'm swamped. I'll do what I can before midnight.",
        choiceKey: 'HALF_COMMIT',
        riskLevel: 'mid',
      },
      {
        label: "Leave it on read. You'll figure out what to say after you calm down.",
        choiceKey: 'LEAVE_READ',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D2',
    situationText:
      'Your close friend Danial finally texts after 5 days of silence. ' +
      'You have been stressed all week and have not told anyone.',
    npcMessage: {
      sender: 'Danial',
      message:
        'Hey, you okay? Haven\'t seen you around since last week. Want to grab dinner later? Or just talk if you need to.',
    },
    choices: [
      {
        label: "Actually yeah, I really could use that. Free after 6? It's been a rough week.",
        choiceKey: 'ACCEPT_HELP',
        riskLevel: 'low',
      },
      {
        label: "I'm fine lah, just busy with the assignment. Maybe after Friday?",
        choiceKey: 'DEFLECT',
        riskLevel: 'mid',
      },
      {
        label: 'Seen. No reply. Too much mental energy to explain everything right now.',
        choiceKey: 'GHOST',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D3',
    situationText:
      'You open the message from your lecturer, Dr Lim. It is short and gives nothing away. ' +
      'Your mind immediately starts filling in the blanks.',
    npcMessage: {
      sender: 'Dr Lim (e-learn notification)',
      message:
        "Please check your group's submission tracker. I have noted some concerns about progress. — Dr Lim",
    },
    choices: [
      {
        label: "Reply right away: \"Thank you Dr Lim, we're on track. Happy to discuss if needed.\"",
        choiceKey: 'REPLY_CALM',
        riskLevel: 'low',
      },
      {
        label: 'Spend 45 minutes drafting a long explanation, then send just "noted, will check."',
        choiceKey: 'DRAFT_LONG',
        riskLevel: 'mid',
      },
      {
        label: 'Close the notification. Spend the next two hours imagining every worst-case outcome.',
        choiceKey: 'PANIC_IGNORE',
        riskLevel: 'high',
      },
    ],
  },
  {
    id: 'D4',
    situationText:
      "During Thursday's tutorial, Dr Lim reviews group submissions in front of the class. When she gets to yours, she pauses.",
    npcMessage: {
      sender: 'Dr Lim (in tutorial, in front of class)',
      message:
        "This group's discussion section is unclear and doesn't connect back to the objectives. You need to rethink the structure before submission.",
    },
    choices: [
      {
        label: "Understood, Dr Lim. We'll restructure it today and make sure it aligns.",
        choiceKey: 'REFRAME',
        riskLevel: 'low',
      },
      {
        label: 'Nod and write it down. Spend the rest of tutorial unable to focus, replaying it.',
        choiceKey: 'SMILE_SPIRAL',
        riskLevel: 'mid',
      },
      {
        label: 'Apologise multiple times in class, then text your group blaming yourself for everything.',
        choiceKey: 'SELF_BLAME',
        riskLevel: 'high',
      },
    ],
  },
];

const CHALK_FONT = '"League Spartan", "Patrick Hand", sans-serif';
const DARK_BROWN = '#1a1008';
const MID_BROWN = '#3d2a18';
const PARCHMENT = 0xe8dcc8;
const NPC_FILL = 0xc9b08a;
const NPC_ACCENT = 0x5c3d1e;
const CHOICE_BLUE = 0x2a4a7a;
const BACKGROUND_COUNT = 5;
const INTRO_BG_INDEX = 0;
const WOOD_BUTTON_KEY = 'wood-button';
const UI_DEPTH = 10;

function nodeBackgroundIndex(nodeIndex: number): number {
  return nodeIndex + 1;
}

function backgroundKey(index: number): string {
  return `social-bg-${index + 1}`;
}

function backgroundPath(index: number): string {
  return `/assets/backgrounds/social_interaction_${index + 1}.png`;
}

export default class SocialInteractionScene extends Phaser.Scene {
  private currentNodeIndex = 0;
  private nodeStartTime = 0;
  private currentNodeId = '';
  private nodeObjects: Phaser.GameObjects.GameObject[] = [];
  private backgroundImage?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'SocialInteractionScene' });
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

  private setBackground(bgIndex: number): void {
    const { width: W, height: H } = this.scale;
    const key = backgroundKey(bgIndex);

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

    this.add.text(168, 52, 'Social Interaction', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1).disableInteractive();
  }

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

    const { width: W } = this.scale;
    const boxW = Math.floor(W * 0.88);
    const boxX = Math.floor((W - boxW) / 2);
    const boxTop = Math.floor(this.scale.height * 0.08);
    const pad = 24;
    const innerPad = 14;
    const contentW = boxW - pad * 2;

    const situationText = this.add.text(boxX + pad, 0, node.situationText, {
      fontSize: '20px',
      color: DARK_BROWN,
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      wordWrap: { width: contentW },
      lineSpacing: 6,
    }).setOrigin(0, 0).setDepth(UI_DEPTH + 3);
    this.nodeObjects.push(situationText);

    let curY = boxTop + pad;
    situationText.setY(curY);
    curY += situationText.height + 16;

    curY = this.drawNpcMessageBox(
      node.npcMessage,
      boxX + pad,
      curY,
      contentW,
      innerPad,
    );

    const boxH = curY - boxTop + pad;
    this.drawParchmentBox(boxX, boxTop, boxW, boxH);

    const promptY = boxTop + boxH + 28;
    const prompt = this.add.text(W / 2, promptY, 'What you do?', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(UI_DEPTH + 3);
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

  private drawNpcMessageBox(
    npc: NpcMessage,
    x: number,
    y: number,
    width: number,
    innerPad: number,
  ): number {
    const textW = width - innerPad * 2 - 8;

    const senderText = this.add.text(x + innerPad + 8, y + innerPad, npc.sender, {
      fontSize: '16px',
      color: MID_BROWN,
      fontFamily: CHALK_FONT,
      fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(UI_DEPTH + 3);
    this.nodeObjects.push(senderText);

    const messageText = this.add.text(
      x + innerPad + 8,
      y + innerPad + senderText.height + 6,
      npc.message,
      {
        fontSize: '17px',
        color: DARK_BROWN,
        fontFamily: CHALK_FONT,
        wordWrap: { width: textW },
        lineSpacing: 4,
      },
    ).setOrigin(0, 0).setDepth(UI_DEPTH + 3);
    this.nodeObjects.push(messageText);

    const boxH = innerPad + senderText.height + 6 + messageText.height + innerPad;

    const bg = this.add.graphics().setDepth(UI_DEPTH + 2);
    bg.fillStyle(NPC_FILL, 0.92);
    bg.fillRoundedRect(x, y, width, boxH, 8);
    this.nodeObjects.push(bg);

    const accent = this.add.graphics().setDepth(UI_DEPTH + 2);
    accent.fillStyle(NPC_ACCENT, 1);
    accent.fillRect(x, y, 6, boxH);
    this.nodeObjects.push(accent);

    return y + boxH;
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

  private handleChoice(choiceKey: string, riskLevel: RiskLevel): void {
    const reactionTimeMs = Date.now() - this.nodeStartTime;

    GameManager.recordChoice({
      nodeId: this.currentNodeId,
      choiceKey,
      reactionTimeMs,
      riskLevel,
    });
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

import { BoardSystem } from '../systems/BoardSystem.js';
import { BlockSystem } from '../systems/BlockSystem.js';
import { DungeonSystem } from '../systems/DungeonSystem.js';
import { CardSystem } from '../systems/CardSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { StateMachine, GameStates } from '../systems/StateMachine.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { storageService } from '../services/StorageService.js';
import { iapService } from '../services/IAPService.js';
import { hapticsService } from '../services/HapticsService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { HUD } from '../ui/HUD.js';
import { ToastNotification } from '../ui/ToastNotification.js';
import {
  BOARD_COLS, BOARD_ROWS, CELL_SIZE, COLOR_BG, COLOR_GRID_LINE,
  BLOCK_PLACE_TWEEN_MS, LINE_CLEAR_FLASH_MS, LINE_CLEAR_DISSOLVE_MS,
  NEON_COLORS,
} from '../constants.js';
import { SKIN_BY_ID } from '../data/skins.js';

const TRAY_PIECE_SLOTS = 3;
const BOARD_OFFSET_Y_RATIO = 0.18; // board top starts at 18% of screen height

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this._resume = data?.resume ?? false;
    this._events = new Phaser.Events.EventEmitter();
  }

  create() {
    const { width, height } = this.scale;

    // ── Systems ────────────────────────────────────────────────────────────────
    this._dungeon = new DungeonSystem(this._events);
    this._score = new ScoreSystem(this._events);
    this._sm = new StateMachine(GameStates.IDLE);
    this._audio = new AudioSystem(this);

    const settings = storageService.loadSettings();
    this._audio.applySetting(settings);

    // ── Run State ──────────────────────────────────────────────────────────────
    let runState;
    if (this._resume && storageService.hasInterruptedRun()) {
      runState = storageService.loadRun();
      this._dungeon.runState = runState;
    } else {
      storageService.clearRun();
      runState = this._dungeon.newRun();
    }
    this._rs = runState;

    // ── Board ──────────────────────────────────────────────────────────────────
    this._board = new BoardSystem(this._events);
    if (this._resume && runState.boardState) {
      this._board.restore(runState.boardState);
    }

    // ── Blocks ─────────────────────────────────────────────────────────────────
    this._blocks = new BlockSystem(this._events, runState.seed, runState.queueSize || 3);
    if (this._resume && runState.pieceQueue) {
      this._blocks.restoreQueue(runState.pieceQueue);
    }

    // ── Cards ──────────────────────────────────────────────────────────────────
    this._cards = new CardSystem(this._events, runState.seed);

    // ── Skin ───────────────────────────────────────────────────────────────────
    const player = storageService.getPlayer();
    this._skin = SKIN_BY_ID[player.activeBoardSkin] || SKIN_BY_ID['default'];

    // ── Layout calculation ─────────────────────────────────────────────────────
    const cellSize = Math.min(
      Math.floor((width * 0.9) / BOARD_COLS),
      Math.floor((height * 0.55) / BOARD_ROWS)
    );
    this._cellSize = cellSize;
    this._boardX = Math.floor((width - cellSize * BOARD_COLS) / 2);
    this._boardY = Math.floor(height * BOARD_OFFSET_Y_RATIO);
    this._trayY = this._boardY + cellSize * BOARD_ROWS + 24;

    // ── Background ─────────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, this._skin.boardBg);

    // ── Board graphics objects ─────────────────────────────────────────────────
    this._gridGraphics = this.add.graphics();
    this._blockObjects = [];  // 2D array [row][col] = Phaser.GameObjects.Rectangle
    this._initBoardObjects();
    this._drawGrid();

    // ── Tray (piece queue) ─────────────────────────────────────────────────────
    this._trayPieces = [];
    this._dragging = null;   // { piece, trayIndex, container, ghostCells }
    this._ghostGraphics = this.add.graphics().setDepth(50);
    this._renderTray();

    // ── HUD ────────────────────────────────────────────────────────────────────
    this._hud = new HUD(this);
    this._toast = new ToastNotification(this);

    // ── Event listeners ────────────────────────────────────────────────────────
    this._bindEvents();

    // ── Input ──────────────────────────────────────────────────────────────────
    this.input.on('pointermove', this._onPointerMove, this);
    this.input.on('pointerup', this._onPointerUp, this);

    // ── Start music ────────────────────────────────────────────────────────────
    this._audio.playMusic('music_zone1');

    // ── Analytics ─────────────────────────────────────────────────────────────
    firebaseService.event('run_start', { seed: runState.seed, floor: runState.floor });

    // Initial render
    this._syncBoardRender();
    this._updateHUD();
  }

  // ── Board Object Pool ─────────────────────────────────────────────────────────
  _initBoardObjects() {
    this._blockObjects = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      this._blockObjects[r] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        const x = this._boardX + c * this._cellSize + this._cellSize / 2;
        const y = this._boardY + r * this._cellSize + this._cellSize / 2;
        const rect = this.add.rectangle(x, y, this._cellSize - 2, this._cellSize - 2, 0x000000, 0)
          .setDepth(10);
        this._blockObjects[r][c] = rect;
      }
    }
  }

  _drawGrid() {
    const g = this._gridGraphics;
    g.clear();
    g.lineStyle(1, this._skin.gridLine, 0.8);
    for (let c = 0; c <= BOARD_COLS; c++) {
      const x = this._boardX + c * this._cellSize;
      g.lineBetween(x, this._boardY, x, this._boardY + BOARD_ROWS * this._cellSize);
    }
    for (let r = 0; r <= BOARD_ROWS; r++) {
      const y = this._boardY + r * this._cellSize;
      g.lineBetween(this._boardX, y, this._boardX + BOARD_COLS * this._cellSize, y);
    }
    // Board border
    g.lineStyle(2, this._skin.borderColor, 1);
    g.strokeRect(this._boardX, this._boardY, BOARD_COLS * this._cellSize, BOARD_ROWS * this._cellSize);
    g.setDepth(5);
  }

  _syncBoardRender() {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const val = this._board.get(c, r);
        const rect = this._blockObjects[r][c];
        if (val === 0) {
          rect.setFillStyle(0x000000, 0);
        } else if (val === 8) {
          rect.setFillStyle(0x444444, 1);  // locked cell
        } else {
          rect.setFillStyle(NEON_COLORS[val - 1] || 0xffffff, 1);
        }
      }
    }
  }

  // ── Tray Rendering ──────────────────────────────────────────────────────────
  _renderTray() {
    // Clear previous tray
    for (const t of this._trayPieces) t.container?.destroy();
    this._trayPieces = [];

    const queue = this._blocks.getQueue();
    const { width } = this.scale;
    const slotW = width / (queue.length + 1);

    queue.forEach((piece, i) => {
      const cx = slotW * (i + 1);
      const cy = this._trayY + this._cellSize * 2;
      const container = this._buildPieceContainer(piece, cx, cy, this._cellSize * 0.8);
      container.setDepth(30);
      container.setInteractive(
        new Phaser.Geom.Rectangle(
          -this._cellSize * 2, -this._cellSize * 2,
          this._cellSize * 4, this._cellSize * 4
        ),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerdown', (ptr) => {
        if (!this._sm.is(GameStates.IDLE)) return;
        this._sm.to(GameStates.PLACING);
        this._startDrag(piece, i, ptr);
      });

      this._trayPieces.push({ piece, container, index: i });
    });
  }

  _buildPieceContainer(piece, cx, cy, cellSize) {
    const shape = piece.shape;
    const rects = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const x = c * cellSize - (cellSize * 1.5);
        const y = r * cellSize - (cellSize * 1.5);
        const rect = this.add.rectangle(x, y, cellSize - 2, cellSize - 2, piece.color, 1)
          .setOrigin(0);
        rects.push(rect);
      }
    }
    return this.add.container(cx, cy, rects);
  }

  // ── Drag ────────────────────────────────────────────────────────────────────
  _startDrag(piece, trayIndex, ptr) {
    hapticsService.light();
    const container = this._buildPieceContainer(piece, ptr.x, ptr.y, this._cellSize);
    container.setDepth(100);
    container.setAlpha(0.85);
    this._dragging = { piece, trayIndex, container };
    // Hide original tray piece
    this._trayPieces[trayIndex]?.container?.setAlpha(0.3);
  }

  _onPointerMove(ptr) {
    if (!this._dragging) return;
    this._dragging.container.setPosition(ptr.x, ptr.y);
    this._updateGhost(ptr);
  }

  _updateGhost(ptr) {
    this._ghostGraphics.clear();
    const { col, row } = this._screenToGrid(ptr.x, ptr.y);
    const piece = this._dragging.piece;
    const valid = this._board.isValidPlacement(piece.shape, col, row);

    this._ghostGraphics.lineStyle(1, valid ? 0x00ffcc : 0xff0000, 0.5);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const gc = col + c, gr = row + r;
        if (gc < 0 || gc >= BOARD_COLS || gr < 0 || gr >= BOARD_ROWS) continue;
        const x = this._boardX + gc * this._cellSize;
        const y = this._boardY + gr * this._cellSize;
        this._ghostGraphics.fillStyle(valid ? 0x00ffcc : 0xff0000, 0.2);
        this._ghostGraphics.fillRect(x + 1, y + 1, this._cellSize - 2, this._cellSize - 2);
        this._ghostGraphics.strokeRect(x + 1, y + 1, this._cellSize - 2, this._cellSize - 2);
      }
    }
  }

  _onPointerUp(ptr) {
    if (!this._dragging) return;
    const { piece, trayIndex, container } = this._dragging;
    this._dragging = null;
    this._ghostGraphics.clear();
    container.destroy();

    const { col, row } = this._screenToGrid(ptr.x, ptr.y);

    if (this._board.isValidPlacement(piece.shape, col, row)) {
      this._placePiece(piece, trayIndex, col, row);
    } else {
      // Snap back
      if (this._trayPieces[trayIndex]) {
        this._trayPieces[trayIndex].container.setAlpha(1);
      }
      this._sm.to(GameStates.IDLE);
    }
  }

  _screenToGrid(sx, sy) {
    const col = Math.floor((sx - this._boardX) / this._cellSize);
    const row = Math.floor((sy - this._boardY) / this._cellSize);
    return { col, row };
  }

  // ── Piece Placement ──────────────────────────────────────────────────────────
  _placePiece(piece, trayIndex, col, row) {
    this._sm.to(GameStates.ANIMATING);
    hapticsService.light();

    const colorIndex = (NEON_COLORS.indexOf(piece.color) + 1) || 1;
    this._board.place(piece.shape, col, row, colorIndex);
    this._blocks.consumePiece(trayIndex);
    this._syncBoardRender();

    // Place tween — scale rubber-band on affected cells
    const affectedObjects = [];
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const gc = col + c, gr = row + r;
        if (gc >= 0 && gc < BOARD_COLS && gr >= 0 && gr < BOARD_ROWS) {
          affectedObjects.push(this._blockObjects[gr][gc]);
        }
      }
    }

    this.tweens.add({
      targets: affectedObjects,
      scaleX: 1.15, scaleY: 1.15,
      duration: BLOCK_PLACE_TWEEN_MS / 2,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this._audio.play('sfx_place');
        this._runClearPhase(piece);
      },
    });
  }

  // ── Clear Phase ───────────────────────────────────────────────────────────────
  _runClearPhase(piece) {
    this._sm.to(GameStates.CLEARING);
    const totalCleared = this._board.runClearCycle(
      this._rs.hyperCascade ? 999 : 3
    );

    if (totalCleared === 0) {
      this._afterClear(0);
      return;
    }

    hapticsService.medium();
    this._audio.play('sfx_clear');

    // Flash cleared cells
    const { rows, cols } = this._board.scanClears(); // note: these are already cleared, we track in event
    this._syncBoardRender();
    this._emitClearParticles();

    this.time.delayedCall(LINE_CLEAR_FLASH_MS + LINE_CLEAR_DISSOLVE_MS, () => {
      this._afterClear(totalCleared);
    });
  }

  _emitClearParticles() {
    // Simple visual flash on all cleared cells using camera flash
    this.cameras.main.flash(80, 255, 255, 255, false);
  }

  _afterClear(totalCleared) {
    if (totalCleared > 0) {
      const scoreGain = this._score.awardClear(totalCleared, this._board.combo, this._rs);
      const { xpGained, floorComplete, bossHit } = this._dungeon.registerClear(totalCleared, this._board.combo);

      if (bossHit) {
        hapticsService.heavy();
        this.cameras.main.shake(200, 0.012);
        this._audio.play('sfx_boss');
      }

      const cx = this._boardX + (BOARD_COLS / 2) * this._cellSize;
      const cy = this._boardY + (BOARD_ROWS / 2) * this._cellSize;
      this._hud.showScoreGain(scoreGain, cx, cy);
      if (this._board.combo >= 2) {
        this._hud.showCombo(this._board.combo, cx, cy - 40);
        const comboKey = `sfx_combo${Math.min(this._board.combo, 4)}x`;
        this._audio.play(comboKey);
      }

      if (floorComplete) {
        this._onFloorComplete();
        return;
      }
    }

    this._updateHUD();
    this._renderTray();
    this._checkGameOver();
    this._sm.to(GameStates.IDLE);
  }

  // ── Floor Complete ────────────────────────────────────────────────────────────
  _onFloorComplete() {
    this._sm.to(GameStates.CARD_SELECT);
    hapticsService.success();

    // Save run state before launching overlay
    this._saveRunSnapshot();

    const picks = this._cards.pickThree(this._rs.activeCards);
    this.scene.launch('CardSelectScene', {
      cards: picks,
      onSelect: (cardId) => this._onCardSelected(cardId),
    });
  }

  _onCardSelected(cardId) {
    this._cards.activateCard(cardId, this._rs);
    const card = this._rs.activeCards.find(c => c.id === cardId);
    const cardName = card?.name || cardId;
    this._toast.show(`${cardName} activated!`);
    this._audio.play('sfx_card');

    const continued = this._dungeon.advanceFloor();
    if (!continued) {
      this._onRunComplete();
      return;
    }

    // Apply boss locked cells if needed
    if (this._dungeon.isBossFloor() && this._rs.boss?.mechanic === 'LOCKED_CELLS') {
      const positions = this._board.randomLockedPositions(
        this._rs.boss.lockedCellCount,
        () => Math.random()
      );
      this._board.placeLocked(positions);
    }

    this._board.reset();
    this._blocks = new (this._blocks.constructor)(this._events, this._rs.seed ^ this._rs.floor, this._rs.queueSize || 3);

    this._syncBoardRender();
    this._renderTray();
    this._updateHUD();
    this._sm.to(GameStates.IDLE);
  }

  // ── Game Over ─────────────────────────────────────────────────────────────────
  _checkGameOver() {
    if (!this._board.hasValidMove(this._blocks.getQueue())) {
      this._dungeon.takeDamage(1);
      if (this._rs.hp <= 0) {
        this._sm.to(GameStates.GAME_OVER);
        this._onRunDied();
      } else {
        // Still alive — shuffle board or offer revive
        if (this._rs.secondChance) {
          this._toast.show('Second Chance activated!', 0x00ffcc);
          this._board.reset();
          this._syncBoardRender();
        }
        this._updateHUD();
        this._sm.to(GameStates.IDLE);
      }
    }
  }

  _onRunDied() {
    hapticsService.heavy();
    this._audio.play('sfx_death');
    this._audio.stopMusic();
    firebaseService.event('run_end', { floor: this._rs.floor, cause: 'death' });

    const xpGained = this._rs.floor * 10 + this._board.combo * 5;
    storageService.addXP(xpGained);
    storageService.updateRunStats(this._rs);
    storageService.clearRun();

    const hasRevive = storageService.hasConsumable('revive');
    this.time.delayedCall(400, () => {
      this.scene.start('RunCompleteScene', {
        runState: this._rs,
        score: this._score.score,
        won: false,
        xpGained,
        hasRevive,
      });
    });
  }

  _onRunComplete() {
    hapticsService.success();
    this._audio.play('sfx_win');
    firebaseService.event('run_end', { floor: this._rs.floor, cause: 'win' });

    const xpGained = 250 + this._rs.floor * 10;
    storageService.addXP(xpGained);
    storageService.updateRunStats(this._rs);
    storageService.clearRun();
    firebaseService.submitScore('Raider', this._score.score, this._rs.floor);

    this.time.delayedCall(400, () => {
      this.scene.start('RunCompleteScene', {
        runState: this._rs,
        score: this._score.score,
        won: true,
        xpGained,
        hasRevive: false,
      });
    });
  }

  // ── Persistence ───────────────────────────────────────────────────────────────
  _saveRunSnapshot() {
    this._rs.boardState = this._board.snapshot();
    this._rs.pieceQueue = this._blocks.snapshotQueue();
    this._rs.score = this._score.score;
    storageService.saveRun(this._rs);
  }

  // ── HUD Update ────────────────────────────────────────────────────────────────
  _updateHUD() {
    this._hud.update(this._rs, this._score.score);
  }

  // ── Event bindings ────────────────────────────────────────────────────────────
  _bindEvents() {
    this._events.on('queue:updated', () => this._renderTray(), this);
    this._events.on('board:cleared', ({ rows, cols, combo }) => {
      this._syncBoardRender();
    }, this);
    this._events.on('run:hp', () => this._updateHUD(), this);
    this._events.on('dungeon:bossAppeared', ({ boss }) => {
      if (boss) {
        this._toast.show(`BOSS: ${boss.name}`, 0xff007f, 3000);
        this._audio.play('sfx_boss');
      }
    }, this);
    this._events.on('dungeon:bossDefeated', () => {
      this._toast.show('BOSS DEFEATED!', 0x00ffcc, 2000);
      hapticsService.heavy();
    }, this);
    this._events.on('run:shieldAbsorbed', () => {
      this._toast.show('Shield absorbed damage!', 0x88aaff);
    }, this);
    this._events.on('run:secondChance', () => {
      this._toast.show('SECOND CHANCE!', 0xffaa00, 2500);
    }, this);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  shutdown() {
    this._events.removeAllListeners();
    this.input.off('pointermove', this._onPointerMove, this);
    this.input.off('pointerup', this._onPointerUp, this);
    this._hud?.destroy();
    this._audio?.stopMusic();
  }
}

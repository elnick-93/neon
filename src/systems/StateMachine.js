/**
 * Simple finite state machine for GameScene flow control.
 * Prevents input handling during animations.
 */
export class StateMachine {
  constructor(initialState) {
    this.state = initialState;
    this._listeners = {};
  }

  /** Transition to a new state, firing listeners */
  to(newState) {
    const prev = this.state;
    this.state = newState;
    if (this._listeners[newState]) {
      this._listeners[newState](prev);
    }
  }

  /** Register a callback for when a specific state is entered */
  on(state, fn) {
    this._listeners[state] = fn;
    return this;
  }

  is(state) {
    return this.state === state;
  }

  isAny(...states) {
    return states.includes(this.state);
  }
}

export const GameStates = {
  IDLE:        'IDLE',
  PLACING:     'PLACING',
  ANIMATING:   'ANIMATING',
  CLEARING:    'CLEARING',
  CARD_SELECT: 'CARD_SELECT',
  BOSS_PHASE:  'BOSS_PHASE',
  GAME_OVER:   'GAME_OVER',
  PAUSED:      'PAUSED',
};

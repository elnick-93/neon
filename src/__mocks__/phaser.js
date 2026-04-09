// Phaser mock for unit tests (no DOM or WebGL required)
export const Phaser = {
  Events: {
    EventEmitter: class {
      constructor() { this._events = {}; }
      emit(event, data) { (this._events[event] || []).forEach(fn => fn(data)); }
      on(event, fn) { (this._events[event] = this._events[event] || []).push(fn); return this; }
      off(event, fn) {
        if (this._events[event]) {
          this._events[event] = this._events[event].filter(f => f !== fn);
        }
        return this;
      }
      removeAllListeners() { this._events = {}; return this; }
    }
  }
};

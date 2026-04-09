/**
 * HapticsService — wraps Capacitor Haptics plugin.
 * Falls back silently in browsers that don't support it.
 */
export class HapticsService {
  constructor() {
    this._enabled = true;
    this._haptics = null;
    this._init();
  }

  async _init() {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      this._haptics = Haptics;
      this._ImpactStyle = ImpactStyle;
    } catch {
      // Running in browser without Capacitor — haptics unavailable
      this._haptics = null;
    }
  }

  setEnabled(val) {
    this._enabled = val;
  }

  /** Light tap — piece placement */
  light() {
    if (!this._enabled || !this._haptics) return;
    this._haptics.impact({ style: this._ImpactStyle.Light }).catch(() => {});
  }

  /** Medium — line clear */
  medium() {
    if (!this._enabled || !this._haptics) return;
    this._haptics.impact({ style: this._ImpactStyle.Medium }).catch(() => {});
  }

  /** Heavy — boss hit, death */
  heavy() {
    if (!this._enabled || !this._haptics) return;
    this._haptics.impact({ style: this._ImpactStyle.Heavy }).catch(() => {});
  }

  /** Notification — level up, card unlocked */
  success() {
    if (!this._enabled || !this._haptics) return;
    this._haptics.notification({ type: 'SUCCESS' }).catch(() => {});
  }
}

export const hapticsService = new HapticsService();

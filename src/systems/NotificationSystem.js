import {
  NOTIF_HUNGER, NOTIF_HAPPINESS, NOTIF_SICK, NOTIF_EVOLVE,
  STAT_CRIT, STAT_LOW,
} from '../constants.js';
import { TimeSystem } from './TimeSystem.js';

/**
 * NotificationSystem — schedules and cancels Capacitor LocalNotifications.
 * Falls back silently in web browsers.
 */
export class NotificationSystem {
  constructor() {
    this._ln = null;
    this._init();
  }

  async _init() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      this._ln = LocalNotifications;
      await LocalNotifications.requestPermissions();
    } catch {
      this._ln = null;
    }
  }

  /** Cancel all scheduled notifications then reschedule based on current pet state. */
  async reschedule(pet) {
    if (!this._ln || !pet.isAlive || pet.stage === 0) return;

    await this._cancelAll();

    const notifications = [];

    // Hunger notification
    const hungerTime = TimeSystem.nextHungerCritTime(pet);
    if (hungerTime) {
      notifications.push({
        id:    NOTIF_HUNGER,
        title: `${pet.name} is getting hungry! 🍽️`,
        body:  `Come feed ${pet.name} before they get too hungry.`,
        schedule: { at: hungerTime },
      });
    } else if (pet.hunger < STAT_CRIT) {
      // Already critical — fire in 5 minutes as a nudge
      notifications.push({
        id:    NOTIF_HUNGER,
        title: `${pet.name} is really hungry! 😢`,
        body:  `${pet.name} needs food right now!`,
        schedule: { at: new Date(Date.now() + 5 * 60_000) },
      });
    }

    // Happiness notification
    const happyTime = TimeSystem.nextHappinessCritTime(pet);
    if (happyTime) {
      notifications.push({
        id:    NOTIF_HAPPINESS,
        title: `${pet.name} misses you! 💕`,
        body:  `${pet.name} is feeling a little lonely. Come say hi!`,
        schedule: { at: happyTime },
      });
    }

    // Sick / health critical
    if (pet.health < 40) {
      notifications.push({
        id:    NOTIF_SICK,
        title: `${pet.name} is feeling sick! 🤒`,
        body:  `${pet.name} needs attention right away.`,
        schedule: { at: new Date(Date.now() + 2 * 60_000) },
      });
    }

    if (notifications.length === 0) return;

    try {
      await this._ln.schedule({ notifications });
    } catch (err) {
      console.warn('[NotificationSystem] Schedule failed:', err.message);
    }
  }

  /** Schedule a "ready to evolve!" notification. */
  async scheduleEvolutionReady(pet, msUntilReady) {
    if (!this._ln || msUntilReady <= 0) return;
    try {
      await this._ln.schedule({
        notifications: [{
          id:    NOTIF_EVOLVE,
          title: `${pet.name} is ready to evolve! ✨`,
          body:  `Open Lumipet to see what ${pet.name} becomes!`,
          schedule: { at: new Date(Date.now() + msUntilReady) },
        }],
      });
    } catch {}
  }

  async _cancelAll() {
    if (!this._ln) return;
    try {
      const pending = await this._ln.getPending();
      if (pending.notifications?.length) {
        await this._ln.cancel({ notifications: pending.notifications });
      }
    } catch {}
  }
}

export const notificationSystem = new NotificationSystem();

import { FIREBASE_CONFIG } from '../constants.js';

const FEATURES = { LEADERBOARD: false };

/**
 * FirebaseService — analytics, leaderboards, and user sync.
 * All methods fail gracefully if Firebase is unavailable.
 */
class FirebaseService {
  constructor() {
    this._db = null;
    this._analytics = null;
    this._auth = null;
    this._uid = null;
    this._ready = false;
  }

  async init() {
    if (FIREBASE_CONFIG.apiKey === 'REPLACE_WITH_YOUR_KEY') {
      console.info('[FirebaseService] No config — running without Firebase.');
      return;
    }
    try {
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, setDoc, doc }
        = await import('firebase/firestore');
      const { getAnalytics, logEvent } = await import('firebase/analytics');
      const { getAuth, signInAnonymously } = await import('firebase/auth');

      const app = initializeApp(FIREBASE_CONFIG);
      this._db = getFirestore(app);
      this._analytics = getAnalytics(app);
      this._auth = getAuth(app);
      this._logEvent = logEvent;
      this._firestoreOps = { collection, addDoc, query, orderBy, limit, getDocs, setDoc, doc };

      const cred = await signInAnonymously(this._auth);
      this._uid = cred.user.uid;
      this._ready = true;
    } catch (err) {
      console.warn('[FirebaseService] Init failed:', err.message);
    }
  }

  get uid() { return this._uid; }

  // ── Analytics ────────────────────────────────────────────────────────────────

  event(name, params = {}) {
    if (!this._analytics || !this._logEvent) return;
    try { this._logEvent(this._analytics, name, params); } catch {}
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────────

  async submitScore(displayName, score, floor) {
    if (!FEATURES.LEADERBOARD || !this._db) return;
    try {
      const { addDoc, collection } = this._firestoreOps;
      await addDoc(collection(this._db, 'leaderboards', 'weekly', 'entries'), {
        uid: this._uid,
        displayName: displayName || 'Raider',
        score,
        floor,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[FirebaseService] Score submit failed:', err.message);
    }
  }

  async getTopScores(count = 20) {
    if (!FEATURES.LEADERBOARD || !this._db) return [];
    try {
      const { collection, query, orderBy, limit, getDocs } = this._firestoreOps;
      const q = query(
        collection(this._db, 'leaderboards', 'weekly', 'entries'),
        orderBy('score', 'desc'),
        limit(count)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (err) {
      console.warn('[FirebaseService] Fetch scores failed:', err.message);
      return [];
    }
  }

  // ── User Sync ────────────────────────────────────────────────────────────────

  async syncPlayer(playerState) {
    if (!this._db || !this._uid) return;
    try {
      const { setDoc, doc } = this._firestoreOps;
      await setDoc(doc(this._db, 'users', this._uid), {
        level: playerState.level,
        xp: playerState.xp,
        bestFloor: playerState.bestFloor,
        totalRuns: playerState.totalRuns,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseService] Player sync failed:', err.message);
    }
  }
}

export const firebaseService = new FirebaseService();

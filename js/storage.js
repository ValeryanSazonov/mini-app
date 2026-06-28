/**
 * storage.js - работа с localStorage
 * Хранит данные пользователя локально в браузере Telegram
 */

const Storage = {
  // Ключи хранилища
  KEYS: {
    BALANCE:      'podorozhnik_balance',
    CARD_NUMBER:  'podorozhnik_card',
    TRIPS:        'podorozhnik_trips',
    TOPUPS:       'podorozhnik_topups',
    NOTIF_PREF:   'podorozhnik_notif',
  },

  // ── Баланс ──
  getBalance() {
    const v = localStorage.getItem(this.KEYS.BALANCE);
    return v !== null ? parseFloat(v) : null;
  },
  setBalance(amount) {
    localStorage.setItem(this.KEYS.BALANCE, String(amount));
  },

  // ── Номер карты ──
  getCardNumber() {
    return localStorage.getItem(this.KEYS.CARD_NUMBER) || '';
  },
  setCardNumber(num) {
    localStorage.setItem(this.KEYS.CARD_NUMBER, String(num).slice(0, 4));
  },

  // ── Поездки ──
  getTrips() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.TRIPS)) || [];
    } catch { return []; }
  },
  addTrip(trip) {
    // trip: { id, type, route, cost, ts }
    const trips = this.getTrips();
    trips.unshift(trip); // новые сначала
    localStorage.setItem(this.KEYS.TRIPS, JSON.stringify(trips));
    return trips;
  },

  // ── Пополнения ──
  getTopups() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.TOPUPS)) || [];
    } catch { return []; }
  },
  addTopup(topup) {
    // topup: { id, amount, method, ts }
    const topups = this.getTopups();
    topups.unshift(topup);
    localStorage.setItem(this.KEYS.TOPUPS, JSON.stringify(topups));
    return topups;
  },

  // ── Настройки уведомлений ──
  getNotifPref() {
    const v = localStorage.getItem(this.KEYS.NOTIF_PREF);
    return v === null ? true : v === 'true'; // по умолчанию включено
  },
  setNotifPref(enabled) {
    localStorage.setItem(this.KEYS.NOTIF_PREF, String(enabled));
  },

  // ── Статистика ──
  getStats() {
    const trips = this.getTrips();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();

    const tripsThisMonth = trips.filter(t => {
      const d = new Date(t.ts);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    const totalSpent = trips.reduce((sum, t) => sum + (t.cost || 0), 0);
    const monthSpent = tripsThisMonth.reduce((sum, t) => sum + (t.cost || 0), 0);

    // Самый частый транспорт
    const counts = {};
    trips.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });
    const favType = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;

    return {
      total:       trips.length,
      monthCount:  tripsThisMonth.length,
      totalSpent,
      monthSpent,
      favType,
    };
  },
};

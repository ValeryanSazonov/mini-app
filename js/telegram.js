/**
 * telegram.js — Интеграция с Telegram Mini App API
 * Документация: https://core.telegram.org/bots/webapps
 */

const TG = {
  // Объект Telegram WebApp (инициализируется SDK из telegram-web-app.js)
  app: window.Telegram?.WebApp || null,

  init() {
    if (!this.app) {
      console.warn('Telegram WebApp API недоступен — работаем в обычном браузере');
      return;
    }

    // Сообщаем Telegram, что приложение готово
    this.app.ready();

    // Разворачиваем на весь экран
    this.app.expand();

    // Цвет шапки — под наш бренд
    this.app.setHeaderColor('#1D9E75');
  },

  // Получить имя пользователя из Telegram
  getUsername() {
    if (!this.app?.initDataUnsafe?.user) return null;
    const u = this.app.initDataUnsafe.user;
    return u.first_name || u.username || null;
  },

  // Получить user_id (для отправки уведомлений через бота)
  getUserId() {
    return this.app?.initDataUnsafe?.user?.id || null;
  },

  // Показать нативный алерт Telegram
  alert(message) {
    if (this.app) {
      this.app.showAlert(message);
    } else {
      alert(message);
    }
  },

  // Показать нативный confirm Telegram
  confirm(message, callback) {
    if (this.app) {
      this.app.showConfirm(message, callback);
    } else {
      callback(confirm(message));
    }
  },

  // Открыть внешнюю ссылку (пополнение на transportspb.com)
  openLink(url) {
    if (this.app) {
      this.app.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  },

  // Haptic feedback — тактильный отклик на действие
  haptic(type = 'light') {
    // type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning'
    try {
      if (this.app?.HapticFeedback) {
        if (['light','medium','heavy'].includes(type)) {
          this.app.HapticFeedback.impactOccurred(type);
        } else {
          this.app.HapticFeedback.notificationOccurred(type);
        }
      }
    } catch (e) { /* тихо игнорируем */ }
  },

  // Закрыть Mini App
  close() {
    this.app?.close();
  },
};

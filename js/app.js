/**
 * app.js - основная логика Подорожника
 * Инициализация, навигация, обновление UI
 */

// ─── Константы ───────────────────────────────────────────
const TRIP_PRICE   = 42;    // стандартная цена поездки в СПб (₽)
const LOW_BALANCE  = 100;   // порог низкого баланса (₽)
const TOPUP_URL    = 'https://transportspb.com/topup_podorozhnik';

const TRANSPORT_META = {
  metro:   { icon: '🚇', label: 'Метро',         color: 'ic-teal'   },
  bus:     { icon: '🚌', label: 'Автобус',        color: 'ic-amber'  },
  tram:    { icon: '🚋', label: 'Трамвай',        color: 'ic-purple' },
  trolley: { icon: '🚎', label: 'Троллейбус',     color: 'ic-blue'   },
};

// Текущее состояние формы добавления поездки
let _tripType   = 'metro';
let _topupAmt   = 200;

// ─── Инициализация ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  TG.init();
  renderHome();
  renderSettings();

  // Показываем имя из Telegram
  const uname = TG.getUsername();
  if (uname) {
    document.getElementById('tg-username').textContent = `Привет, ${uname} 👋`;
  }
});

// ─── Навигация ───────────────────────────────────────────
function switchTab(tab) {
  ['home','topup','history','routes','settings'].forEach(t => {
    document.getElementById('s-' + t)?.classList.remove('active');
    document.getElementById('nav-' + t)?.classList.remove('active');
  });
  document.getElementById('s-' + tab)?.classList.add('active');
  document.getElementById('nav-' + tab)?.classList.add('active');
  TG.haptic('light');

  // Обновляем нужные экраны при переходе
  if (tab === 'home')    renderHome();
  if (tab === 'history') renderHistory('trips');
}

// ─── Главная: рендер ─────────────────────────────────────
function renderHome() {
  const balance = Storage.getBalance();
  const stats   = Storage.getStats();
  const cardNum = Storage.getCardNumber();

  // Баланс
  const balanceEl = document.getElementById('balance-display');
  const badgeEl   = document.getElementById('balance-badge');
  const cardNumEl = document.getElementById('card-number-display');

  if (balance === null) {
    balanceEl.textContent = '— ₽';
    badgeEl.className     = 'badge badge-grey';
    badgeEl.textContent   = 'Введи баланс в настройках';
  } else {
    balanceEl.textContent = formatMoney(balance);
    if (balance < LOW_BALANCE) {
      badgeEl.className   = 'badge badge-warn';
      badgeEl.textContent = '⚠ Мало средств';
    } else {
      badgeEl.className   = 'badge badge-ok';
      badgeEl.textContent = '✓ В порядке';
    }
  }

  cardNumEl.textContent = cardNum ? `#**** ${cardNum}` : '';

  // Статистика
  document.getElementById('trips-count').textContent = stats.monthCount;
  document.getElementById('trips-spent').textContent = formatMoney(stats.monthSpent);

  // Последние поездки (до 3)
  const container = document.getElementById('recent-trips');
  const trips     = Storage.getTrips().slice(0, 3);
  renderTripRows(container, trips);
}

// ─── История ─────────────────────────────────────────────
let _histActiveTab = 'trips';

function switchHistTab(el, tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['trips','topups','stats'].forEach(n => {
    document.getElementById('hist-' + n).style.display = n === tabName ? 'block' : 'none';
  });
  _histActiveTab = tabName;
  renderHistory(tabName);
  TG.haptic('light');
}

function renderHistory(tab) {
  if (tab === 'trips') {
    const container = document.getElementById('trips-list');
    renderTripRows(container, Storage.getTrips());
  } else if (tab === 'topups') {
    renderTopupRows();
  } else if (tab === 'stats') {
    renderStats();
  }
}

function renderTripRows(container, trips) {
  if (!trips.length) {
    container.innerHTML = `<div class="empty-state"><p>Поездок пока нет</p><p class="empty-hint">Нажми «+ Добавить поездку»</p></div>`;
    return;
  }
  container.innerHTML = trips.map(t => {
    const meta = TRANSPORT_META[t.type] || TRANSPORT_META.bus;
    const label = t.route ? `${meta.label} ${t.route}` : meta.label;
    return `
      <div class="row">
        <div class="row-left">
          <div class="icon-circle ${meta.color}">${meta.icon}</div>
          <div>
            <div class="row-title">${escHtml(label)}</div>
            <div class="row-sub">${formatDate(t.ts)}</div>
          </div>
        </div>
        <div class="row-right neg">−${t.cost} ₽</div>
      </div>`;
  }).join('');
}

function renderTopupRows() {
  const container = document.getElementById('topups-list');
  const topups    = Storage.getTopups();
  if (!topups.length) {
    container.innerHTML = `<div class="empty-state"><p>Пополнений пока нет</p><p class="empty-hint">История появится после первого пополнения</p></div>`;
    return;
  }
  container.innerHTML = topups.map(t => `
    <div class="row">
      <div class="row-left">
        <div class="icon-circle ic-teal">💳</div>
        <div>
          <div class="row-title">${t.method === 'sbp' ? 'СБП' : 'Банковская карта'}</div>
          <div class="row-sub">${formatDate(t.ts)}</div>
        </div>
      </div>
      <div class="row-right pos">+${t.amount} ₽</div>
    </div>`).join('');
}

function renderStats() {
  const s = Storage.getStats();
  document.getElementById('stat-total').textContent       = s.total;
  document.getElementById('stat-month').textContent       = s.monthCount;
  document.getElementById('stat-spent-total').textContent = formatMoney(s.totalSpent);
  document.getElementById('stat-spent-month').textContent = formatMoney(s.monthSpent);

  const favEl = document.getElementById('stat-fav-transport');
  if (s.favType) {
    const meta = TRANSPORT_META[s.favType];
    favEl.textContent = `${meta.icon} ${meta.label}`;
  } else {
    favEl.textContent = '—';
  }
}

// ─── Добавить поездку ────────────────────────────────────
function showAddTrip() {
  document.getElementById('modal-add-trip').style.display = 'flex';
  document.getElementById('trip-route-input').value = '';
  document.getElementById('trip-cost-input').value  = TRIP_PRICE;
  // Сбрасываем тип
  _tripType = 'metro';
  document.querySelectorAll('.transport-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === 'metro');
  });
  TG.haptic('light');
}

function closeAddTrip() {
  document.getElementById('modal-add-trip').style.display = 'none';
}

function closeModal(event) {
  // Закрываем только при клике на оверлей, не на саму модалку
  if (event.target.classList.contains('modal-overlay')) closeAddTrip();
}

function selectTransport(el) {
  document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  _tripType = el.dataset.type;
  TG.haptic('light');
}

function addTrip() {
  const route  = document.getElementById('trip-route-input').value.trim();
  const costRaw = document.getElementById('trip-cost-input').value;
  const cost   = parseFloat(costRaw) || TRIP_PRICE;

  const trip = {
    id:    Date.now(),
    type:  _tripType,
    route: route,
    cost:  cost,
    ts:    new Date().toISOString(),
  };

  Storage.addTrip(trip);

  // Уменьшаем баланс, если он задан
  const balance = Storage.getBalance();
  if (balance !== null) {
    Storage.setBalance(Math.max(0, balance - cost));
  }

  closeAddTrip();
  renderHistory('trips');
  renderHome();
  TG.haptic('success');
}

// ─── Пополнение ──────────────────────────────────────────
function selectPayment(type) {
  document.getElementById('opt-sbp').classList.remove('selected');
  document.getElementById('opt-card').classList.remove('selected');
  document.getElementById('opt-' + type).classList.add('selected');
}

function selectAmount(el, amount) {
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const btn = document.getElementById('pay-btn');
  if (amount > 0) {
    _topupAmt = amount;
    btn.textContent = `Пополнить на ${amount.toLocaleString('ru')} ₽ →`;
  } else {
    _topupAmt = 0;
    btn.textContent = 'Ввести свою сумму →';
  }
}

function doTopup() {
  if (_topupAmt === 0) {
    // Своя сумма, просто открываем сайт
    TG.openLink(TOPUP_URL);
    return;
  }

  // Запоминаем намерение пополнить, фактическое подтверждение происходит вручную
  TG.confirm(
    `Перейти на transportspb.com для пополнения на ${_topupAmt} ₽?\n\nПосле оплаты вернись и обнови баланс в Настройках.`,
    (ok) => {
      if (!ok) return;
      // Логируем пополнение в историю
      const method = document.getElementById('opt-sbp').classList.contains('selected') ? 'sbp' : 'card';
      Storage.addTopup({
        id:     Date.now(),
        amount: _topupAmt,
        method: method,
        ts:     new Date().toISOString(),
      });
      TG.openLink(TOPUP_URL);
      TG.haptic('success');
    }
  );
}

// ─── Маршруты ────────────────────────────────────────────
function focusRouteField(field) {
  // MVP: открываем Яндекс.Карты для поиска маршрута
  const url = 'https://yandex.ru/maps/2/saint-petersburg/?rtext=';
  TG.openLink(url);
}

function findRoute() {
  const from = document.getElementById('route-from').textContent;
  const to   = document.getElementById('route-to').textContent;

  if (from === 'Введи станцию' || to === 'Введи станцию') {
    TG.alert('Укажи откуда и куда, или открой Яндекс.Карты для поиска маршрута.');
    return;
  }

  // MVP: открываем маршрут в Яндекс.Картах
  const url = `https://yandex.ru/maps/2/saint-petersburg/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=mt`;
  TG.openLink(url);
}

// ─── Настройки ───────────────────────────────────────────
function renderSettings() {
  const balance = Storage.getBalance();
  const cardNum = Storage.getCardNumber();
  const notif   = Storage.getNotifPref();

  if (balance !== null) document.getElementById('balance-input').value = balance;
  if (cardNum)          document.getElementById('card-number-input').value = cardNum;
  document.getElementById('notif-toggle').checked = notif;
}

function saveBalance(val) {
  const n = parseFloat(val);
  if (!isNaN(n) && n >= 0) {
    Storage.setBalance(n);
    renderHome();
  }
}

function saveCardNumber(val) {
  Storage.setCardNumber(val);
  renderHome();
}

function saveNotifPref(checked) {
  Storage.setNotifPref(checked);
}

// ─── Хелперы ─────────────────────────────────────────────
function formatMoney(amount) {
  return amount.toLocaleString('ru') + ' ₽';
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const day   = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const h     = d.getHours().toString().padStart(2, '0');
  const m     = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} · ${h}:${m}`;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

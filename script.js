const iconSets = {
  // Заміни шляхи на свої фото (png/jpg/webp). Зручно скласти по папках:
  // c:\Users\user\Desktop\казино\assets\icons\<set>\*.png
  standard: [
    { id: 'std1', src: 'assets/icons/standard/01.png' },
    { id: 'std2', src: 'assets/icons/standard/02.png' },
    { id: 'std3', src: 'assets/icons/standard/03.png' },
    { id: 'std4', src: 'assets/icons/standard/04.png' },
    { id: 'std5', src: 'assets/icons/standard/05.png' },
    { id: 'std6', src: 'assets/icons/standard/06.png' },
    { id: 'std7', src: 'assets/icons/standard/07.png' }
  ],
  animals: [
    { id: 'ani1', src: 'assets/icons/animals/01.png' },
    { id: 'ani2', src: 'assets/icons/animals/02.png' },
    { id: 'ani3', src: 'assets/icons/animals/03.png' },
    { id: 'ani4', src: 'assets/icons/animals/04.png' },
    { id: 'ani5', src: 'assets/icons/animals/05.png' },
    { id: 'ani6', src: 'assets/icons/animals/06.png' },
    { id: 'ani7', src: 'assets/icons/animals/07.png' }
  ],
  crystals: [
    { id: 'cry1', src: 'assets/icons/crystals/01.png' },
    { id: 'cry2', src: 'assets/icons/crystals/02.png' },
    { id: 'cry3', src: 'assets/icons/crystals/03.png' },
    { id: 'cry4', src: 'assets/icons/crystals/04.png' },
    { id: 'cry5', src: 'assets/icons/crystals/05.png' },
    { id: 'cry6', src: 'assets/icons/crystals/06.png' },
    { id: 'cry7', src: 'assets/icons/crystals/07.png' }
  ],
  hearts: [
    { id: 'hrt1', src: 'assets/icons/hearts/01.png' },
    { id: 'hrt2', src: 'assets/icons/hearts/02.png' },
    { id: 'hrt3', src: 'assets/icons/hearts/03.png' },
    { id: 'hrt4', src: 'assets/icons/hearts/04.png' },
    { id: 'hrt5', src: 'assets/icons/hearts/05.png' },
    { id: 'hrt6', src: 'assets/icons/hearts/06.png' },
    { id: 'hrt7', src: 'assets/icons/hearts/07.png' }
  ],
  food: [
    { id: 'fd1', src: 'assets/icons/food/01.png' },
    { id: 'fd2', src: 'assets/icons/food/02.png' },
    { id: 'fd3', src: 'assets/icons/food/03.png' },
    { id: 'fd4', src: 'assets/icons/food/04.png' },
    { id: 'fd5', src: 'assets/icons/food/05.png' },
    { id: 'fd6', src: 'assets/icons/food/06.png' },
    { id: 'fd7', src: 'assets/icons/food/07.png' }
  ]
};
let currentSymbols = iconSets.standard;

const rows = 5;
const cols = 6;
const spinCost = 100;
let balance = 100000;
let currentBet = 100; // поточна ставка (буде оновлюватись з поля)
const SPIN_DURATION = 3000; // 3 секунди
let isSpinning = false;

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body?.dataset?.page;

  // NEW: track internal link clicks to remember the previous page
  enablePrevPageTracking();

  if (page === 'history') {
    ensureGlobalBalanceBadge();
    // Render history list
    const list = document.getElementById('history-list');
    if (list) {
      list.innerHTML = '';
      const header = document.createElement('div');
      header.className = 'history-row header';
      header.innerHTML = `
        <div class="history-cell">Ставка</div>
        <div class="history-cell">Виграш</div>
        <div class="history-cell">Комбінація</div>
        <div class="history-cell center">×</div>
      `;
      list.appendChild(header);

      const data = loadWinHistory();
      data.slice().reverse().forEach(it => {
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
          <div class="history-cell">💎${it.bet}</div>
          <div class="history-cell">💎${it.win}</div>
          <div class="history-cell">${it.comboHtml || it.combo || ''}</div>
          <div class="history-cell center">x${it.mult}</div>
        `;
        list.appendChild(row);
      });
    }
    installBackLinks(); // ensure back works here
    return;
  }

  // NEW: Profile — capture avatar URL for reuse on the menu page
  if (page === 'profile') {
    ensureGlobalBalanceBadge();
    captureProfileAvatar();
    installBackLinks(); // ensure back works here
    return;
  }

  // Меню: показати баланс і підставити аватар
  if (page === 'menu') {
    ensureGlobalBalanceBadge();
    ensureMenuAvatar();
    // installBackLinks(); // прибрано, щоб не перезаписувати посилання карток ігор
    return;
  }

  // NEW: Blackjack page
  if (page === 'blackjack') {
    ensureGlobalBalanceBadge();

    // NEW: add top session bar like on index
    ensureSessionBar();

    // NEW: add left drawer like on index
    ensureDrawerForBlackjack();

    initBlackjack();
    return;
  }

  // нове: ігноруємо всі не-індексні сторінки (наприклад, support)
  if (page !== 'index') {
    ensureGlobalBalanceBadge();
    installBackLinks(); // ensure back works on other pages (e.g., topup, support)
    return;
  }

  // === Index page logic ===
  const styleButton = document.getElementById('style-button');
  const styleDropdown = document.getElementById('style-dropdown');
  const styleOptions = document.querySelectorAll('.style-option');
  const slotGrid = document.getElementById('slot-grid');
  const spinButton = document.getElementById('spin-button');
  const balanceDisplay = document.getElementById('balance');
  const winDisplay = document.getElementById('win-amount');
  const betInput = document.getElementById('bet-input');

  // Drawer elements
  const drawer = document.getElementById('right-drawer');
  const drawerToggle = document.getElementById('drawer-toggle');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const hoverZone = document.getElementById('drawer-hover-zone');
  const houseBtn = document.getElementById('drawer-house');

  // Session bar elements
  const sessionFeedEl = document.getElementById('session-feed');

  // ensure hidden at start
  styleDropdown.classList.add('hidden');

  // зчитати баланс з localStorage (якщо є)
  function loadBalanceFromStorage() {
    try {
      const raw = localStorage.getItem('balance');
      const val = raw !== null ? Math.floor(Number(raw)) : NaN;
      if (Number.isFinite(val) && val >= 0) balance = val;
    } catch (_) {}
  }
  function saveBalanceToStorage() {
    try { localStorage.setItem('balance', String(balance)); } catch (_) {}
  }

  loadBalanceFromStorage();

  // ініціалізуємо значення поля
  if (betInput) betInput.value = currentBet;

  function getRandomSymbol() {
    return currentSymbols[Math.floor(Math.random() * currentSymbols.length)];
  }

  function createGrid() {
    slotGrid.innerHTML = '';
    for (let i = 0; i < rows * cols; i++) {
      const cell = document.createElement('div');
      cell.className = 'slot-cell';
      const sym = getRandomSymbol();
      cell.dataset.symbol = sym.id;

      const img = document.createElement('img');
      img.className = 'icon-img';
      img.alt = sym.id;
      img.src = sym.src;

      cell.appendChild(img);
      slotGrid.appendChild(cell);
    }
  }

  function updateDisplay() {
    balanceDisplay.textContent = balance;
    saveBalanceToStorage();
  }

  function clearHighlights() {
    Array.from(slotGrid.children).forEach(c => {
      c.classList.remove('win-highlight', 'win-highlight-blue', 'dimmed');
    });
  }

  function getSymbolIdAt(r, c) {
    const idx = r * cols + c;
    const el = slotGrid.children[idx];
    return el ? el.dataset.symbol || null : null;
  }

  // Extend: return mult/kind/len/sym
  function checkMatches() {
    const multipliers = { 2: 0.25, 3: 0.5, 4: 1.25, 5: 3, 6: 20 };
    let best = { mult: 0, cells: [], kind: null, len: 0, sym: null };

    // rows
    for (let r = 0; r < rows; r++) {
      let count = 1, seq = [{ r, c: 0 }];
      for (let c = 1; c < cols; c++) {
        if (getSymbolIdAt(r, c) === getSymbolIdAt(r, c - 1)) { count++; seq.push({ r, c }); }
        else {
          if (count >= 2) {
            const mult = multipliers[count] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'row', len: count, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
          }
          count = 1; seq = [{ r, c }];
        }
      }
      if (count >= 2) {
        const mult = multipliers[count] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'row', len: count, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
      }
    }

    // cols
    for (let c = 0; c < cols; c++) {
      let count = 1, seq = [{ r: 0, c }];
      for (let r = 1; r < rows; r++) {
        if (getSymbolIdAt(r, c) === getSymbolIdAt(r - 1, c)) { count++; seq.push({ r, c }); }
        else {
          if (count >= 2) {
            const mult = multipliers[count] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'col', len: count, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
          }
          count = 1; seq = [{ r, c }];
        }
      }
      if (count >= 2) {
        const mult = multipliers[count] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'col', len: count, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
      }
    }

    // diag \
    for (let k = -(cols - 2); k <= rows - 2; k++) {
      let seq = [], prev = null;
      for (let r = 0; r < rows; r++) {
        const c = r - k;
        if (c < 0 || c >= cols) continue;
        const sym = getSymbolIdAt(r, c);
        if (prev === null || sym === prev) { seq.push({ r, c }); }
        else {
          if (seq.length >= 2) {
            const mult = multipliers[seq.length] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'diag\\', len: seq.length, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
          }
          seq = [{ r, c }];
        }
        prev = sym;
      }
      if (seq.length >= 2) {
        const mult = multipliers[seq.length] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'diag\\', len: seq.length, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
      }
    }

    // diag /
    for (let s = 1; s <= rows + cols - 3; s++) {
      let seq = [], prev = null;
      for (let r = 0; r < rows; r++) {
        const c = s - r;
        if (c < 0 || c >= cols) continue;
        const sym = getSymbolIdAt(r, c);
        if (prev === null || sym === prev) { seq.push({ r, c }); }
        else {
          if (seq.length >= 2) {
            const mult = multipliers[seq.length] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'diag/', len: seq.length, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
          }
          seq = [{ r, c }];
        }
        prev = sym;
      }
      if (seq.length >= 2) {
        const mult = multipliers[seq.length] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice(), kind: 'diag/', len: seq.length, sym: getSymbolIdAt(seq[0].r, seq[0].c) };
      }
    }

    return {
      win: best.mult > 0 ? Math.floor(currentBet * best.mult) : 0,
      mult: best.mult, kind: best.kind, len: best.len, sym: best.sym,
      cells: best.cells
    };
  }

  // toggle menu
  styleButton.addEventListener('click', () => {
    styleDropdown.classList.toggle('hidden');
  });

  // select style -> apply and close
  styleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      if (isSpinning) return; // не змінюємо стиль під час обертання
      const s = opt.getAttribute('data-style');
      if (s && iconSets[s]) currentSymbols = iconSets[s];
      styleDropdown.classList.add('hidden');
      createGrid();
    });
  });

  // Drawer helpers
  function setDrawer(open) {
    if (!drawer) return;
    if (open) {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'true');
      if (drawerOverlay) {
        drawerOverlay.hidden = false;
        drawerOverlay.classList.add('active');
      }
      // сховати меню стилів, якщо відкрите
      styleDropdown.classList.add('hidden');
    } else {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'false');
      if (drawerOverlay) {
        drawerOverlay.classList.remove('active');
        // невелика пауза, щоб анімація згасання відпрацювала
        setTimeout(() => { if (drawerOverlay && !drawer.classList.contains('open')) drawerOverlay.hidden = true; }, 200);
      }
    }
  }

  // Hover logic to open/close by moving cursor to the left edge
  let hoverCloseTimeout = null;
  let isOverZone = false;
  let isOverDrawer = false;
  let isOverHouse = false;

  function scheduleClose() {
    clearTimeout(hoverCloseTimeout);
    hoverCloseTimeout = setTimeout(() => {
      if (!isOverZone && !isOverDrawer && !isOverHouse) setDrawer(false);
    }, 160);
  }

  if (hoverZone) {
    hoverZone.addEventListener('mouseenter', () => {
      isOverZone = true;
      setDrawer(true);
    });
    hoverZone.addEventListener('mouseleave', () => {
      isOverZone = false;
      scheduleClose();
    });
  }

  if (houseBtn) {
    houseBtn.addEventListener('mouseenter', () => {
      isOverHouse = true;
      setDrawer(true);
    });
    houseBtn.addEventListener('mouseleave', () => {
      isOverHouse = false;
      scheduleClose();
    });
    houseBtn.addEventListener('click', () => {
      const open = !drawer.classList.contains('open');
      setDrawer(open);
    });
  }

  if (drawer) {
    drawer.addEventListener('mouseenter', () => {
      isOverDrawer = true;
      clearTimeout(hoverCloseTimeout);
    });
    drawer.addEventListener('mouseleave', () => {
      isOverDrawer = false;
      scheduleClose();
    });
  }

  if (drawerToggle) {
    drawerToggle.addEventListener('click', () => {
      const open = !drawer.classList.contains('open');
      setDrawer(open);
    });
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', () => setDrawer(false));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setDrawer(false);
  });

  // Optional: close drawer when clicking any drawer item (link or button)
  drawer?.addEventListener('click', (e) => {
    const item = e.target.closest('.drawer-item a, .drawer-item button');
    if (item) setDrawer(false);
  });

  // запуск анімації обертання слотів на duration мс
  function startSpinAnimation(durationMs = SPIN_DURATION) {
    clearHighlights();
    winDisplay.textContent = 0;

    slotGrid.classList.add('is-spinning');

    // змінюємо зображення по колонках на різних швидкостях
    const intervalIds = [];
    for (let c = 0; c < cols; c++) {
      const speed = 60 + c * 20;
      const id = setInterval(() => {
        for (let r = 0; r < rows; r++) {
          const idx = r * cols + c;
          const el = slotGrid.children[idx];
          if (!el) continue;
          const img = el.querySelector('img.icon-img');
          const sym = getRandomSymbol();
          if (img) img.src = sym.src;
          el.dataset.symbol = sym.id;
        }
      }, speed);
      intervalIds.push(id);
    }

    setTimeout(() => {
      intervalIds.forEach(clearInterval);
      slotGrid.classList.remove('is-spinning');

      // фінальна сітка (перемалюємо, щоб зафіксувати стан)
      createGrid();

      setTimeout(() => {
        clearHighlights();
        const result = checkMatches();
        if (result.win > 0 && result.cells && result.cells.length) {
          Array.from(slotGrid.children).forEach(c => c.classList.add('dimmed'));
          result.cells.forEach(pos => {
            const idx = pos.r * cols + pos.c;
            const el = slotGrid.children[idx];
            if (el) {
              el.classList.remove('dimmed');
              el.classList.add('win-highlight-blue');
            }
          });
          balance += result.win;
          winDisplay.textContent = result.win;
          updateDisplay();

          // Побудувати chip: [іконка] 💎win · xmult
          let iconSrc = '';
          const firstCell = result.cells[0];
          if (firstCell) {
            const idx0 = firstCell.r * cols + firstCell.c;
            const node0 = slotGrid.children[idx0];
            const img0 = node0?.querySelector('img.icon-img');
            iconSrc = img0?.src || '';
          }
          if (sessionFeedEl) {
            const chip = document.createElement('div');
            chip.className = 'session-chip';
            chip.innerHTML = `
              ${iconSrc ? `<img src="${iconSrc}" alt="icon">` : ''}
              <span>💎${result.win}</span>
              <span>·</span>
              <span>x${result.mult ?? 0}</span>
            `;
            // Нові виграші зліва — додаємо на початок
            sessionFeedEl.prepend(chip);
          }

          // Зберегти у історію (з іконкою)
          const comboHtml = `${iconSrc ? `<img class="history-icon" src="${iconSrc}" alt="${result.sym || 'icon'}"> ` : ''}${kindLabel(result.kind)} ${result.len}`;
          addWinToHistory({ bet: currentBet, win: result.win, comboHtml, mult: result.mult });
        } else {
          winDisplay.textContent = 0;
          clearHighlights();
        }

        isSpinning = false;
        spinButton.disabled = false;
        if (betInput) betInput.disabled = false;
      }, 30);
    }, durationMs);
  }

  // ОНОВЛЕННЯ: обробник кнопки SPIN - з 3-секундною анімацією
  spinButton.addEventListener('click', () => {
    if (isSpinning) return;

    const raw = betInput ? Number(betInput.value) : NaN;
    const bet = Number.isFinite(raw) ? Math.floor(raw) : NaN;

    if (!bet || bet < 1) { alert('Введіть коректну ставку (ціле число >= 1).'); return; }
    if (bet > balance) { alert('Ставка більша, ніж баланс.'); return; }

    currentBet = bet;

    balance -= currentBet;
    updateDisplay();

    isSpinning = true;
    spinButton.disabled = true;
    if (betInput) betInput.disabled = true;

    // розпочинаємо 3-секундну анімацію
    startSpinAnimation(SPIN_DURATION);
  });

  // initial render
  updateDisplay();
  createGrid();
});

// === Win history helpers (shared) ===
function loadWinHistory() {
  try { return JSON.parse(localStorage.getItem('winHistory') || '[]'); } catch { return []; }
}
function saveWinHistory(arr) {
  try { localStorage.setItem('winHistory', JSON.stringify(arr.slice(-25))); } catch {}
}
function addWinToHistory(entry) {
  const arr = loadWinHistory();
  arr.push({ ...entry, ts: Date.now() });
  saveWinHistory(arr);
}
function kindLabel(kind) {
  switch (kind) {
    case 'row': return 'ряд';
    case 'col': return 'стовп';
    case 'diag\\': return 'діагональ ↘';
    case 'diag/': return 'діагональ ↗';
    default: return 'комбінація';
  }
}

// === Global balance badge helpers (shared) ===
function getStoredBalance() {
  try {
    const raw = localStorage.getItem('balance');
    const val = raw !== null ? Math.floor(Number(raw)) : NaN;
    return Number.isFinite(val) && val >= 0 ? val : 0;
  } catch {
    return 0;
  }
}
function ensureGlobalBalanceBadge() {
  const current = getStoredBalance();
  let badge = document.getElementById('global-balance-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'global-balance-badge';
    badge.className = 'balance page-balance-fixed';
    badge.innerHTML = `Balance: 💎<span id="global-balance-value">${current}</span>`;
    document.body.appendChild(badge);
  } else {
    const span = badge.querySelector('#global-balance-value');
    if (span) span.textContent = String(current);
  }
}

function ensureMenuAvatar() {
  const wrap = document.getElementById('menu-avatar');
  const img = document.getElementById('menu-avatar-img');
  if (!wrap || !img) return;
  let url = '';
  try { url = localStorage.getItem('profileAvatarUrl') || ''; } catch {}
  if (url) {
    img.src = url;
  } else {
    wrap.classList.add('placeholder');
    img.remove();
    wrap.textContent = '👤';
  }
}

// NEW: Save avatar URL from profile.html into localStorage
function captureProfileAvatar() {
  const img = document.querySelector('.profile-avatar img');
  const src = img?.src || '';
  if (src) {
    try { localStorage.setItem('profileAvatarUrl', src); } catch {}
  }
}

// NEW: compute back target URL (prefer referrer, then sessionStorage, then menu.html)
function computeBackHref() {
  let target = '';
  try {
    const ref = document.referrer || '';
    if (ref) {
      const u = new URL(ref, location.href);
      if (u.origin === location.origin && u.href !== location.href) target = u.href;
    }
  } catch {}
  if (!target) {
    try {
      const prev = sessionStorage.getItem('prevUrl') || '';
      if (prev && prev !== location.href) target = prev;
    } catch {}
  }
  if (!target) target = 'menu.html';
  return target;
}

// NEW: bind “На головну” links/buttons to go back
function installBackLinks() {
  const backHref = computeBackHref();
  const nodes = document.querySelectorAll('a, button');
  const candidates = Array.from(nodes).filter(el => {
    if (el.dataset.backBound === '1') return false;
    // не чіпаємо картки ігор у меню
    if (el.classList?.contains('game-fullcard')) return false;
    if (el.closest?.('.menu-cards-wrap')) return false;

    // common classes/text
    if (el.classList.contains('btn-back')) return true;
    if (el.matches('.btn, .topup-btn')) return true;           // NEW: profile/topup buttons
    if (isAnchorToIndex(el)) return true;                       // NEW: any anchor to index.html
    const txt = (el.textContent || '').trim();
    return /На головну/i.test(txt);                             // text fallback
  });

  candidates.forEach(el => {
    el.dataset.backBound = '1';
    if (el.tagName.toLowerCase() === 'a') el.setAttribute('href', backHref);
    el.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const hasRef = !!document.referrer;
        const sameOrigin = hasRef ? (new URL(document.referrer, location.href).origin === location.origin) : false;
        if (sameOrigin && history.length > 1) history.back();
        else location.assign(backHref);
      } catch {
        location.assign(backHref);
      }
    });
  });

  // keep a fallback reference for pages reached without referrer (e.g., opened directly)
  try { sessionStorage.setItem('prevUrl', location.href); } catch {}
}

// NEW: remember current page before navigating to any same-origin link
function enablePrevPageTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target?.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return;
    try {
      const u = new URL(href, location.href);
      if (u.origin === location.origin) {
        sessionStorage.setItem('prevUrl', location.href);
      }
    } catch {}
  }, true);
}

// NEW: check if element is an anchor that points to index.html
function isAnchorToIndex(el) {
  if (!el || el.tagName?.toLowerCase() !== 'a') return false;
  const raw = el.getAttribute('href') || '';
  if (!raw) return false;
  return /(^|\/)index\.html(\?|#|$)/i.test(raw.trim());
}

// === BLACKJACK ===
function initBlackjack() {
  const deckEl = document.getElementById('bj-deck');
  const dealerHandEl = document.getElementById('dealer-hand');
  const playerHandEl = document.getElementById('player-hand');
  const betInput = document.getElementById('bj-bet');
  const btnDeal = document.getElementById('bj-deal');
  const btnHit = document.getElementById('bj-hit');
  const btnStand = document.getElementById('bj-stand');
  const btnDouble = document.getElementById('bj-double');
  const btnNew = document.getElementById('bj-new');
  const statusEl = document.getElementById('bj-status');

  // NEW: image settings (you can change base/ext)
  const CARD_IMG_BASE = 'assets/cards';
  const CARD_IMG_EXT  = 'jpg';            // was 'png'
  const BACK_IMG      = `${CARD_IMG_BASE}/back.${CARD_IMG_EXT}`;
  /* Naming convention for 52 face images (UPPERCASE):
     Rank + SuitLetter, where SuitLetter is: S (♠), H (♥), D (♦), C (♣)
     Ranks: A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2
     Examples: AS.jpg, KH.jpg, QD.jpg, JC.jpg, 10S.jpg, 2C.jpg
     Place also: back.jpg (or back.<ext>) in assets/cards */

  // show the deck as back image
  if (deckEl) {
    deckEl.style.backgroundImage = `url("${BACK_IMG}")`;
    deckEl.style.backgroundSize = 'cover';
    deckEl.style.backgroundPosition = 'center';
  }

  const state = {
    shoe: [],
    dealer: [],
    player: [],
    bet: 100,
    inRound: false,
    playerDone: false,
    dealerRevealed: false
  };

  try {
    const raw = localStorage.getItem('balance');
    if (raw !== null) balanceSet(Number(raw));
  } catch {}

  betInput.addEventListener('input', () => {
    const v = Math.max(1, Math.floor(Number(betInput.value) || 1));
    betInput.value = String(v);
    state.bet = v;
  });

  btnDeal.addEventListener('click', onDeal);
  btnHit.addEventListener('click', onHit);
  btnStand.addEventListener('click', onStand);
  btnDouble.addEventListener('click', onDouble);
  btnNew.addEventListener('click', resetTable);

  resetTable(true);

  function resetTable(first = false) {
    state.dealer = [];
    state.player = [];
    state.inRound = false;
    state.playerDone = false;
    state.dealerRevealed = false;
    dealerHandEl.innerHTML = '';
    playerHandEl.innerHTML = '';
    status('');
    setButtons({ deal: true, hit: false, stand: false, dbl: false, next: false });

    const surface = document.querySelector('.bj-surface');
    if (surface) surface.querySelectorAll('.bj-card').forEach(el => el.remove()); // очистити старі карти з поверхні

    if (first || state.shoe.length < 15) {
      state.shoe = buildShuffledShoe(1);
    }
  }

  function onDeal() {
    if (state.inRound) return;
    const bet = Math.max(1, Math.floor(Number(betInput.value) || 1));
    state.bet = bet;
    if (getBalance() < bet) { alert('Недостатньо балансу'); return; }
    balanceAdd(-bet);

    state.inRound = true;
    dealerHandEl.innerHTML = '';
    playerHandEl.innerHTML = '';
    state.dealer = [];
    state.player = [];
    status('Роздача...');

    // Послідовна роздача: гравець, дилер, гравець, дилер(закрита)
    const seq = [
      { to: 'player', faceDown: false },
      { to: 'dealer', faceDown: false },
      { to: 'player', faceDown: false },
      { to: 'dealer', faceDown: true }
    ];

    dealSequence(seq, 420).then(() => {
      // Початкова перевірка блекджека
      const pBJ = isBlackjack(state.player);
      const dBJ = isBlackjack(state.dealer);
      if (pBJ || dBJ) {
        revealDealerHole().then(() => settleRound(true));
      } else {
        status('Ваш хід');
        setButtons({ deal: false, hit: true, stand: true, dbl: true, next: false });
      }
    });
  }

  function onHit() {
    if (!state.inRound || state.playerDone) return;
    setButtons({ dbl: false }); // після HIT подвійна не доступна
    dealOne('player', false).then(() => {
      const pVal = handValue(state.player);
      if (pVal > 21) {
        state.playerDone = true;
        status('Перебір! Дилер перемагає.');
        revealDealerHole().then(() => settleRound());
      }
    });
  }

  function onStand() {
    if (!state.inRound) return;
    state.playerDone = true;
    status('Хід дилера...');
    setButtons({ hit: false, stand: false, dbl: false });
    revealDealerHole().then(dealerPlay).then(settleRound);
  }

  function onDouble() {
    if (!state.inRound || state.player.length !== 2) return;
    if (getBalance() < state.bet) { alert('Недостатньо балансу для подвоєння'); return; }
    balanceAdd(-state.bet);
    state.bet *= 2;
    setButtons({ hit: false, stand: false, dbl: false });
    dealOne('player', false).then(() => {
      state.playerDone = true;
      revealDealerHole().then(dealerPlay).then(settleRound);
    });
  }

  function dealSequence(items, gapMs = 350) {
    return items.reduce((p, it, idx) => {
      return p.then(() => dealOne(it.to, it.faceDown)).then(() => wait(gapMs));
    }, Promise.resolve());
  }

  function dealerPlay() {
    return new Promise(resolve => {
      const step = () => {
        const val = handValue(state.dealer, true); // S17: стоїмо на софт-17
        const hard = handValue(state.dealer, false);
        const isSoft = val !== hard && val <= 21;
        const dealerTotal = val <= 21 ? val : hard;

        if (dealerTotal < 17 || (dealerTotal === 17 && !isSoft && hard < 17)) {
          // беремо ще
          dealOne('dealer', false).then(() => setTimeout(step, 380));
        } else {
          resolve();
        }
      };
      step();
    });
  }

  function settleRound(force = false) {
    const p = bestValue(state.player);
    const d = bestValue(state.dealer);

    let msg = '';
    let delta = 0;

    if (!force) {
      if (p > 21) { msg = 'Перебір. Поразка.'; delta = 0; done(); return; }
    }

    const pBJ = isBlackjack(state.player);
    const dBJ = isBlackjack(state.dealer);

    if (pBJ && !dBJ) {
      msg = 'Blackjack! Виграш 3:2';
      delta = Math.floor(state.bet * 2.5);
    } else if (!pBJ && dBJ) {
      msg = 'Дилер має Blackjack. Поразка.';
      delta = 0;
    } else if (p > 21 && d > 21) {
      msg = 'Обом перебір. Нічия.';
      delta = state.bet; // повернення ставки
    } else if (p > 21) {
      msg = 'Перебір. Поразка.';
    } else if (d > 21) {
      msg = 'Дилер перебрав. Перемога!';
      delta = state.bet * 2;
    } else if (p > d) {
      msg = 'Перемога!';
      delta = state.bet * 2;
    } else if (p < d) {
      msg = 'Поразка.';
      delta = 0;
    } else {
      msg = 'Нічия (Push).';
      delta = state.bet;
    }

    balanceAdd(delta);
    status(`${msg} (Ви: ${p}, Дилер: ${d})`);

    // NEW: log blackjack wins to history.html — ×2 and show score as combo
    if (delta > state.bet) {
      addWinToHistory({
        bet: state.bet,
        win: state.bet * 2,         // завжди показуємо х2, як просили
        comboHtml: `Рахунок: ${p}:${d}`,
        mult: 2
      });
    }

    // Show Win as bet × 2 only on player win, else 0
    const feed = document.getElementById('session-feed');
    if (feed) {
      const playerWon = delta > state.bet; // win: 2×bet (or 2.5×bet for BJ)
      const shownWin = playerWon ? state.bet * 2 : 0;
      const chip = document.createElement('div');
      chip.className = 'session-chip';
      chip.innerHTML = `
        <span>Ставка: 💎${state.bet}</span>
        <span>·</span>
        <span>Виграш: 💎${shownWin}</span>
        <span>·</span>
        <span>Рахунок: ${p}:${d}</span>
      `;
      feed.prepend(chip);
    }

    // Add Blackjack to History (x2 shown per requirement)
    if (pBJ && !dBJ) {
      addWinToHistory({
        bet: state.bet,
        win: state.bet * 2,
        comboHtml: 'Blackjack',
        mult: 2
      });
    }

    done();

    function done() {
      state.inRound = false;
      setButtons({ hit: false, stand: false, dbl: false, deal: false, next: true });
    }
  }

  function revealDealerHole() {
    if (state.dealerRevealed) return Promise.resolve();
    state.dealerRevealed = true;
    // Знайти другу карту дилера на поверхні за owner+idx
    const holeIdx = 1;
    const cardEl = document.querySelector(`.bj-surface .bj-card[data-owner="dealer"][data-idx="${holeIdx}"]`);
    if (cardEl) cardEl.classList.remove('face-down');
    return wait(380);
  }

  // === Cards/deck helpers ===
  function buildShuffledShoe(decks = 1) {
    const ranks = ['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
    const suits = ['♠','♥','♦','♣'];
    const arr = [];
    for (let d=0; d<decks; d++) {
      for (const s of suits) for (const r of ranks) arr.push({ r, s });
    }
    for (let i=arr.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
  function cardValue(r) {
    if (r === 'A') return [1,11];
    if (r === 'K' || r === 'Q' || r === 'J' || r === '10') return [10];
    return [Number(r)];
  }
  function handValue(cards, softPref = true) {
    // повертає найкраще значення <=21; якщо softPref — намагаємось рахувати туз як 11
    let sums = [0];
    for (const c of cards) {
      const vals = cardValue(c.r);
      const next = [];
      for (const s of sums) for (const v of vals) next.push(s+v);
      sums = next;
    }
    sums.sort((a,b)=>b-a);
    const under = sums.find(v=>v<=21);
    if (under != null) return under;
    return Math.min(...sums); // перебір
  }
  function bestValue(cards) {
    return handValue(cards, true);
  }
  function isBlackjack(cards) {
    if (cards.length !== 2) return false;
    const ranks = cards.map(c=>c.r);
    return (ranks.includes('A') && (ranks.includes('10') || ranks.includes('K') || ranks.includes('Q') || ranks.includes('J')));
  }

  // === Deal/flip/render ===
  function dealOne(side, faceDown) {
    const card = state.shoe.pop();
    if (!card) return Promise.resolve();
    (side === 'player' ? state.player : state.dealer).push(card);

    const idx = (side === 'player' ? state.player.length - 1 : state.dealer.length - 1);

    // Завжди летимо сорочкою вниз; відкриємо після приземлення якщо треба
    const shouldReveal = !faceDown;
    const flying = createCardEl(card, true);
    flying.dataset.owner = side;
    flying.dataset.idx = String(idx);

    const surface = document.querySelector('.bj-surface');
    surface.appendChild(flying);

    // Координати у системі .bj-surface
    const from = deckEl.getBoundingClientRect();
    const toLane = (side === 'player' ? playerHandEl : dealerHandEl).getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();

    const offsetX = (toLane.left - surfaceRect.left) + 20 + idx * 28;
    const offsetY = (toLane.top  - surfaceRect.top)  + 6;
    const rot = (Math.random() * 8 - 4).toFixed(2);

    flying.style.setProperty('--from-tx', `translate(${from.left - surfaceRect.left}px, ${from.top - surfaceRect.top}px)`);
    flying.style.setProperty('--to-tx',   `translate(${offsetX}px, ${offsetY}px)`);
    flying.style.setProperty('--from-rot', `0deg`);
    flying.style.setProperty('--to-rot', `${rot}deg`);
    flying.style.animation = 'bjDeal 360ms ease forwards';

    return wait(360).then(() => {
      flying.classList.add('in-hand');
      flying.style.animation = '';
      flying.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rot}deg)`;
      // НЕ переприв'язуємо до .bj-hand — лишаємо в .bj-surface, щоб не було стрибка

      if (shouldReveal) {
        return wait(180).then(() => { flying.classList.remove('face-down'); });
      }
    });
  }
  function createCardEl(card, faceDown) {
    const el = document.createElement('div');
    el.className = 'bj-card face-down';
    if (!faceDown) el.classList.remove('face-down'); // kept for compatibility if ever used elsewhere

    const frontSrc = cardImgSrc(card); // e.g. assets/cards/AS.png
    const backSrc  = BACK_IMG;

    el.innerHTML = `
      <div class="inner">
        <div class="face front"><img alt="${cardCode(card)}" src="${frontSrc}"></div>
        <div class="face back"><img alt="back" src="${backSrc}"></div>
      </div>
    `;
    return el;
  }

  // Map rank/suit to filename like AS.png, 10H.png, KD.png, etc.
  function cardCode(c) {
    const suitMap = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };
    return `${c.r}${suitMap[c.s] || ''}`;
  }
  function cardImgSrc(c) {
    return `${CARD_IMG_BASE}/${cardCode(c)}.${CARD_IMG_EXT}`;
  }
  function suitGlyph(s) { return s; } // kept for compatibility; not used now

  // === Balance helpers (reuse global storage) ===
  function getBalance() {
    try { return Math.max(0, Math.floor(Number(localStorage.getItem('balance'))||0)); } catch { return 0; }
  }
  function balanceSet(v) {
    const val = Math.max(0, Math.floor(v||0));
    try { localStorage.setItem('balance', String(val)); } catch {}
    ensureGlobalBalanceBadge();
  }
  function balanceAdd(delta) {
    const v = getBalance()+Math.floor(delta||0);
    balanceSet(v);
  }

  function setButtons(partial) {
    btnDeal.disabled   = partial.deal === undefined ? btnDeal.disabled   : !partial.deal;
    btnHit.disabled    = partial.hit  === undefined ? btnHit.disabled    : !partial.hit;
    btnStand.disabled  = partial.stand=== undefined ? btnStand.disabled  : !partial.stand;
    btnDouble.disabled = partial.dbl  === undefined ? btnDouble.disabled : !partial.dbl;
    btnNew.disabled    = partial.next === undefined ? btnNew.disabled    : !partial.next;
  }
  function status(txt) { statusEl.textContent = txt || ''; }
  function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
}

// NEW: ensure a session bar with a feed exists on the page
function ensureSessionBar() {
  if (document.getElementById('session-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'session-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Інфо по виграшам за сеанс');
  bar.innerHTML = `
    <div class="session-inner">
      <div id="session-feed" aria-live="polite" aria-atomic="false"></div>
    </div>
  `;
  document.body.prepend(bar);
}

// NEW: build the same drawer UI on blackjack and wire interactions (self-contained)
function ensureDrawerForBlackjack() {
  if (document.getElementById('right-drawer')) return;

  // hover zone + toggle button
  const hoverZone = document.createElement('div');
  hoverZone.id = 'drawer-hover-zone';
  hoverZone.setAttribute('aria-hidden', 'true');

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'drawer-toggle';
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-controls', 'right-drawer');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.textContent = '☰ Меню';

  // drawer + content + house handle
  const drawer = document.createElement('aside');
  drawer.id = 'right-drawer';
  drawer.className = 'drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <nav class="drawer-content" aria-label="Бічне меню">
      <a class="drawer-title" href="menu.html">ГОЛОВНЕ МЕНЮ</a>
      <ul class="drawer-list">
        <li class="drawer-item"><a href="profile.html" data-action="profile">💼Мій кабінет💼</a></li>
        <li class="drawer-item"><a href="topup.html" data-action="topup">💳Поповнення балансу💳</a></li>
        <li class="drawer-item"><a href="history.html" data-action="history">📜Історія виграшу📜</a></li>
        <li class="drawer-item"><a href="support.html" data-action="support">🛠️Тех. підтримка🛠️</a></li>
      </ul>
    </nav>
    <button id="drawer-house" type="button" aria-label="Меню">🏠</button>
  `;
  const overlay = document.createElement('div');
  overlay.id = 'drawer-overlay';
  overlay.className = 'drawer-overlay';
  overlay.hidden = true;

  document.body.appendChild(hoverZone);
  document.body.appendChild(toggleBtn);
  document.body.appendChild(drawer);
  document.body.appendChild(overlay);

  // interactions (trimmed but same UX)
  const setDrawer = (open) => {
    if (open) {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      overlay.hidden = false; overlay.classList.add('active');
    } else {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('active');
      setTimeout(() => { if (!drawer.classList.contains('open')) overlay.hidden = true; }, 200);
    }
  };

  let hoverCloseTimeout = null;
  let isOverZone = false, isOverDrawer = false, isOverHouse = false;
  const scheduleClose = () => {
    clearTimeout(hoverCloseTimeout);
    hoverCloseTimeout = setTimeout(() => {
      if (!isOverZone && !isOverDrawer && !isOverHouse) setDrawer(false);
    }, 160);
  };

  hoverZone.addEventListener('mouseenter', () => { isOverZone = true; setDrawer(true); });
  hoverZone.addEventListener('mouseleave', () => { isOverZone = false; scheduleClose(); });

  const houseBtn = drawer.querySelector('#drawer-house');
  houseBtn.addEventListener('mouseenter', () => { isOverHouse = true; setDrawer(true); });
  houseBtn.addEventListener('mouseleave', () => { isOverHouse = false; scheduleClose(); });
  houseBtn.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));

  drawer.addEventListener('mouseenter', () => { isOverDrawer = true; clearTimeout(hoverCloseTimeout); });
  drawer.addEventListener('mouseleave', () => { isOverDrawer = false; scheduleClose(); });

  toggleBtn.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  overlay.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

  // close when clicking any drawer item
  drawer.addEventListener('click', (e) => {
    const item = e.target.closest('.drawer-item a, .drawer-item button');
    if (item) setDrawer(false);
  });
}



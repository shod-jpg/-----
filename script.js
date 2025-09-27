const iconSets = {
  standard: ['💎','⚡','👑','🔥','🍇','💰','🔔'],
  animals: ['🦁','🐯','🐻','🦊','🐺','🦓','🦒'],
  crystals: ['💎','🔷','🔶','🔮','✨','🪙','🌟'],
  hearts: ['❤️','💖','💘','💝','💗','💕','🧡'],
  food: ['🍔','🍕','🍩','🍓','🍇','🍟','🍭']
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

  // ensure hidden at start
  styleDropdown.classList.add('hidden');

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
      cell.textContent = getRandomSymbol();
      slotGrid.appendChild(cell);
    }
  }

  function updateDisplay() {
    balanceDisplay.textContent = balance;
  }

  function clearHighlights() {
    Array.from(slotGrid.children).forEach(c => {
      c.classList.remove('win-highlight', 'win-highlight-blue', 'dimmed');
    });
  }

  function checkMatches() {
    const multipliers = {
      2: 0.25,
      3: 0.5,
      4: 1.25,
      5: 3,
      6: 20
    };

    let best = { mult: 0, cells: [] };

    function getSymbol(r, c) {
      const idx = r * cols + c;
      const el = slotGrid.children[idx];
      return el ? el.textContent : null;
    }

    // горизонталі (ряди)
    for (let r = 0; r < rows; r++) {
      let count = 1;
      let seq = [{ r, c: 0 }];
      for (let c = 1; c < cols; c++) {
        if (getSymbol(r, c) === getSymbol(r, c - 1)) {
          count++;
          seq.push({ r, c });
        } else {
          if (count >= 2) {
            const mult = multipliers[count] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice() };
          }
          count = 1;
          seq = [{ r, c }];
        }
      }
      if (count >= 2) {
        const mult = multipliers[count] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice() };
      }
    }

    // вертикалі (стовпці)
    for (let c = 0; c < cols; c++) {
      let count = 1;
      let seq = [{ r: 0, c }];
      for (let r = 1; r < rows; r++) {
        if (getSymbol(r, c) === getSymbol(r - 1, c)) {
          count++;
          seq.push({ r, c });
        } else {
          if (count >= 2) {
            const mult = multipliers[count] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice() };
          }
          count = 1;
          seq = [{ r, c }];
        }
      }
      if (count >= 2) {
        const mult = multipliers[count] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice() };
      }
    }

    // діагоналі \ (r - c = const)
    for (let k = -(cols - 2); k <= rows - 2; k++) {
      let seq = [];
      let prev = null;
      for (let r = 0; r < rows; r++) {
        const c = r - k;
        if (c < 0 || c >= cols) continue;
        const sym = getSymbol(r, c);
        if (prev === null || sym === prev) {
          seq.push({ r, c });
        } else {
          if (seq.length >= 2) {
            const mult = multipliers[seq.length] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice() };
          }
          seq = [{ r, c }];
        }
        prev = sym;
      }
      if (seq.length >= 2) {
        const mult = multipliers[seq.length] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice() };
      }
    }

    // діагоналі / (r + c = const)
    for (let s = 1; s <= rows + cols - 3; s++) {
      let seq = [];
      let prev = null;
      for (let r = 0; r < rows; r++) {
        const c = s - r;
        if (c < 0 || c >= cols) continue;
        const sym = getSymbol(r, c);
        if (prev === null || sym === prev) {
          seq.push({ r, c });
        } else {
          if (seq.length >= 2) {
            const mult = multipliers[seq.length] || 0;
            if (mult > best.mult) best = { mult, cells: seq.slice() };
          }
          seq = [{ r, c }];
        }
        prev = sym;
      }
      if (seq.length >= 2) {
        const mult = multipliers[seq.length] || 0;
        if (mult > best.mult) best = { mult, cells: seq.slice() };
      }
    }

    return {
      win: best.mult > 0 ? Math.floor(currentBet * best.mult) : 0,
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

  // Optional: close drawer when clicking any drawer item
  drawer?.addEventListener('click', (e) => {
    const btn = e.target.closest('.drawer-item button');
    if (btn) setDrawer(false);
  });

  // запуск анімації обертання слотів на duration мс
  function startSpinAnimation(durationMs = SPIN_DURATION) {
    clearHighlights();
    winDisplay.textContent = 0;

    // візуальна анімація
    slotGrid.classList.add('is-spinning');

    // змінюємо символи по колонках на різних швидкостях
    const intervalIds = [];
    for (let c = 0; c < cols; c++) {
      const speed = 60 + c * 20; // трохи повільніше для кожної наступної колонки
      const id = setInterval(() => {
        for (let r = 0; r < rows; r++) {
          const idx = r * cols + c;
          const el = slotGrid.children[idx];
          if (el) el.textContent = currentSymbols[Math.floor(Math.random() * currentSymbols.length)];
        }
      }, speed);
      intervalIds.push(id);
    }

    // зупинка через durationMs: фіксуємо остаточну сітку і рахуємо виграш
    setTimeout(() => {
      intervalIds.forEach(clearInterval);
      slotGrid.classList.remove('is-spinning');

      // фінальна сітка
      createGrid();

      // невелика пауза щоб DOM перемалювався
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



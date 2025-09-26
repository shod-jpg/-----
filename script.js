const iconSets = {
    standard: ['💎', '⚡', '👑', '🔥', '🍇', '💰', '🔔'],
    animals: ['🦁', '🐯', '🐻', '🦊', '🐺', '🦓', '🦒'],
    crystals: ['💎', '🔷', '🔶', '🔮', '✨', '🪙', '🌟'],
    hearts: ['❤️', '💖', '💘', '💝', '💗', '💕', '🧡'],
    food: ['🍔', '🍕', '🍩', '🍓', '🍇', '🍟', '🍭']
  };
  
  let currentSymbols = iconSets.standard;
  
const grid = document.getElementById('slot-grid');
const spinButton = document.getElementById('spin-button');
const balanceDisplay = document.getElementById('balance');
const winDisplay = document.getElementById('win-amount');

const rows = 6;
const cols = 6;
const spinCost = 100;
let balance = 100000;

function getRandomSymbol() {
  return currentSymbols[Math.floor(Math.random() * currentSymbols.length)];
}

function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement('div');
    cell.className = 'slot-cell';
    cell.textContent = getRandomSymbol();
    grid.appendChild(cell);
  }
}

function updateDisplay() {
  balanceDisplay.textContent = balance;
}

function getCell(row, col) {
  return grid.children[row * cols + col];
}

function checkMatches() {
  const multipliers = {
    2: 0.25,
    3: 0.75,
    4: 1.25,
    5: 2.5,
    6: 10
  };
  let bestCombo = {mult: 0, cells: []};

  // Ряди
  for (let r = 0; r < rows; r++) {
    let count = 1;
    let tempCells = [getCell(r, 0)];
    for (let c = 1; c < cols; c++) {
      if (getCell(r, c).textContent === getCell(r, c - 1).textContent) {
        count++;
        tempCells.push(getCell(r, c));
      } else {
        if (count >= 2 && multipliers[count] > bestCombo.mult) {
          bestCombo.mult = multipliers[count];
          bestCombo.cells = tempCells.slice();
        }
        count = 1;
        tempCells = [getCell(r, c)];
      }
    }
    if (count >= 2 && multipliers[count] > bestCombo.mult) {
      bestCombo.mult = multipliers[count];
      bestCombo.cells = tempCells.slice();
    }
  }

  // Стовпці
  for (let c = 0; c < cols; c++) {
    let count = 1;
    let tempCells = [getCell(0, c)];
    for (let r = 1; r < rows; r++) {
      if (getCell(r, c).textContent === getCell(r - 1, c).textContent) {
        count++;
        tempCells.push(getCell(r, c));
      } else {
        if (count >= 2 && multipliers[count] > bestCombo.mult) {
          bestCombo.mult = multipliers[count];
          bestCombo.cells = tempCells.slice();
        }
        count = 1;
        tempCells = [getCell(r, c)];
      }
    }
    if (count >= 2 && multipliers[count] > bestCombo.mult) {
      bestCombo.mult = multipliers[count];
      bestCombo.cells = tempCells.slice();
    }
  }

  // Діагональ ↘
  for (let d = -(rows - 2); d <= cols - 2; d++) {
    let count = 0;
    let tempCells = [];
    for (let r = 0; r < rows; r++) {
      let c = r + d;
      if (c >= 0 && c < cols) {
        if (tempCells.length === 0 || getCell(r, c).textContent === tempCells[tempCells.length - 1].textContent) {
          count++;
          tempCells.push(getCell(r, c));
        } else {
          if (count >= 2 && multipliers[count] > bestCombo.mult) {
            bestCombo.mult = multipliers[count];
            bestCombo.cells = tempCells.slice();
          }
          count = 1;
          tempCells = [getCell(r, c)];
        }
      }
    }
    if (count >= 2 && multipliers[count] > bestCombo.mult) {
      bestCombo.mult = multipliers[count];
      bestCombo.cells = tempCells.slice();
    }
  }

  // Діагональ ↙
  for (let d = 1; d <= rows + cols - 2; d++) {
    let count = 0;
    let tempCells = [];
    for (let r = 0; r < rows; r++) {
      let c = d - r;
      if (c >= 0 && c < cols) {
        if (tempCells.length === 0 || getCell(r, c).textContent === tempCells[tempCells.length - 1].textContent) {
          count++;
          tempCells.push(getCell(r, c));
        } else {
          if (count >= 2 && multipliers[count] > bestCombo.mult) {
            bestCombo.mult = multipliers[count];
            bestCombo.cells = tempCells.slice();
          }
          count = 1;
          tempCells = [getCell(r, c)];
        }
      }
    }
    if (count >= 2 && multipliers[count] > bestCombo.mult) {
      bestCombo.mult = multipliers[count];
      bestCombo.cells = tempCells.slice();
    }
  }

  // Підсвічування
  Array.from(grid.children).forEach(cell => {
    cell.classList.add('slot-cell-dark');
    cell.classList.remove('win-highlight-blue');
  });
  bestCombo.cells.forEach(cell => {
    cell.classList.remove('slot-cell-dark');
    cell.classList.add('win-highlight-blue');
  });

  return {win: bestCombo.mult > 0 ? Math.floor(spinCost * bestCombo.mult) : 0, cells: bestCombo.cells};
}

function clearHighlights() {
  Array.from(grid.children).forEach(cell => {
    cell.classList.remove('slot-cell-dark');
    cell.classList.remove('win-highlight-blue');
    cell.classList.remove('win-highlight');
  });
}

function spinSlots() {
  if (balance < spinCost) {
    alert("Недостатньо коштів!");
    return;
  }

  balance -= spinCost;
  updateDisplay();
  winDisplay.textContent = 0;

  const spinDuration = 3000;

  clearHighlights();

  let isWinSpin = Math.random() < 0.4;
  if (!isWinSpin) {
    createGrid(true);
  }

  const columns = [];
  for (let c = 0; c < cols; c++) {
    columns[c] = [];
    for (let r = 0; r < rows; r++) {
      const index = r * cols + c;
      columns[c].push(grid.children[index]);
    }
  }

  columns.forEach((colCells) => {
    let step = 0;
    const maxSteps = 20;
    const interval = setInterval(() => {
      colCells.forEach(cell => {
        cell.textContent = getRandomSymbol();
      });
      step++;
      if (step >= maxSteps) clearInterval(interval);
    }, spinDuration / maxSteps);
  });

  setTimeout(() => {
    let winResult = {win: 0, cells: []};
    if (isWinSpin) {
      winResult = checkMatches();
    }
    if (winResult.win > 0) {
      balance += winResult.win;
      winDisplay.textContent = winResult.win;
      updateDisplay();
      setTimeout(() => {
        clearHighlights();
      }, 2000);
    } else {
      winDisplay.textContent = 0;
      updateDisplay();
      clearHighlights();
    }
  }, spinDuration + 200);
}

spinButton.addEventListener('click', spinSlots);
createGrid();
updateDisplay();


const styleButton = document.getElementById('style-button');
const styleDropdown = document.getElementById('style-dropdown');
const styleOptions = document.querySelectorAll('.style-option');

styleButton.addEventListener('click', () => {
  styleDropdown.classList.toggle('hidden');
});

styleOptions.forEach(option => {
  option.addEventListener('click', () => {
    const selectedStyle = option.getAttribute('data-style');
    currentSymbols = iconSets[selectedStyle];
    styleDropdown.classList.add('hidden');
    createGrid(); // Оновлюємо слот-сітку
  });
});

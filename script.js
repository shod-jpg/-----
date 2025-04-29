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

const rows = 5;
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
  let win = 0;
  let matchedCells = new Set();

  // Горизонтальні ряди
  for (let r = 0; r < rows; r++) {
    let currentSymbol = getCell(r, 0).textContent;
    let match = true;
    for (let c = 1; c < cols; c++) {
      if (getCell(r, c).textContent !== currentSymbol) {
        match = false;
        break;
      }
    }
    if (match) {
      win += 300;
      for (let c = 0; c < cols; c++) {
        matchedCells.add(getCell(r, c));
      }
    }
  }

  // Діагоналі ↘
  for (let startCol = 0; startCol <= cols - rows; startCol++) {
    let match = true;
    let symbol = getCell(0, startCol).textContent;
    for (let i = 1; i < rows; i++) {
      if (getCell(i, startCol + i).textContent !== symbol) {
        match = false;
        break;
      }
    }
    if (match) {
      win += 500;
      for (let i = 0; i < rows; i++) {
        matchedCells.add(getCell(i, startCol + i));
      }
    }
  }

  // Діагоналі ↙
  for (let startCol = rows - 1; startCol < cols; startCol++) {
    let match = true;
    let symbol = getCell(0, startCol).textContent;
    for (let i = 1; i < rows; i++) {
      if (getCell(i, startCol - i).textContent !== symbol) {
        match = false;
        break;
      }
    }
    if (match) {
      win += 500;
      for (let i = 0; i < rows; i++) {
        matchedCells.add(getCell(i, startCol - i));
      }
    }
  }

  // Повне поле одним символом
  const firstSymbol = getCell(0, 0).textContent;
  let allMatch = true;
  for (let i = 0; i < rows * cols; i++) {
    if (grid.children[i].textContent !== firstSymbol) {
      allMatch = false;
      break;
    }
  }
  if (allMatch) {
    win += 1000000;
    for (let i = 0; i < rows * cols; i++) {
      matchedCells.add(grid.children[i]);
    }
  }

  // Підсвічування виграшу
  matchedCells.forEach(cell => {
    cell.classList.add('win-highlight');
  });

  return win;
}

function spinSlots() {
  if (balance < spinCost) {
    alert("Недостатньо коштів!");
    return;
  }

  balance -= spinCost;
  updateDisplay();
  winDisplay.textContent = 0;

  const spinDuration = Math.floor(Math.random() * 2000 + 3000);

  // Видаляємо попереднє підсвічування
  Array.from(grid.children).forEach(cell => {
    cell.classList.remove('win-highlight');
  });

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
    const winAmount = checkMatches();
    if (winAmount > 0) {
      balance += winAmount;
    }
    winDisplay.textContent = winAmount;
    updateDisplay();
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

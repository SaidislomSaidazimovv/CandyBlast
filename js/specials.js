// ═══ SPECIAL CANDY CONSTANTS ═══
const SPECIAL = {
  NONE:      null,
  STRIPED_H: 'striped-h',
  STRIPED_V: 'striped-v',
  BOMB:      'bomb',
  WRAPPED:   'wrapped',
};

// ═══ GRID HELPERS ═══
function getType(r, c) {
  if (r < 0 || r >= GRID || c < 0 || c >= GRID) return -1;
  const v = grid[r][c];
  if (v === null || v === undefined || v === -1) return -1;
  return typeof v === 'object' ? v.type : v;
}

function getSpecial(r, c) {
  if (r < 0 || r >= GRID || c < 0 || c >= GRID) return null;
  const v = grid[r][c];
  if (typeof v === 'object' && v !== null) return v.special || null;
  return null;
}

function setCell(r, c, type, special) {
  grid[r][c] = special ? { type, special } : type;
}

function isEmpty(r, c) {
  if (r < 0 || r >= GRID || c < 0 || c >= GRID) return true;
  return grid[r][c] === -1 || grid[r][c] === null || grid[r][c] === undefined;
}

// ═══ MATCH DETECTION WITH SPECIALS ═══
function findMatchesNew(preferredCells = []) {
  const matched = new Set();
  const specialCreations = [];
  const preferredInRun=(row,start,end,vertical=false)=>{
    const chosen=preferredCells.find(p=>vertical?p.c===row&&p.r>=start&&p.r<end:p.r===row&&p.c>=start&&p.c<end);
    return chosen ? (vertical?chosen.r:chosen.c) : start+Math.floor((end-start)/2);
  };

  // Horizontal runs
  for (let r = 0; r < GRID; r++) {
    let run = 1;
    for (let c = 1; c <= GRID; c++) {
      const same = c < GRID && getType(r, c) === getType(r, c - 1) && getType(r, c) !== -1;
      if (same) { run++; }
      else {
        if (run >= 3) {
          const startC = c - run;
          for (let k = startC; k < c; k++) matched.add(r * GRID + k);
          if (run === 4) {
            specialCreations.push({ r, c: preferredInRun(r,startC,c), special: SPECIAL.STRIPED_H, type: getType(r, startC) });
          } else if (run >= 5) {
            specialCreations.push({ r, c: preferredInRun(r,startC,c), special: SPECIAL.BOMB, type: getType(r, startC) });
          }
        }
        run = 1;
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID; c++) {
    let run = 1;
    for (let r = 1; r <= GRID; r++) {
      const same = r < GRID && getType(r, c) === getType(r - 1, c) && getType(r, c) !== -1;
      if (same) { run++; }
      else {
        if (run >= 3) {
          const startR = r - run;
          for (let k = startR; k < r; k++) matched.add(k * GRID + c);
          if (run === 4) {
            specialCreations.push({ r: preferredInRun(c,startR,r,true), c, special: SPECIAL.STRIPED_V, type: getType(startR, c) });
          } else if (run >= 5) {
            specialCreations.push({ r: preferredInRun(c,startR,r,true), c, special: SPECIAL.BOMB, type: getType(startR, c) });
          }
        }
        run = 1;
      }
    }
  }

  // L/T shape detection → Wrapped candy
  const hCells = new Set(), vCells = new Set();
  for (let r = 0; r < GRID; r++) {
    let run = 1, startC = 0;
    for (let c = 1; c <= GRID; c++) {
      const same = c < GRID && getType(r, c) === getType(r, c - 1) && getType(r, c) !== -1;
      if (same) run++;
      else { if (run >= 3) for (let k = startC; k < c; k++) hCells.add(r * GRID + k); startC = c; run = 1; }
    }
  }
  for (let c = 0; c < GRID; c++) {
    let run = 1, startR = 0;
    for (let r = 1; r <= GRID; r++) {
      const same = r < GRID && getType(r, c) === getType(r - 1, c) && getType(r, c) !== -1;
      if (same) run++;
      else { if (run >= 3) for (let k = startR; k < r; k++) vCells.add(k * GRID + c); startR = r; run = 1; }
    }
  }
  hCells.forEach(idx => {
    if (vCells.has(idx)) {
      const r = Math.floor(idx / GRID), c = idx % GRID;
      // Remove any existing non-wrapped special at this position
      const existing = specialCreations.findIndex(s => s.r === r && s.c === c);
      if (existing >= 0) specialCreations.splice(existing, 1);
      specialCreations.push({ r, c, special: SPECIAL.WRAPPED, type: getType(r, c) });
    }
  });

  return {
    matched: [...matched].map(idx => ({ r: Math.floor(idx / GRID), c: idx % GRID })),
    specialCreations
  };
}

// ═══ SPECIAL CANDY ACTIVATION ═══
const SPECIAL_PTS = 40; // bonus pts per cell destroyed by specials

function activateSpecial(r, c, triggeredCells) {
  const sp = getSpecial(r, c);
  const type = getType(r, c);
  if (!sp) return 0;

  const sizeBefore = triggeredCells.size;
  const toRemove = [];

  if (sp === SPECIAL.STRIPED_H) {
    for (let col = 0; col < GRID; col++) toRemove.push({ r, c: col });
    showLaserH(r);
  } else if (sp === SPECIAL.STRIPED_V) {
    for (let row = 0; row < GRID; row++) toRemove.push({ r: row, c });
    showLaserV(c);
  } else if (sp === SPECIAL.BOMB) {
    for (let row = 0; row < GRID; row++)
      for (let col = 0; col < GRID; col++)
        if (getType(row, col) === type) toRemove.push({ r: row, c: col });
    showBombEffect(r, c);
  } else if (sp === SPECIAL.WRAPPED) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) toRemove.push({ r: nr, c: nc });
      }
    showWrappedEffect(r, c);
  }

  toRemove.forEach(({ r: rr, c: cc }) => {
    const idx = rr * GRID + cc;
    if (!triggeredCells.has(idx)) {
      triggeredCells.add(idx);
      // Chain: if this cell is also special, activate it too
      const innerSp = getSpecial(rr, cc);
      if (innerSp && !(rr === r && cc === c)) {
        activateSpecial(rr, cc, triggeredCells);
      }
      const el = getCell(rr, cc);
      if (el && settings.anim) el.classList.add('matched');
      removeCandy(rr,cc);
    }
  });

  // Return count of EXTRA cells destroyed (beyond what was already triggered)
  return triggeredCells.size - sizeBefore;
}

// ═══ SPECIAL COMBO (two specials swapped together) ═══
const COMBO_PTS = 50; // pts per cell for special combos

function handleSpecialCombo(r1, c1, r2, c2) {
  const sp1 = getSpecial(r1, c1), sp2 = getSpecial(r2, c2);
  const t1 = getType(r1, c1), t2 = getType(r2, c2);
  const triggered = new Set();

  playMatch(8);
  vibrate(80);

  const isStripe = s => s === SPECIAL.STRIPED_H || s === SPECIAL.STRIPED_V;
  const removeAt=(r,c)=>{
    if(r<0||c<0||r>=GRID||c>=GRID||getType(r,c)<0)return;
    triggered.add(r*GRID+c);
    const el=getCell(r,c);if(el&&settings.anim)el.classList.add('matched');
    removeCandy(r,c);
  };
  const clearRow=r=>{for(let c=0;c<GRID;c++)removeAt(r,c);};
  const clearCol=c=>{for(let r=0;r<GRID;r++)removeAt(r,c);};
  const clearArea=(r,c,radius)=>{for(let dr=-radius;dr<=radius;dr++)for(let dc=-radius;dc<=radius;dc++)removeAt(r+dr,c+dc);};

  if (sp1 === SPECIAL.BOMB && sp2 === SPECIAL.BOMB) {
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) removeAt(r,c);
    showBombEffect(r1, c1);
  } else if ((sp1 === SPECIAL.BOMB && isStripe(sp2)) || (sp2 === SPECIAL.BOMB && isStripe(sp1))) {
    const targetType=sp1===SPECIAL.BOMB?t2:t1;
    const targets=[];for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(getType(r,c)===targetType)targets.push({r,c});
    targets.forEach((p,i)=>i%2?clearCol(p.c):clearRow(p.r));
    removeAt(r1,c1);removeAt(r2,c2);showBombEffect(r1,c1);
  } else if ((sp1 === SPECIAL.BOMB && sp2 === SPECIAL.WRAPPED) || (sp2 === SPECIAL.BOMB && sp1 === SPECIAL.WRAPPED)) {
    const targetType=sp1===SPECIAL.BOMB?t2:t1;
    const targets=[];for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(getType(r,c)===targetType)targets.push({r,c});
    targets.forEach(p=>clearArea(p.r,p.c,1));removeAt(r1,c1);removeAt(r2,c2);showBombEffect(r1,c1);
  } else if ((isStripe(sp1) && sp2 === SPECIAL.WRAPPED) || (isStripe(sp2) && sp1 === SPECIAL.WRAPPED)) {
    for(let offset=-1;offset<=1;offset++){if(r1+offset>=0&&r1+offset<GRID){clearRow(r1+offset);showLaserH(r1+offset);}if(c1+offset>=0&&c1+offset<GRID){clearCol(c1+offset);showLaserV(c1+offset);}}
  } else if (isStripe(sp1) && isStripe(sp2)) {
    clearRow(r1);clearCol(c2);
    showLaserH(r1); showLaserV(c2);
  } else if (sp1 === SPECIAL.WRAPPED && sp2 === SPECIAL.WRAPPED) {
    clearArea(r1,c1,2);
    showWrappedEffect(r1, c1);
  } else {
    triggered.add(r1 * GRID + c1); triggered.add(r2 * GRID + c2);
    activateSpecial(r1, c1, triggered);
    activateSpecial(r2, c2, triggered);
    removeCandy(r1,c1); removeCandy(r2,c2);
  }

  window.Candy3D?.effect?.('special',{cells:[...triggered],strength:Math.min(5,1+triggered.size/12)});
  return triggered;
}

// ═══ VISUAL EFFECTS ═══
function showLaserH(row) {
  const bw = document.getElementById('board-wrap');
  if (!bw) return;
  const bRect = bw.getBoundingClientRect();
  const cellH = bRect.height / GRID;
  const laser = document.createElement('div');
  laser.style.cssText = `position:fixed;left:${bRect.left}px;top:${bRect.top + row * cellH + cellH / 2 - 3}px;width:${bRect.width}px;height:6px;background:linear-gradient(90deg,transparent,#fff,#ffe259,#fff,transparent);border-radius:3px;box-shadow:0 0 12px rgba(255,220,89,0.8);z-index:100;animation:laserFade 0.5s ease forwards;pointer-events:none;`;
  document.body.appendChild(laser);
  setTimeout(() => laser.remove(), 600);
}

function showLaserV(col) {
  const bw = document.getElementById('board-wrap');
  if (!bw) return;
  const bRect = bw.getBoundingClientRect();
  const cellW = bRect.width / GRID;
  const laser = document.createElement('div');
  laser.style.cssText = `position:fixed;left:${bRect.left + col * cellW + cellW / 2 - 3}px;top:${bRect.top}px;width:6px;height:${bRect.height}px;background:linear-gradient(180deg,transparent,#fff,#ffe259,#fff,transparent);border-radius:3px;box-shadow:0 0 12px rgba(255,220,89,0.8);z-index:100;animation:laserFade 0.5s ease forwards;pointer-events:none;`;
  document.body.appendChild(laser);
  setTimeout(() => laser.remove(), 600);
}

function showBombEffect(r, c) {
  const cell = getCell(r, c);
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.style.cssText = `position:fixed;left:${rect.left + rect.width / 2 - 50}px;top:${rect.top + rect.height / 2 - 50}px;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,100,200,0.6),transparent);z-index:100;pointer-events:none;animation:bombBurst 0.6s ease forwards;`;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 700);
}

function showWrappedEffect(r, c) {
  const cell = getCell(r, c);
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;left:${rect.left + rect.width / 2 - 60}px;top:${rect.top + rect.height / 2 - 60}px;width:120px;height:120px;border-radius:50%;border:4px solid rgba(255,150,255,0.8);box-shadow:0 0 20px rgba(255,150,255,0.6);z-index:100;pointer-events:none;animation:wrappedBurst 0.5s ease forwards;`;
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 600);
}

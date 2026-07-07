// World list / create / delete.
export function renderWorldSelect(worlds, onCreate, onDelete, onPlay) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#87CEEB,#5B8C3E);font-family:'Courier New',monospace;color:#fff;display:flex;flex-direction:column;align-items:center;padding-top:60px;">
      <h1 style="text-shadow:2px 2px 0 #000;margin-bottom:32px;">Select World</h1>
      <div id="worldList" style="width:480px;margin-bottom:24px;"></div>
      <div style="background:rgba(0,0,0,0.7);padding:24px;border-radius:8px;width:480px;">
        <h3 style="margin-bottom:12px;">Create New World</h3>
        <input id="worldName" placeholder="World name" style="width:100%;padding:8px;margin-bottom:8px;background:#333;color:#fff;border:2px solid #555;box-sizing:border-box;" />
        <input id="worldSeed" type="number" placeholder="Seed (random if empty)" style="width:100%;padding:8px;margin-bottom:8px;background:#333;color:#fff;border:2px solid #555;box-sizing:border-box;" />
        <select id="worldMode" style="width:100%;padding:8px;margin-bottom:12px;background:#333;color:#fff;border:2px solid #555;box-sizing:border-box;">
          <option value="creative">Creative</option>
          <option value="survival">Survival</option>
        </select>
        <button id="createBtn" style="width:100%;padding:10px;background:#4a8c2e;color:#fff;border:2px solid #2c5a18;cursor:pointer;font-weight:bold;">CREATE WORLD</button>
      </div>
    </div>
  `;

  const list = document.getElementById('worldList');
  if (worlds.length === 0) {
    list.innerHTML = '<p style="text-align:center;opacity:0.7;">No worlds yet. Create one below.</p>';
  } else {
    list.innerHTML = worlds.map(w => `
      <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.6);padding:12px;margin-bottom:8px;border-radius:4px;">
        <div>
          <div style="font-weight:bold;">${w.name}</div>
          <div style="font-size:11px;opacity:0.7;">Seed: ${w.seed} • ${w.gamemode}</div>
        </div>
        <div>
          <button class="play-btn" data-id="${w.id}" style="padding:6px 12px;background:#4a8c2e;color:#fff;border:2px solid #2c5a18;cursor:pointer;margin-right:4px;">PLAY</button>
          <button class="del-btn" data-id="${w.id}" style="padding:6px 12px;background:#8c2e2e;color:#fff;border:2px solid #5a1818;cursor:pointer;">DELETE</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.play-btn').forEach(b => b.onclick = () => onPlay(parseInt(b.dataset.id, 10)));
    list.querySelectorAll('.del-btn').forEach(b => b.onclick = () => onDelete(parseInt(b.dataset.id, 10)));
  }

  document.getElementById('createBtn').onclick = () => {
    const name = document.getElementById('worldName').value.trim() || `World ${Date.now()}`;
    const seedStr = document.getElementById('worldSeed').value.trim();
    const seed = seedStr ? parseInt(seedStr, 10) : Math.floor(Math.random() * 2_000_000_000);
    const gamemode = document.getElementById('worldMode').value;
    onCreate(name, seed, gamemode);
  };
}

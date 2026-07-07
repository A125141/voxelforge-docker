// Login / register / guest screen.
export function renderLoginScreen(onAuthed) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#87CEEB,#5B8C3E);font-family:'Courier New',monospace;">
      <div style="background:rgba(0,0,0,0.7);padding:32px 40px;border-radius:8px;color:#fff;width:320px;">
        <h1 style="text-align:center;margin-bottom:8px;text-shadow:2px 2px 0 #000;">VoxelForge</h1>
        <p style="text-align:center;margin-bottom:24px;font-size:12px;opacity:0.8;">A self-hosted voxel sandbox</p>
        <div id="authError" style="color:#ff8080;font-size:12px;min-height:16px;margin-bottom:8px;"></div>
        <input id="username" type="text" placeholder="Username" style="width:100%;padding:8px;margin-bottom:8px;background:#333;color:#fff;border:2px solid #555;box-sizing:border-box;" />
        <input id="password" type="password" placeholder="Password" style="width:100%;padding:8px;margin-bottom:16px;background:#333;color:#fff;border:2px solid #555;box-sizing:border-box;" />
        <button id="loginBtn" style="width:100%;padding:10px;margin-bottom:8px;background:#4a8c2e;color:#fff;border:2px solid #2c5a18;cursor:pointer;font-family:inherit;font-weight:bold;">LOGIN</button>
        <button id="registerBtn" style="width:100%;padding:10px;margin-bottom:8px;background:#6b4f2a;color:#fff;border:2px solid #3d2c15;cursor:pointer;font-family:inherit;font-weight:bold;">REGISTER</button>
        <button id="guestBtn" style="width:100%;padding:10px;background:#444;color:#fff;border:2px solid #222;cursor:pointer;font-family:inherit;">PLAY AS GUEST</button>
      </div>
    </div>
  `;

  const setError = (msg) => { document.getElementById('authError').textContent = msg; };

  document.getElementById('loginBtn').onclick = async () => {
    try {
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      await api.login(u, p);
      onAuthed();
    } catch (e) { setError(e.message); }
  };
  document.getElementById('registerBtn').onclick = async () => {
    try {
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      await api.register(u, p);
      onAuthed();
    } catch (e) { setError(e.message); }
  };
  document.getElementById('guestBtn').onclick = async () => {
    try { await api.guest(); onAuthed(); }
    catch (e) { setError(e.message); }
  };
}

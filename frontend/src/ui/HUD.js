// Hotbar, crosshair, debug overlay.
import { Block, BlockNames, CREATIVE_HOTBAR } from '../utils/constants.js';

export class HUD {
  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:monospace;color:#fff;';
    document.body.appendChild(this.el);
    this._render();
  }

  _render() {
    this.el.innerHTML = `
      <div id="crosshair" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;">
        <div style="position:absolute;top:9px;left:0;width:20px;height:2px;background:#fff;mix-blend-mode:difference;"></div>
        <div style="position:absolute;left:9px;top:0;width:2px;height:20px;background:#fff;mix-blend-mode:difference;"></div>
      </div>
      <div id="hotbar" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:2px;background:rgba(0,0,0,0.5);padding:4px;border-radius:4px;">
        ${Array.from({ length: 9 }, (_, i) => `
          <div class="slot" data-i="${i}" style="width:44px;height:44px;border:2px solid ${i === 0 ? '#fff' : '#555'};background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:10px;">
            <span class="slot-label">${BlockNames[CREATIVE_HOTBAR[i]]?.substring(0,4) || ''}</span>
          </div>
        `).join('')}
      </div>
      <div id="debug" style="position:absolute;top:8px;left:8px;font-size:12px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;"></div>
      <div id="gamemode" style="position:absolute;top:8px;right:8px;font-size:12px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;">CREATIVE</div>
    `;
  }

  setSelectedSlot(i) {
    this.el.querySelectorAll('.slot').forEach((s, idx) => {
      s.style.borderColor = idx === i ? '#fff' : '#555';
    });
  }

  setHotbar(items) {
    this.el.querySelectorAll('.slot').forEach((s, idx) => {
      const label = s.querySelector('.slot-label');
      label.textContent = items[idx] ? BlockNames[items[idx]]?.substring(0, 4) || '' : '';
    });
  }

  setDebug(text) { this.el.querySelector('#debug').textContent = text; }
  setGamemode(mode) { this.el.querySelector('#gamemode').textContent = mode.toUpperCase(); }

  dispose() { this.el.remove(); }
}

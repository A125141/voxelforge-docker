// Inventory screen (basic — opens with E, lists all blocks in creative).
import { Block, BlockNames } from '../utils/constants.js';

export class Inventory {
  constructor(player, onClose) {
    this.player = player;
    this.onClose = onClose;
    this.visible = false;
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;font-family:monospace;color:#fff;pointer-events:auto;';
    document.body.appendChild(this.el);
    document.addEventListener('keydown', e => {
      if (e.code === 'KeyE') { e.preventDefault(); this.toggle(); }
      if (e.code === 'Escape' && this.visible) this.hide();
    });
  }

  toggle() { this.visible ? this.hide() : this.show(); }

  show() {
    this.visible = true;
    const blocks = Object.entries(BlockNames).filter(([id]) => parseInt(id, 10) !== Block.AIR);
    this.el.innerHTML = `
      <div style="background:#333;padding:24px;border-radius:8px;width:480px;max-height:80vh;overflow-y:auto;border:2px solid #555;">
        <h3 style="margin-bottom:16px;">Creative Inventory</h3>
        <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;">
          ${blocks.map(([id, name]) => `
            <div class="inv-block" data-id="${id}" title="${name}"
              style="width:44px;height:44px;background:#555;display:flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer;border:2px solid #777;">
              ${name.substring(0, 4)}
            </div>
          `).join('')}
        </div>
        <p style="margin-top:16px;font-size:11px;opacity:0.7;">Click a block to put it in your selected hotbar slot.</p>
      </div>
    `;
    this.el.style.display = 'flex';
    this.el.querySelectorAll('.inv-block').forEach(b => {
      b.onclick = () => {
        this.player.hotbar[this.player.selectedSlot] = parseInt(b.dataset.id, 10);
        this.hide();
      };
    });
  }

  hide() { this.visible = false; this.el.style.display = 'none'; this.onClose?.(); }
  dispose() { this.el.remove(); }
}

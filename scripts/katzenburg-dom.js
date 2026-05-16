'use strict';

window.KATZENBURG_DOM = (() => {
  const $ = id => document.getElementById(id);

  function installInputGuards(doc=document){
    // V65: auf Mobilgeräten keine Textmarkierung / Copy-Paste-Callouts auf HUD-Steuerelementen.
    doc.addEventListener('selectstart', e => { e.preventDefault(); }, { passive: false });
    doc.addEventListener('contextmenu', e => { e.preventDefault(); }, { passive: false });
    doc.addEventListener('dragstart', e => { e.preventDefault(); }, { passive: false });
  }

  function createToast(find=$){
    function toast(t){
      const el = find('toast');
      el.textContent = t;
      el.classList.add('show');
      clearTimeout(toast.t);
      toast.t = setTimeout(() => el.classList.remove('show'), 1400);
    }
    return toast;
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function rad(d){ return d * Math.PI / 180; }

  return { $, installInputGuards, createToast, clamp, rad };
})();

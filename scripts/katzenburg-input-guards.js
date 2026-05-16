'use strict';

// V65: auf Mobilgeräten keine Textmarkierung / Copy-Paste-Callouts auf HUD-Steuerelementen.
for (const eventName of ['selectstart', 'contextmenu', 'dragstart']) {
  document.addEventListener(eventName, event => {
    event.preventDefault();
  }, { passive: false });
}

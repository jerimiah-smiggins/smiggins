const navKey = "g";
let heldKeys: { [key: string]: true } = {};

const keybinds: { [key: string]: _keybind } = {
  a: { requireNav: true, action: (event: KeyboardEvent): void => { if (isAdmin) { redirect("/admin/"); }}},
  h: { requireNav: true, action: (event: KeyboardEvent): void => { redirect("/home/"); }},
  m: { requireNav: true, action: (event: KeyboardEvent): void => { if (ENABLE_PRIVATE_MESSAGES) { redirect("/messages/"); }}},
  n: { requireNav: true, action: (event: KeyboardEvent): void => { redirect("/notifications/"); }},
  p: { requireNav: true, action: (event: KeyboardEvent): void => { redirect(`/u/${localStorage.getItem("username")}/`); }},
  r: { action: (event: KeyboardEvent): void => { if (dom("refresh")) { dom("refresh").click(); }}},
  s: { requireNav: true, action: (event: KeyboardEvent): void => { redirect("/settings/"); }},
  "?": { action: keybindHelpMenu },

  "/": { action: (event: KeyboardEvent): void => {
    if (event.ctrlKey || heldKeys.Control) {
      keybindHelpMenu();
    } else if (dom("post-text")) {
      dom("post-text").focus();
    }
  }},

  Enter: { allowInputs: true, requireCtrl: true, action: (event: KeyboardEvent): void => {
    if ((event.target as HTMLElement).dataset.createPost !== undefined) {
      dom((event.target as HTMLElement).dataset.createPostId || "post").click();
    }
  }}
}

function _getKeybindInfo(key1: string, key2: string | null, description: string): string {
  return `<p class="keybind-help">${lang.generic.keybinds.dash.replaceAll("%k", `<code>${key2 ? lang.generic.keybinds.plus.replaceAll("%a", key1).replaceAll("%b", key2) : key1}</code>`).replaceAll("%d", description)}</p>`
}

function keybindHelpMenu(): void {
  if (!dom("modal")) {
    createModal(lang.generic.keybinds.title, `
      <h3>${lang.generic.keybinds.navigation.title}</h3>
      ${isAdmin ? _getKeybindInfo("g", "a", lang.generic.keybinds.navigation.admin) : ""}
      ${_getKeybindInfo("g", "h", lang.generic.keybinds.navigation.home)}
      ${ENABLE_PRIVATE_MESSAGES ? _getKeybindInfo("g", "m", lang.generic.keybinds.navigation.messages) : ""}
      ${_getKeybindInfo("g", "n", lang.generic.keybinds.navigation.notifications)}
      ${_getKeybindInfo("g", "p", lang.generic.keybinds.navigation.profile)}
      ${_getKeybindInfo("g", "s", lang.generic.keybinds.navigation.settings)}
      <h3>${lang.generic.keybinds.other.title}</h3>
      ${_getKeybindInfo(lang.generic.keybinds.ctrl, "/", lang.generic.keybinds.other.help)}
      ${_getKeybindInfo(lang.generic.keybinds.ctrl, lang.generic.keybinds.enter, lang.generic.keybinds.other.post)}
      ${_getKeybindInfo("/", null, lang.generic.keybinds.other.jump)}
      ${_getKeybindInfo("r", null, lang.generic.keybinds.other.refresh)}
    `, [{
      name: lang.generic.close,
      onclick: closeModal
    }]);
  }
}

function keyDown(event: KeyboardEvent): void {
  heldKeys[event.key] = true;

  let action: _keybind | undefined = keybinds[event.key];

  if (action) {
    if (!(
      (!action.allowInputs && (["textarea", "input"].includes((event.target as HTMLElement).tagName.toLowerCase()) || (event.target as HTMLElement).isContentEditable))
   || (action.requireNav && !heldKeys[navKey])
   || (action.requireCtrl && !(heldKeys.Control || event.ctrlKey))
    )) {
      event.preventDefault();
      action.action(event);
    }
  }
}

function keyUp(event: KeyboardEvent): void {
  delete heldKeys[event.key];
}

window.onkeydown = keyDown;
window.onkeyup = keyUp;

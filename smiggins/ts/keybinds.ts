let forceDisableKeybinds: boolean = false;
let navModKeyPressed: boolean = false;
const KB_DISABLED = "DISABLED";

let _kbReverse: { [key: string]: {
  modifiers?: KeybindModifiers[],
  callback: (e: KeyboardEvent) => void
}} = {};

const keybinds: { [key: string]: KeybindData } = {
  newPost: { defaultKey: "n", callback: (): void => { createPostModal(); }},
  loadNewPosts: { defaultKey: "r", callback: timelineShowNew },
  topOfTimeline: { defaultKey: "/", callback: (): void => { window.scrollTo(0, 0); }},

  navModifier: { defaultKey: "g", callback: (): void => { navModKeyPressed = true; }, releaseCallback: (): void => { navModKeyPressed = false; }},
  navAdmin: { defaultKey: "a", modifiers: ["nav"], callback: (): void => { if (!isAdmin || currentPage === "admin") { return; } history.pushState("admin", "", "/admin/"); renderPage("admin"); }},
  navHome: { defaultKey: "h", modifiers: ["nav"], callback: (): void => { if (currentPage === "home") { return; } history.pushState("home", "", "/"); renderPage("home"); }},
  navMessages: { defaultKey: "m", modifiers: ["nav"], callback: (): void => { if (currentPage === "message-list") { return; } history.pushState("message-list", "", "/messages/"); renderPage("message-list"); }},
  navNotifications: { defaultKey: "n", modifiers: ["nav"], callback: (): void => { if (currentPage === "notifications") { return; } history.pushState("notifications", "", "/notifications/"); renderPage("notifications"); }},
  navProfile: { defaultKey: "p", modifiers: ["nav"], callback: (): void => { if (currentPage === "user" && getUsernameFromPath() === username) { return; } history.pushState("user", "", `/u/${username}/`); renderPage("user"); }},
  navSettings: { defaultKey: "s", modifiers: ["nav"], callback: (): void => { if (currentPage === "settings") { return; } history.pushState("settings", "", "/settings/"); renderPage("settings"); }},

  hamburgerDelete: { defaultKey: "d", modifiers: ["alt"], callback: (): void => { keybindPostHamburger("data-interaction-delete"); }},
  hamburgerPin: { defaultKey: "f", modifiers: ["alt"], callback: (): void => { keybindPostHamburger("data-interaction-pin") || keybindPostHamburger("data-interaction-unpin"); }},
  hamburgerEdit: { defaultKey: "e", modifiers: ["alt"], callback: (): void => { keybindPostHamburger("data-interaction-edit"); }},
  hamburgerShare: { defaultKey: "s", modifiers: ["alt"], callback: (): void => { keybindPostHamburger("data-interaction-share"); }},
  hamburgerEmbed: { defaultKey: KB_DISABLED, modifiers: [], callback: (): void => { keybindPostHamburger("data-interaction-embed"); }},
};

function setKeybindStrings(): void {
  keybinds.newPost = { ...keybinds.newPost, ...L.keybinds.new_post };
  keybinds.loadNewPosts = { ...keybinds.loadNewPosts, ...L.keybinds.load_new_posts };
  keybinds.topOfTimeline = { ...keybinds.topOfTimeline, ...L.keybinds.top_of_timeline };
  keybinds.navModifier = { ...keybinds.navModifier, ...L.keybinds.nav_modifier };
  keybinds.navAdmin.name = L.keybinds.nav_admin;
  keybinds.navHome.name = L.keybinds.nav_home;
  keybinds.navMessages.name = L.keybinds.nav_messages;
  keybinds.navNotifications.name = L.keybinds.nav_notifications;
  keybinds.navProfile.name = L.keybinds.nav_profile;
  keybinds.navSettings.name = L.keybinds.nav_settings;
  keybinds.hamburgerDelete.name = L.keybinds.hamburger_delete;
  keybinds.hamburgerPin.name = L.keybinds.hamburger_pin;
  keybinds.hamburgerEdit.name = L.keybinds.hamburger_edit;
  keybinds.hamburgerShare.name = L.keybinds.hamburger_share;
  keybinds.hamburgerEmbed.name = L.keybinds.hamburger_embed;
}

function setKeybindKey(
  id: string,
  newKey: string,
  modifiers?: { [key in KeybindModifiers]?: boolean }
): boolean {
  // returns true if successful or false if duplicate

  let modString: string = "";

  if (modifiers) {
    if (modifiers.nav) {
      let navKey: string = _kbGetKey("navModifier");

      // make sure key using nav isn't the same key as the nav keybind
      if (navKey[0] + navKey.slice(1).split(":")[0] === newKey.toLowerCase()) {
        return false;
      }

      modString += "nav";
    }

    if (modifiers.alt) {
      if (modString) { modString += ","; }
      modString += "alt";
    }

    if (modifiers.ctrl) {
      if (modString) { modString += ","; }
      modString += "ctrl";
    }

    if (modifiers.shift) {
      if (modString) { modString += ","; }
      modString += "shift";
    }
  }

  if (id === "navModifier") {
    modString = "";

    // make sure new nav key isn't being used by any navigation keybinds
    for (const key of Object.keys(_kbReverse)) {
      if (key.startsWith(newKey + ":nav")) {
        return false;
      }
    }
  }

  newKey = newKey.toLowerCase();

  if (newKey === "escape") {
    newKey = KB_DISABLED;
  }

  let kbData: string = newKey + ":" + modString;

  if (kbData in _kbReverse) {
    return false;
  }

  localStorage.setItem("smiggins-keybind-" + id, kbData);
  _kbRefreshReverse();

  return true;
}

function _kbGetKey(id: string): string {
  let kbData = keybinds[id];

  // LS data format: "key:mod,mod2..."
  // ex: key N with no modifiers would be "n:"
  // ex: key H with nav modifier would be "h:nav"
  let lsData: string | null = localStorage.getItem("smiggins-keybind-" + id);

  if (!lsData) {
    return kbData.defaultKey + ":" + (kbData.modifiers || []).join(",");
  }

  return lsData
  // return [lsData[0] + lsData.slice(1).split(":")[0], (lsData.slice(1).split(":")[1].split(",") as keybindModifiers[]) || undefined];
}

function _kbRefreshReverse(): void {
  _kbReverse = {};

  for (const [id, data] of Object.entries(keybinds)) {
    let key: string = _kbGetKey(id);

    if (key.startsWith(KB_DISABLED)) {
      continue;
    }

    _kbReverse[key] = {
      callback: data.callback,
      modifiers: key.slice(1).split(":")[1].split(",") as KeybindModifiers[]
    };
  }
}

function keyHandler(e: KeyboardEvent): void {
  if (forceDisableKeybinds || !loggedIn || IS_IFRAME) { return; }

  let el: el = e.target as el;

  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) { return; }

  let modString: string = "";

  if (navModKeyPressed) {
    modString += "nav";
  }

  if (e.altKey) {
    if (modString) { modString += ","; }
    modString += "alt";
  }

  if (e.ctrlKey) {
    if (modString) { modString += ","; }
    modString += "ctrl";
  }

  if (e.shiftKey) {
    if (modString) { modString += ","; }
    modString += "shift";
  }

  let kbData = _kbReverse[e.key.toLowerCase() + ":" + modString];

  if (kbData) {
    e.preventDefault();
    kbData.callback(e);
  }
}

function keyUpHandler(e: KeyboardEvent): void {
  if (e.key.toLowerCase() + ":" === _kbGetKey("navModifier")) {
    navModKeyPressed = false;
  }
}

function keybindPostHamburger(interaction: string): boolean {
  let el: el = document.querySelector(`.hamburger:focus .post-hamburger [${interaction}]:not([hidden])`)
            || document.querySelector(`.hamburger .post-hamburger:focus [${interaction}]:not([hidden])`)
            || document.querySelector(`.hamburger .post-hamburger:focus-within [${interaction}]:not([hidden])`);

  console.log(el);

  if (el) {
    el.click();
    return true;
  }

  return false;
}

onkeydown = keyHandler;
onkeyup = keyUpHandler;
_kbRefreshReverse();

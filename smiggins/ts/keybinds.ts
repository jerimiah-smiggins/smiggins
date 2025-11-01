let forceDisableKeybinds: boolean = false;
let navModKeyPressed: boolean = false;

let _kbReverse: { [key: string]: {
  modifiers?: keybindModifiers[],
  callback: (e: KeyboardEvent) => void
}} = {};

const keybinds: { [key: string]: {
  defaultKey: string,
  name: string,
  description?: string,
  modifiers?: keybindModifiers[],
  callback: (e: KeyboardEvent) => void,
  releaseCallback?: (e: KeyboardEvent) => void
}} = {
  newPost: { defaultKey: "n", name: "Enter Post Box", description: "Lets you send a post from anywhere", callback: (): void => { createPostModal(); }},
  loadNewPosts: { defaultKey: "r", name: "Load New Posts", description: "Shows any posts that have been made since the posts were initially loaded", callback: timelineShowNew },
  topOfTimeline: { defaultKey: "/", name: "Jump to Top", description: "Jumps to the top of the current page", callback: (): void => { window.scrollTo(0, 0); }},

  navModifier: { defaultKey: "g", name: "Navigation Modifier", description: "The key that needs to be pressed in order to use the other navigation keybinds", callback: (): void => { navModKeyPressed = true; }, releaseCallback: (): void => { navModKeyPressed = false; }},
  navAdmin: { defaultKey: "a", modifiers: ["nav"], name: "Admin Page", callback: (): void => { if (!isAdmin || currentPage === "admin") { return; } history.pushState("admin", "", "/admin/"); renderPage("admin"); }},
  navHome: { defaultKey: "h", modifiers: ["nav"], name: "Home", callback: (): void => { if (currentPage === "home") { return; } history.pushState("home", "", "/"); renderPage("home"); }},
  // navMessages: { defaultKey: "m", modifiers: ["nav"], name: "Messages", callback: (): void => { /* TODO: messages page */ }},
  navNotifications: { defaultKey: "n", modifiers: ["nav"], name: "Notifications", callback: (): void => { if (currentPage === "notifications") { return; } history.pushState("notifications", "", "/notifications/"); renderPage("notifications"); }},
  navProfile: { defaultKey: "p", modifiers: ["nav"], name: "Your Profile", callback: (): void => { if (currentPage === "user" && getUsernameFromPath() === username) { return; } history.pushState("user", "", `/u/${username}/`); renderPage("user"); }},
  navSettings: { defaultKey: "s", modifiers: ["nav"], name: "Settings", callback: (): void => { if (currentPage === "settings") { return; } history.pushState("settings", "", "/settings/"); renderPage("settings"); }},
};

function setKeybindKey(
  id: string,
  newKey: string,
  modifiers?: { [key in keybindModifiers]?: boolean }
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
    newKey = "DISABLED";
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

    if (key.startsWith("DISABLED")) {
      continue;
    }

    _kbReverse[key] = {
      callback: data.callback,
      modifiers: key.slice(1).split(":")[1].split(",") as keybindModifiers[]
    };
  }
}

function keyHandler(e: KeyboardEvent): void {
  if (forceDisableKeybinds) { return; }

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
    kbData.callback(e);
    e.preventDefault();
  }
}

function keyUpHandler(e: KeyboardEvent): void {
  if (e.key.toLowerCase() + ":" === _kbGetKey("navModifier")) {
    navModKeyPressed = false;
  }
}

onkeydown = keyHandler;
onkeyup = keyUpHandler;
_kbRefreshReverse();

const navKey = "g";
let heldKeys = {};
const keybinds = {
    a: { requireNav: true, action: (event) => { if (isAdmin) {
            redirect("/admin/");
        } } },
    h: { requireNav: true, action: (event) => { redirect("/"); } },
    m: { requireNav: true, action: (event) => { if (conf.private_messages) {
            redirect("/messages/");
        } } },
    p: { requireNav: true, action: (event) => { redirect(`/u/${username}/`); } },
    r: { noPreventDefault: true, allowLoggedOut: true, action: (event) => { if (!(event.ctrlKey) && dom("refresh")) {
            event.preventDefault();
            dom("refresh").click();
        } } },
    s: { requireNav: true, action: (event) => { redirect("/settings/"); } },
    "?": { allowLoggedOut: true, action: keybindHelpMenu },
    n: { action: (event) => {
            if (heldKeys[navKey]) {
                redirect("/notifications/");
            }
        } },
    "/": { allowLoggedOut: true, action: (event) => {
            if (event.ctrlKey) {
                keybindHelpMenu();
            }
            else if (dom("post-text")) {
                dom("post-text").focus();
            }
        } },
    Enter: { allowInputs: true, requireCtrl: true, action: (event) => {
            if (event.target.dataset.createPost !== undefined) {
                dom(event.target.dataset.createPostId || "post").click();
            }
        } }
};
function _getKeybindInfo(key1, key2, description) {
    return `<p class="keybind-help">${lang.generic.keybinds.dash.replaceAll("%k", `<code>${key2 ? lang.generic.keybinds.plus.replaceAll("%a", key1).replaceAll("%b", key2) : key1}</code>`).replaceAll("%d", description)}</p>`;
}
function keybindHelpMenu() {
    if (!dom("modal")) {
        createModal(lang.generic.keybinds.title, `
      <h3>${lang.generic.keybinds.navigation.title}</h3>
      ${isAdmin ? _getKeybindInfo("g", "a", lang.generic.keybinds.navigation.admin) : ""}
      ${_getKeybindInfo("g", "h", lang.generic.keybinds.navigation.home)}
      ${conf.private_messages ? _getKeybindInfo("g", "m", lang.generic.keybinds.navigation.messages) : ""}
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
function keyDown(event) {
    heldKeys[event.key] = true;
    let action = keybinds[event.key];
    if (action) {
        if (!((!action.allowInputs && (["textarea", "input"].includes(event.target.tagName.toLowerCase()) || event.target.isContentEditable))
            || (action.requireNav && !heldKeys[navKey])
            || (action.requireCtrl && !event.ctrlKey)) && (loggedIn || action.allowLoggedOut)) {
            if (!action.noPreventDefault) {
                event.preventDefault();
            }
            action.action(event);
        }
    }
}
function keyUp(event) {
    delete heldKeys[event.key];
}
onkeydown = keyDown;
onkeyup = keyUp;

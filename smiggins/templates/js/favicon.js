'{% load static %}';
let favicon = document.createElement("link");
let oldFavicon = !!localStorage.getItem("old-favicon");
function autoSetFavicon() {
    if (oldFavicon) {
        return;
    }
    ;
    let obj;
    if (_autoMM.matches) {
        obj = _autoColors.light;
    }
    else {
        obj = _autoColors.dark;
    }
    setGenericFavicon();
}
function autoInit() {
    autoEnabled = true;
    autoSetFavicon();
    _autoMM.addEventListener("change", autoSetFavicon);
}
function autoCancel() {
    autoEnabled = false;
    _autoMM.removeEventListener("change", autoSetFavicon);
}
function setOldFavicon() {
    favicon.href = "{% static '/img/old_favicon.ico' %}?v={{ VERSION }}";
}
function setGenericFavicon() {
    let bg = themeObject.colors.background.slice(1, 7);
    let bb = themeObject.colors.button_background.slice(1, 7);
    let accent = themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")].slice(1, 7);
    favicon.href = `/favicon-${bg == "accent" ? accent : bg}-${bb == "accent" ? accent : bb}-${accent}`;
}
let autoEnabled = false;
let _autoMM = matchMedia("(prefers-color-scheme: light)");
if ("{{ THEME|escapejs }}" === "auto") {
    autoInit();
}
favicon.rel = "icon";
favicon.type = "image/png";
if (oldFavicon) {
    setOldFavicon();
}
else if (autoEnabled) {
    autoInit();
}
else {
    setGenericFavicon();
}
document.head.append(favicon);

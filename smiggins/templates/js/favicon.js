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
    favicon.href = `/favicon-${obj.background}-${obj.background_alt}-${obj.accents[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
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
    favicon.href = `/favicon-${themeObject.colors.background}-${themeObject.colors.button_background}-${themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
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
    favicon.href = `/favicon-${themeObject.colors.background}-${themeObject.colors.button_background}-${themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
}
document.head.append(favicon);

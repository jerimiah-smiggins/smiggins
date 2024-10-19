'{% load static %}';

declare const _autoColors: {
  [key in "light" | "dark"]: {
    background: string,
    background_alt: string,
    accents: string[]
  }
};

let favicon: HTMLLinkElement = document.createElement("link");
let oldFavicon: boolean = !!localStorage.getItem("old-favicon");

// theme normalization when set to automatic
function autoSetFavicon(): void {
  if (oldFavicon) { return };

  let obj;
  if (_autoMM.matches) {
    obj = _autoColors.light;
  } else {
    obj = _autoColors.dark;
  }

  favicon.href = `/favicon-${obj.background}-${obj.background_alt}-${obj.accents[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
}

function autoInit(): void {
  autoEnabled = true;
  autoSetFavicon();
  _autoMM.addEventListener("change", autoSetFavicon);
}

function autoCancel(): void {
  autoEnabled = false;
  _autoMM.removeEventListener("change", autoSetFavicon);
}

function setOldFavicon(): void {
  favicon.href = "{% static '/img/old_favicon.ico' %}?v={{ VERSION }}";
}

function setGenericFavicon(): void {
  favicon.href = `/favicon-${themeObject.colors.background}-${themeObject.colors.button_background}-${themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
}

let autoEnabled: boolean = false;
let _autoMM: MediaQueryList = matchMedia("(prefers-color-scheme: light)");

//  @ts-ignore
if ("{{ THEME|escapejs }}" === "auto") {
  autoInit();
}

// set proper favicon
favicon.rel = "icon";
favicon.type = "image/png";

if (oldFavicon) {
  setOldFavicon()
} else if (autoEnabled) {
  autoInit();
} else {
  favicon.href = `/favicon-${themeObject.colors.background}-${themeObject.colors.button_background}-${themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")]}`.replaceAll("#", "");
}

document.head.append(favicon);
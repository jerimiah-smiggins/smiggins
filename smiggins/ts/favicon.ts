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

  setGenericFavicon();
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
  // TODO: This doesn't work with "auto" theme
  let bg: string = themeObject.colors.background.slice(1, 7);
  let bb: string = themeObject.colors.button_background.slice(1, 7);
  let accent: string = themeObject.colors.accent[validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")].slice(1, 7)

  favicon.href = `/favicon-${bg == "accent" ? accent : bg}-${bb == "accent" ? accent : bb}-${accent}`;
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
  setOldFavicon();
} else if (autoEnabled) {
  autoInit();
} else {
  setGenericFavicon();
}

document.head.append(favicon);
'{% load static %}';

let favicon: HTMLLinkElement = document.createElement("link");
let oldFavicon: boolean = !!localStorage.getItem("old-favicon") && conf.dynamic_favicon;
let autoThemeObject: {
  background: string,
  background_alt: string,
  accent: { [key: string]: string }
} | null = null;

function getThemeAuto(
  defLight: _themeObject=JSON.parse('{{ theme_default_light|escapejs }}'),
  defDark: _themeObject=JSON.parse('{{ theme_default_dark|escapejs }}')
): string {
  _autoColors = {
    dark: {
      background: defDark.colors.background,
      background_alt: defDark.colors.button_background,
      accent: defDark.colors.accent
    },
    light: {
      background: defLight.colors.background,
      background_alt: defLight.colors.button_background,
      accent: defLight.colors.accent
    }
  }

  return `${getThemeCSS(defDark)} @media (prefers-color-scheme: light) { ${getThemeCSS(defLight)} }`
}

function getThemeCSS(theme: _themeObject): string {
  return `
  [data-color="gray"] { --accent: ${ theme.colors.gray }; --accent-50: ${ theme.colors.gray }80; }
  [data-color="rosewater"] { --accent: ${ theme.colors.accent.rosewater }; --accent-50: ${ theme.colors.accent.rosewater }80; }
  [data-color="flamingo"] { --accent: ${ theme.colors.accent.flamingo }; --accent-50: ${ theme.colors.accent.flamingo }80; }
  [data-color="pink"] { --accent: ${ theme.colors.accent.pink }; --accent-50: ${ theme.colors.accent.pink }80; }
  [data-color="mauve"], body:not([data-color]) { --accent: ${ theme.colors.accent.mauve }; --accent-50: ${ theme.colors.accent.mauve }80; }
  [data-color="red"] { --accent: ${ theme.colors.accent.red }; --accent-50: ${ theme.colors.accent.red }80; }
  [data-color="maroon"] { --accent: ${ theme.colors.accent.maroon }; --accent-50: ${ theme.colors.accent.maroon }80; }
  [data-color="peach"] { --accent: ${ theme.colors.accent.peach }; --accent-50: ${ theme.colors.accent.peach }80; }
  [data-color="yellow"] { --accent: ${ theme.colors.accent.yellow }; --accent-50: ${ theme.colors.accent.yellow }80; }
  [data-color="green"] { --accent: ${ theme.colors.accent.green }; --accent-50: ${ theme.colors.accent.green }80; }
  [data-color="teal"] { --accent: ${ theme.colors.accent.teal }; --accent-50: ${ theme.colors.accent.teal }80; }
  [data-color="sky"] { --accent: ${ theme.colors.accent.sky }; --accent-50: ${ theme.colors.accent.sky }80; }
  [data-color="sapphire"] { --accent: ${ theme.colors.accent.sapphire }; --accent-50: ${ theme.colors.accent.sapphire }80; }
  [data-color="blue"] { --accent: ${ theme.colors.accent.blue }; --accent-50: ${ theme.colors.accent.blue }80; }
  [data-color="lavender"] { --accent: ${ theme.colors.accent.lavender }; --accent-50: ${ theme.colors.accent.lavender }80; }

  body {
    --text: ${ theme.colors.text };
    --subtext: ${ theme.colors.subtext };
    --red: ${ theme.colors.red };
    --background: ${ theme.colors.background };
    --post-background: ${ theme.colors.post_background };
    --poll-voted-background: ${ theme.colors.poll_voted_background };
    --poll-no-vote-background: ${ theme.colors.poll_no_vote_background };
    --content-warning-background: ${ theme.colors.content_warning_background };
    --input-background: ${ theme.colors.input_background };
    --checkbox-background: ${ theme.colors.checkbox_background };
    --button-background: ${ theme.colors.button_background };
    --button-hover-background: ${ theme.colors.button_hover_background };
    --button-inverted-background: ${ theme.colors.button_inverted_background };
    --input-border: ${ theme.colors.input_border };
    --checkbox-border: ${ theme.colors.checkbox_border };
    --button-border: ${ theme.colors.button_border };
    --table-border: ${ theme.colors.table_border };
    --modal-backdrop: ${ theme.colors.modal_backdrop };
    --modal-background: ${ theme.colors.modal_background };
    --modal-border: ${ theme.colors.modal_border };
    --gray: ${ theme.colors.gray };
    color-scheme: ${theme.light_theme ? "light" : "dark"};
  }`.replaceAll("@accent-50", "var(--accent-50)").replaceAll("@accent", "var(--accent)");
}

function autoSetFavicon(): void {
  if (oldFavicon) { return };

  if (_autoMM.matches) {
    autoThemeObject = _autoColors.light
  } else {
    autoThemeObject = _autoColors.dark;
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
  autoThemeObject = null;
  _autoMM.removeEventListener("change", autoSetFavicon);
}

function setOldFavicon(): void {
  for (const el of document.querySelectorAll("[data-set-favi]")) {
    el.setAttribute((el as HTMLElement).dataset.setFavi, "{% static '/img/old_favicon.png' %}?v={{ version }}");
  }
}

function setGenericFavicon(): void {
  let obj: {
    background: string,
    background_alt: string,
    accent: { [key: string]: string },
  } = autoThemeObject || {
    background: themeObject.colors.background,
    background_alt: themeObject.colors.button_background,
    accent: themeObject.colors.accent,
  };

  let bg: string = obj.background.slice(1, 7);
  let bb: string = obj.background_alt.slice(1, 7);
  let accent: string = (obj.accent[localStorage.getItem("color")] || obj.accent.mauve).slice(1, 7)

  let href: string = `/favicon-${bg == "accent" ? accent : bg}-${bb == "accent" ? accent : bb}-${accent}`;

  for (const el of document.querySelectorAll("[data-set-favi]")) {
    el.setAttribute((el as HTMLElement).dataset.setFavi, href + ((el as HTMLElement).dataset.faviLarge !== undefined ? "?large" : ""));
  }
}

let autoEnabled: boolean = false;
let _autoMM: MediaQueryList = matchMedia("(prefers-color-scheme: light)");

let themeObject: _themeObject;
let _autoColors: {
  [key in "light" | "dark"]: {
    background: string,
    background_alt: string,
    accent: { [key: string]: string }
  }
};

//  @ts-ignore
if ("{{ theme|escapejs }}" == "auto") {
  themeObject = null;
  document.getElementById("theme-css").innerHTML = getThemeAuto();
  autoInit();
} else {
  themeObject = JSON.parse('{{ theme_str|escapejs }}');
  document.getElementById("theme-css").innerHTML = getThemeCSS(themeObject);
}

// set proper favicon
favicon.rel = "shortcut icon";
favicon.type = "image/png";
favicon.dataset.setFavi = "href";

document.head.append(favicon);

if (oldFavicon) {
  setOldFavicon();
} else if (autoEnabled) {
  autoInit();
} else {
  setGenericFavicon();
}

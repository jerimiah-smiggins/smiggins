let themeMedia: MediaQueryList = matchMedia("(prefers-color-scheme: light)");
let _themeLs: string | null = localStorage.getItem("smiggins-theme");
let theme: themes = _themeLs === "light" || _themeLs === "dark" || _themeLs === "warm" || _themeLs === "gray" || _themeLs === "darker" || _themeLs === "oled" ? _themeLs : "system";

function setTheme(th: themes): void {
  if (th === "system") {
    localStorage.removeItem("smiggins-theme");
    theme = "system";
    updateTheme(themeMedia.matches ? "light" : "dark");
    return;
  }

  localStorage.setItem("smiggins-theme", th);
  updateTheme(th);
}

function updateTheme(theme: themes): void {
  document.documentElement.dataset.theme = theme;
}

function updateAutoTheme(): void {
  if (theme !== "system") { return; }
  updateTheme(themeMedia.matches ? "light" : "dark");
}

themeMedia.addEventListener("change", updateAutoTheme);
updateTheme((theme === "system" && (themeMedia.matches ? "light" : "dark")) || theme);

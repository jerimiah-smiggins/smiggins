let themeMedia = matchMedia("(prefers-color-scheme: light)");
let _themeLs: string | null = localStorage.getItem("smiggins-theme");
let theme: "light" | "dark" | "system" = _themeLs === "light" || _themeLs === "dark" ? _themeLs : "system";

function setTheme(th: "light" | "dark" | "system"): void {
  switch (th) {
    case "system": localStorage.removeItem("smiggins-theme"); theme = "system"; updateTheme(themeMedia.matches); break;
    case "light": localStorage.setItem("smiggins-theme", "light"); theme = "light"; updateTheme(true); break;
    case "dark": localStorage.setItem("smiggins-theme", "dark"); theme = "dark"; updateTheme(false); break;
  }
}

function updateTheme(light: boolean): void {
  if (light) {
    document.documentElement.dataset.light = "";
  } else {
    delete document.documentElement.dataset.light;
  }
}

function updateAutoTheme() {
  if (theme !== "system") { return; }
  updateTheme(themeMedia.matches);
}

themeMedia.addEventListener("change", updateAutoTheme);
updateTheme(theme === "light" || (theme === "system" && themeMedia.matches));

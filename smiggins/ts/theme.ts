let themeMedia: MediaQueryList = matchMedia("(prefers-color-scheme: light)");
let _themeLs: string | null = localStorage.getItem("smiggins-theme");
let _faviLs: string | null = localStorage.getItem("smiggins-favicon");
let theme: Themes = _themeLs === "light" || _themeLs === "dark" || _themeLs === "warm" || _themeLs === "gray" || _themeLs === "darker" || _themeLs === "oled" ? _themeLs : "system";
let favicon: Favicon = _faviLs === "light" || _faviLs === "dark" || _faviLs === "old" || _faviLs === "pq-light" || _faviLs === "pq-dark" || _faviLs === "cat-light" || _faviLs === "cat-dark" ? _faviLs : "system";

function setTheme(th: Themes): void {
  theme = th;

  if (th === "system") {
    localStorage.removeItem("smiggins-theme");
    updateTheme(themeMedia.matches ? "light" : "dark");
    return;
  }

  localStorage.setItem("smiggins-theme", th);
  updateTheme(th);
}

function updateTheme(theme: Themes): void {
  document.documentElement.dataset.theme = theme;
}

function setFavicon(favi: Favicon): void {
  favicon = favi;

  if (favi === "system") {
    localStorage.removeItem("smiggins-favicon");
    updateFavicon(themeMedia.matches ? "light" : "dark");
    return;
  }

  localStorage.setItem("smiggins-favicon", favi);
  updateFavicon(favi);
}

function updateFavicon(favi: Favicon): void {
  let filename: string | undefined;

  switch (favi) {
    case "dark": filename = "favicon-dark.png"; break;
    case "light": filename = "favicon-light.png"; break;
    case "pq-dark": filename = "favicon-pq-dark.png"; break;
    case "pq-light": filename = "favicon-pq-light.png"; break;
    case "cat-dark": filename = "favicon-cat-dark.png"; break;
    case "cat-light": filename = "favicon-cat-light.png"; break;
    case "old": filename = "old_favicon.png"; break;
  }

  if (!filename) { return; }

  // cookie used for loading screen and manifest.json templating
  document.cookie = `favicon=${filename};Path=/;SameSite=Lax;Expires=${new Date(Date.now() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;

  let el: el = document.getElementById("favicon");
  if (!el || !el.dataset.urlFormat) { return; }

  el.setAttribute("href", el.dataset.urlFormat.replaceAll("FAVICON_FILENAME", filename));
}

function updateAutoTheme(): void {
  let newTheme: "light" | "dark" = themeMedia.matches ? "light" : "dark";
  if (favicon === "system") { updateFavicon(newTheme); }
  if (theme === "system") { updateTheme(newTheme); }
}

themeMedia.addEventListener("change", updateAutoTheme);
updateTheme((theme === "system" && (themeMedia.matches ? "light" : "dark")) || theme);
updateFavicon((favicon === "system" && (themeMedia.matches ? "light" : "dark")) || favicon)

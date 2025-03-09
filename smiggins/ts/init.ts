'{% load static %}';
declare const somethingWentWrong: string;

let initContextLoaded: undefined | true = undefined;
let javascriptLoaded: undefined | true = undefined;

function init(): void {
  baseFooterInit();
  loadContext(location.pathname, renderPage);
}

function loadNext(): void {
  document.getElementById("loading-progress").style.setProperty("--progress", String(loadIndex / loadURLs.length * 100));
  if (loadIndex >= loadURLs.length) {
    initContextLoaded = true;
    if (typeof javascriptLoaded != "undefined") {
      init();
    }
    return;
  }

  let load = loadURLs[loadIndex];

  if (!load) {
    loadIndex++;
    loadNext();
    return;
  }

  fetch(load[0])
    .then((response: Response): void => {
      if (load[2] === true) {
        if (response.status != 200) {
          document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${response.status}`;
          return;
        }

        response.text()
          .then((text: string): void => {
            load[1](text)
            loadIndex++;
            loadNext();
          });

        return;
      } else {
        response.json()
          .then((json: _anyDict): void => {
            if (json.success) {
              load[1](json)
              loadIndex++;
              loadNext();
            } else {
              document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${json.message}`;
            }
          })
          .catch((err: any): void => {
            document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${err}`;
            throw err;
          });
      }
    })
    .catch((err: any): void => {
      document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${err}`;
    });
}

const validColors: string[] = [
  "rosewater", "flamingo", "pink", "mauve",
  "red", "maroon", "peach", "yellow", "green",
  "teal", "sky", "sapphire", "blue", "lavender"
];

// @ts-expect-error
let loadURLs: ([string, (response: any) => void, boolean])[] = [
  conf.badges ? ["/api/init/badges", (json: _anyDict): void => { badges = json.badges; }, false] : null,
  ["/api/init/lang", (json: _anyDict): void => { lang = json.lang; }, false],
  loggedIn ? ["/api/init/muted", (json: _anyDict): void => { muted = json.muted; }, false] : null,
].filter(Boolean);

let loadIndex: number = 0;
let context: _context;
let badges: { [key: string]: string };
let lang: _anyDict;
let muted: [string, number, boolean][] | null = null;

document.getElementById("loading-image").setAttribute("src", (document.head.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement).href);

document.body.setAttribute(
  "data-color",
  validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color")
);

loadNext();

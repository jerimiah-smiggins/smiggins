'{% load static %}';
let initContextLoaded = undefined;
let javascriptLoaded = undefined;
function init() {
    baseFooterInit();
    loadContext(location.pathname, renderPage);
}
function loadNext() {
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
        .then((response) => {
        if (load[2] === true) {
            if (response.status != 200) {
                document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${response.status}`;
                return;
            }
            response.text()
                .then((text) => {
                load[1](text);
                loadIndex++;
                loadNext();
            });
            return;
        }
        else {
            response.json()
                .then((json) => {
                if (json.success) {
                    load[1](json);
                    loadIndex++;
                    loadNext();
                }
                else {
                    document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${json.message}`;
                }
            })
                .catch((err) => {
                document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${err}`;
                throw err;
            });
        }
    })
        .catch((err) => {
        document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${err}`;
    });
}
const validColors = [
    "rosewater", "flamingo", "pink", "mauve",
    "red", "maroon", "peach", "yellow", "green",
    "teal", "sky", "sapphire", "blue", "lavender"
];
let loadURLs = [
    conf.badges ? ["/api/init/badges", (json) => { badges = json.badges; }, false] : null,
    ["/api/init/lang", (json) => { lang = json.lang; }, false],
    loggedIn ? ["/api/init/muted", (json) => { muted = json.muted; }, false] : null,
].filter(Boolean);
let loadIndex = 0;
let context;
let badges;
let lang;
let muted = null;
document.getElementById("loading-image").setAttribute("src", document.head.querySelector("link[rel='apple-touch-icon']").href);
document.body.setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color"));
loadNext();

'{% load static %}';
function loadNext() {
    document.getElementById("loading-progress").style.setProperty("--progress", String(loadIndex / loadURLs.length * 100));
    if (loadIndex >= loadURLs.length) {
        document.body.append(script);
        loadContext(location.pathname, renderPage);
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
            });
        }
    })
        .catch((err) => {
        document.getElementById("loading-motd").innerText = `${somethingWentWrong} ${err}`;
    });
}
function loadJS(content) {
    script.innerHTML += "\n" + content;
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
    ["{% static 'linkify/linkify.min.js' %}?v={{ conf.version }}", loadJS, true],
    ["{% static 'linkify/html.min.js' %}?v={{ conf.version }}", loadJS, true],
    ["{% static 'linkify/mentions.js' %}?v={{ conf.version }}", loadJS, true],
    conf.hashtags ? ["{% static 'linkify/hashtags.js' %}?v={{ conf.version }}", loadJS, true] : null,
    ["{% static 'base.js' %}?v={{ conf.version }}", loadJS, true],
    ["{% static 'keybinds.js' %}?v={{ conf.version }}", loadJS, true],
    ["{% static 'pages.js' %}?v={{ conf.version }}", loadJS, true],
    ["{% static 'page-scripts.js' %}?v={{ conf.version }}", loadJS, true],
].filter(Boolean);
let script = document.createElement("script");
let loadIndex = 0;
let context;
let badges;
let lang;
let muted = null;
document.getElementById("loading-image").setAttribute("src", document.head.querySelector("link[rel='apple-touch-icon']").href);
document.body.setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color"));
loadNext();

const usernameRegexFull = /^[a-z0-9_\-]+$/g;
if (typeof (logged_in) != "boolean") {
    logged_in = document.cookie.split(/\btoken=/).length != 1;
}
if (logged_in) {
    setCookie("token", document.cookie.split(/\btoken=/)[1].split(";")[0]);
}
let titleNotificationIndicator = false;
let iconsElement = document.createElement("div");
iconsElement.setAttribute("class", "icons");
iconsElement.setAttribute("id", "icons");
document.querySelector("body").setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color"));
if (logged_in) {
    iconsElement.innerHTML = `<a title="${lang.settings.title}" href="/settings">${icons.settings}</a>`;
    if (typeof (home) !== 'undefined') {
        iconsElement.innerHTML += `<a title="${lang.home.title}" href="/home">${icons.home}</a>`;
    }
    iconsElement.innerHTML += `<div data-add-notification-dot><a title="${lang.notifications.title}" href="/notifications">${icons.bell}</a></div>`;
    if (ENABLE_PRIVATE_MESSAGES) {
        iconsElement.innerHTML += `<div data-add-message-dot><a title="${lang.messages.list_title}" href="/messages">${icons.message}</a></div>`;
    }
}
if (typeof (share) !== 'undefined') {
    iconsElement.innerHTML += `<span title="${lang.generic.share}" onclick="window.navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('${lang.generic.copied}');">${icons.share}</span>`;
}
document.querySelector("body").append(iconsElement);
function getNotifications() {
    fetch("/api/info/notifications")
        .then((response) => (response.json()))
        .then((json) => {
        forEach(document.querySelectorAll("[data-add-notification-dot]"), (val, index) => {
            if (json.success && json.notifications) {
                val.classList.add("dot");
            }
            else {
                val.classList.remove("dot");
            }
        });
        ENABLE_PRIVATE_MESSAGES && forEach(document.querySelectorAll("[data-add-message-dot]"), (val, index) => {
            if (json.success && json.messages) {
                val.classList.add("dot");
            }
            else {
                val.classList.remove("dot");
            }
        });
        if ((json.messages && ENABLE_PRIVATE_MESSAGES) || json.notifications) {
            if (!titleNotificationIndicator) {
                titleNotificationIndicator = true;
                document.title = "[ ! ] " + document.title;
            }
        }
        else {
            if (titleNotificationIndicator) {
                titleNotificationIndicator = false;
                document.title = document.title.slice(6);
            }
        }
    });
}
if (logged_in) {
    getNotifications();
    setInterval(getNotifications, 2 * 60 * 1000);
    if (typeof (profile) === "undefined") {
        if (localStorage.getItem("username") === null) {
            fetch("/api/info/username")
                .then((response) => (response.json()))
                .then((_username) => {
                let username = _username.username;
                if (usernameRegexFull.test(username)) {
                    localStorage.setItem("username", username);
                    dom("icons").innerHTML += `<a title="${lang.settings.profile_title}" href="/u/${username}">${icons.user}</a>`;
                }
                else {
                    console.log("Username returned from /api/info/username is invalid.");
                }
            });
        }
        else {
            if (usernameRegexFull.test(localStorage.getItem("username"))) {
                dom("icons").innerHTML += `<a title="${lang.settings.profile_title}" href="/u/${localStorage.getItem("username")}">${icons.user}</a>`;
            }
            else {
                console.log("Username in localStorage is invalid.");
                localStorage.removeItem("username");
            }
        }
    }
}
forEach(document.querySelectorAll("[data-add-icon]"), (val, index) => {
    val.innerHTML = icons[val.dataset.addIcon];
});
forEach(document.querySelectorAll("[data-add-badge]"), (val, index) => {
    val.innerHTML = badges[val.dataset.addBadge];
});

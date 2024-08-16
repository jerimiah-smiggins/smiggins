const usernameRegexFull = /^[a-z0-9_\-]+$/g;
if (typeof (logged_in) != "boolean") {
    logged_in = document.cookie.split(/\btoken=/).length != 1;
}
if (logged_in) {
    setCookie("token", document.cookie.split(/\btoken=/)[1].split(";")[0]);
}
let titleNotificationIndicator = false;
let pendingFollowersIconEnabled = false;
let iconsElement = document.createElement("div");
iconsElement.setAttribute("class", "icons");
iconsElement.setAttribute("id", "icons");
document.body.setAttribute("data-color", validColors.indexOf(localStorage.getItem("color")) == -1 ? "mauve" : localStorage.getItem("color"));
document.body.setAttribute("data-bar-pos", (["ur", "lr", "ul", "ll"]).indexOf(localStorage.getItem("bar-pos")) == -1 ? "ul" : localStorage.getItem("bar-pos"));
document.body.setAttribute("data-bar-dir", (["h", "r"]).indexOf(localStorage.getItem("bar-dir")) == -1 ? "v" : localStorage.getItem("bar-dir"));
if (localStorage.getItem("checkboxes")) {
    document.body.setAttribute("data-disable-checkboxes", "");
}
if (logged_in) {
    iconsElement.innerHTML = `<div><a title="${lang.settings.title}" href="/settings">${NO_CSS_MODE ? lang.settings.title : icons.settings}</a></div>`;
    if (typeof (home) !== 'undefined') {
        iconsElement.innerHTML += `<div><a title="${lang.home.title}" href="/home">${NO_CSS_MODE ? lang.home.title : icons.home}</a></div>`;
    }
    iconsElement.innerHTML += `<div data-add-notification-dot><a title="${lang.notifications.title}" href="/notifications">${NO_CSS_MODE ? lang.notifications.title : icons.bell}</a></div>`;
    if (ENABLE_PRIVATE_MESSAGES) {
        iconsElement.innerHTML += `<div data-add-message-dot><a title="${lang.messages.list_title}" href="/messages">${NO_CSS_MODE ? lang.messages.list_title : icons.message}</a></div>`;
    }
}
if (typeof (share) !== 'undefined') {
    iconsElement.innerHTML += `<div><a href="javascript:void(0);"><span title="${lang.generic.share}" onclick="navigator.clipboard.writeText('${escapeHTML(share)}'); showlog('${lang.generic.copied}');">${NO_CSS_MODE ? lang.generic.share : icons.share}</span></a></div>`;
}
document.body.append(iconsElement);
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
        if (!pendingFollowersIconEnabled && json.followers) {
            pendingFollowersIconEnabled = true;
            dom("icons").innerHTML += `<div class="dot" id="pending-followers-icon" title="${lang.user_page.pending_title}"><a href="/pending/">${NO_CSS_MODE ? lang.user_page.pending_title : icons.follower}</a></div>`;
        }
        else if (pendingFollowersIconEnabled && !json.followers) {
            pendingFollowersIconEnabled = false;
            dom("pending-followers-icon").remove();
        }
        if ((json.messages && ENABLE_PRIVATE_MESSAGES) || json.notifications || json.followers || json.followers) {
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
                    dom("icons").innerHTML += `<a title="${lang.settings.profile_title}" href="/u/${username}">${NO_CSS_MODE ? lang.settings.profile_title : icons.user}</a>`;
                }
                else {
                    console.log("Username returned from /api/info/username is invalid.");
                }
            });
        }
        else {
            if (usernameRegexFull.test(localStorage.getItem("username"))) {
                dom("icons").innerHTML += `<a title="${lang.settings.profile_title}" href="/u/${localStorage.getItem("username")}">${NO_CSS_MODE ? lang.settings.profile_title : icons.user}</a>`;
            }
            else {
                console.log("Username in localStorage is invalid.");
                localStorage.removeItem("username");
            }
        }
    }
}
if (!NO_CSS_MODE) {
    forEach(document.querySelectorAll("[data-add-icon]"), (val, index) => {
        val.innerHTML = icons[val.dataset.addIcon];
    });
    forEach(document.querySelectorAll("[data-add-badge]"), (val, index) => {
        val.innerHTML = badges[val.dataset.addBadge];
    });
}

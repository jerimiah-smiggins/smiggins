"use strict";
const container = document.getElementById("container");
function urlToIntent(path) {
    if (!path.endsWith("/")) {
        path += "/";
    }
    if (!path.startsWith("/")) {
        path = "/" + path;
    }
    if (loggedIn) {
        switch (path) {
            case "/home/": history.pushState("home", "", "/");
            case "/": return "home";
        }
    }
    else {
        switch (path) {
            case "/": return "index";
            case "/login/": return "login";
            case "/signup/": return "signup";
        }
    }
    if (path === "/logout/") {
        return "logout";
    }
    return "404";
}
function generateInternalLinks(element) {
    if (!element) {
        element = container;
    }
    let links = element.querySelectorAll("[data-internal-link]:not([data-link-processed])");
    for (const i of links) {
        i.dataset.linkProcessed = "";
        i.addEventListener("click", internalLinkHandler);
    }
}
function internalLinkHandler(e) {
    if (!e.ctrlKey) {
        let el = e.currentTarget;
        let newPage = el.dataset.internalLink;
        let newURL = el.href || null;
        if (newPage !== currentPage) {
            history.pushState(newPage, "", newURL);
            renderPage(newPage);
            currentPage = newPage;
        }
        e.preventDefault();
    }
}
onpopstate = function (e) {
    currentPage = e.state;
    renderPage(currentPage);
};
function renderPage(intent) {
    let snippet = getSnippet(`pages/${intent}`);
    generateInternalLinks(snippet);
    container.replaceChildren(snippet);
}
let snippetVariables = {
    site_name: "Jerimiah Smiggins",
    home_page: loggedIn ? "home" : "index",
    username: loggedIn ? username : ""
};
let snippetProcessing = {
    input_enter: p_inputEnter,
    password_toggle: p_passwordToggle,
    login: p_login,
    signup: p_signup,
    logout: p_logout,
    home: p_home,
    timeline_switch: p_tlSwitch,
    timeline_more: p_tlMore
};
function getSnippet(snippet, extraVariables) {
    var _a, _b;
    let page = document.querySelector(`[data-snippet="${snippet}"]`);
    let variables = ((_a = page.dataset.snippetVariables) === null || _a === void 0 ? void 0 : _a.split(",").filter((a) => a)) || [];
    let processing = ((_b = page.dataset.snippetProcessing) === null || _b === void 0 ? void 0 : _b.split(",").filter((a) => a)) || [];
    let content = page.innerHTML;
    for (const i of variables) {
        let replacementValue = "";
        if (i in snippetVariables) {
            replacementValue = snippetVariables[i];
        }
        else {
            console.log(`Unknown snippet variable "${i}"`);
        }
        content = content.replaceAll(`@{${i}}`, replacementValue);
    }
    if (extraVariables) {
        for (const i of Object.keys(extraVariables)) {
            content = content.replaceAll(`@{${i}}`, extraVariables[i]);
        }
    }
    let element = document.createElement("div");
    element.innerHTML = content;
    for (const i of processing) {
        if (i in snippetProcessing) {
            snippetProcessing[i](element);
        }
        else {
            console.log(`Unknown snippet process "${i}"`);
        }
    }
    return element;
}
function p_inputEnter(element) {
    for (const el of element.querySelectorAll("[data-enter-submit]")) {
        el.onkeydown = inputEnterEvent;
    }
}
function p_passwordToggle(element) {
    for (const el of element.querySelectorAll("[data-password-toggle]")) {
        el.onclick = togglePasswords;
    }
}
let currentTl;
let tlElement;
let timelines = {};
let offset = null;
const LOADING_HTML = "<i class=\"timeline-status\">Loading...</i>";
function hookTimeline(element, tls, activeTimeline) {
    timelines = tls;
    currentTl = timelines[activeTimeline];
    tlElement = element;
    reloadTimeline();
}
function reloadTimeline() {
    tlElement.innerHTML = LOADING_HTML;
    fetch(currentTl.url, {
        headers: { Accept: "application/json" }
    }).then((response) => (response.json()))
        .then(renderTimeline)
        .catch((err) => {
        createToast("Something went wrong!", String(err));
        throw err;
    });
}
function loadMorePosts() {
    let more = document.getElementById("timeline-more");
    if (more) {
        more.hidden = true;
    }
    tlElement.insertAdjacentHTML("beforeend", LOADING_HTML);
    fetch(`${currentTl.url}?offset=${offset}`, {
        headers: { Accept: "application/json" }
    }).then((response) => (response.json()))
        .then(renderTimeline)
        .catch((err) => {
        createToast("Something went wrong!", String(err));
        if (more) {
            more.hidden = false;
        }
        clearTimelineStatuses();
        throw err;
    });
}
function clearTimelineStatuses() {
    let statuses = tlElement.querySelectorAll(".timeline-status");
    for (const el of statuses) {
        el.remove();
    }
}
function renderTimeline(json) {
    if (!json.success) {
        createToast("Something went wrong!");
        console.log(json);
        return;
    }
    clearTimelineStatuses();
    let frag = document.createDocumentFragment();
    let more = document.getElementById("timeline-more");
    if (more) {
        if (json.end) {
            more.hidden = true;
        }
        else {
            more.hidden = false;
        }
    }
    for (const post of json.posts) {
        let postContent = escapeHTML(post.content);
        offset = post.id;
        if (post.content_warning) {
            postContent = `<details class="content-warning"><summary><div>${escapeHTML(post.content_warning)}<div class="content-warning-stats"> (${post.content.length} char${post.content.length === 1 ? "" : "s"})</div></div></summary>${postContent}</details>`;
        }
        frag.append(getSnippet("post", {
            timestamp: getTimestamp(post.timestamp),
            username: post.user.username,
            display_name: escapeHTML(post.user.display_name),
            content: postContent
        }));
    }
    tlElement.append(frag);
}
function switchTimeline(e) {
    let el = e.target;
    if (!el) {
        return;
    }
    if (el.dataset.timelineId && el.dataset.timelineId in timelines && timelines[el.dataset.timelineId].url !== currentTl.url) {
        currentTl = timelines[el.dataset.timelineId];
        reloadTimeline();
    }
}
function p_tlMore(element) {
    let el = element.querySelector("[id=\"timeline-more\"]");
    if (el) {
        el.addEventListener("click", () => {
            el.setAttribute("hidden", "");
            loadMorePosts();
        });
    }
}
function p_tlSwitch(element) {
    let carouselItems = element.querySelectorAll("[data-timeline-id]");
    for (const i of carouselItems) {
        i.addEventListener("click", switchTimeline);
    }
}
function createToast(title, content, timeout) {
    var _a;
    let toast = getSnippet("toast", {
        title: title,
        content: content || ""
    });
    (_a = document.getElementById("toasts")) === null || _a === void 0 ? void 0 : _a.append(toast);
    setTimeout(() => (toast.remove()), timeout || 3000);
}
function inputEnterEvent(e) {
    if (e.key !== "Enter") {
        return;
    }
    let el = e.currentTarget;
    let eventQuery = (e.ctrlKey && el.dataset.enterSubmit) || el.dataset.enterNext || el.dataset.enterSubmit;
    if (!eventQuery) {
        return;
    }
    let newElement = document.querySelector(eventQuery);
    if (!newElement) {
        return;
    }
    newElement.focus();
    if (newElement.nodeName === "BUTTON") {
        newElement.click();
    }
    e.preventDefault();
}
function togglePasswords() {
    let toText = document.querySelectorAll("input[type=\"password\"]");
    let toPassword = document.querySelectorAll("input[data-toggle-password]");
    for (const el of toText) {
        el.type = "text";
        el.dataset.togglePassword = "";
    }
    for (const el of toPassword) {
        el.type = "password";
        delete el.dataset.togglePassword;
    }
}
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    ;
    let maxWord = Math.pow(2, 32);
    let result = '';
    let words = [];
    let asciiBitLength = ascii["length"] * 8;
    let hash = [];
    let k = [];
    let primeCounter = k["length"];
    let isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (Math.pow(candidate, (1 / 3)) * maxWord) | 0;
        }
    }
    ascii += '\x80';
    while (ascii["length"] % 64 - 56)
        ascii += '\x00';
    for (let i = 0; i < ascii["length"]; i++) {
        let j = ascii.charCodeAt(i);
        if (j >> 8)
            return "";
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    for (let j = 0; j < words.length;) {
        let w = words.slice(j, j += 16);
        let oldHash = hash;
        hash = hash.slice(0, 8);
        for (let i = 0; i < 64; i++) {
            let w15 = w[i - 15];
            let w2 = w[i - 2];
            let a = hash[0];
            let e = hash[4];
            let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (let i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j + 1; j--) {
            let b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}
function escapeHTML(str) {
    if (str === undefined) {
        return "⚠️";
    }
    return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("`", "&#96;");
}
function getTimestamp(timestamp, raw = false) {
    let difference = Math.round(new Date().getTime() / 1000 - timestamp);
    let future = difference < 0;
    let complexTimestamps = !!localStorage.getItem("complex-timestamps");
    if (future) {
        difference = -difference;
    }
    let output = "?";
    if (difference < 60) {
        output = `${difference}s`;
    }
    else if (difference < 60 * 60) {
        output = `${Math.floor(difference / 60)}m` + (complexTimestamps ? `${difference % 60}s` : "");
    }
    else if (difference < 60 * 60 * 24) {
        output = `${Math.floor(difference / 60 / 60)}h` + (complexTimestamps ? `${Math.floor(difference / 60) % 60}m` : "");
    }
    else if (difference < 60 * 60 * 24 * 365) {
        output = `${Math.floor(difference / 60 / 60 / 24)}d` + (complexTimestamps ? `${Math.floor(difference / 60 / 60) % 24}h` : "");
    }
    else if (!isNaN(timestamp)) {
        output = `${Math.floor(difference / 60 / 60 / 24 / 365)}y` + (complexTimestamps ? `${Math.floor(difference / 60 / 60 / 24) % 365}d` : "");
    }
    if (future) {
        output = "in " + output;
    }
    if (raw) {
        return output;
    }
    return `<span data-timestamp="${timestamp}">${output}</span>`;
}
function updateTimestamps() {
    let timestamps = document.querySelectorAll("[data-timestamp]");
    for (const i of timestamps) {
        let newTime = getTimestamp(+(i.dataset.timestamp || NaN), true);
        if (newTime !== i.innerText) {
            i.innerText = newTime;
        }
    }
}
setInterval(updateTimestamps, 1000);
function p_home(element) {
    hookTimeline(element.querySelector("[id=\"timeline-posts\"]"), {
        following: { url: "/api/timeline/following", prependPosts: true },
        global: { url: "/api/timeline/global", prependPosts: true }
    }, "global");
}
function loginSubmitEvent(e) {
    let usernameElement = document.getElementById("username");
    let passwordElement = document.getElementById("password");
    if (!usernameElement || !passwordElement) {
        return;
    }
    let username = usernameElement.value;
    let password = passwordElement.value;
    if (!username) {
        usernameElement.focus();
        return;
    }
    else if (!password) {
        passwordElement.focus();
        return;
    }
    fetch("/api/user/login", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: sha256(password)
        }),
        headers: { Accept: "application/json" }
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            document.cookie = `token=${json.token};Path=/;SameSite=Lax;Expires=${new Date(new Date().getTime() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
            location.href = "/";
        }
        else {
            switch (json.reason) {
                case "BAD_USERNAME":
                    createToast("Incorrect username.", `User '${escapeHTML(username)}' does not exist.`);
                    usernameElement.focus();
                    break;
                case "BAD_PASSWORD":
                    createToast("Incorrect password.");
                    passwordElement.focus();
                    break;
                case "RATELIMIT":
                    createToast("Ratelimited.", "Try again in a few seconds.");
                    break;
                default: createToast("Something went wrong!");
            }
        }
    })
        .catch((err) => {
        createToast("Something went wrong!", String(err));
        throw err;
    });
}
function p_login(element) {
    element.querySelector("#submit").addEventListener("click", loginSubmitEvent);
}
function p_logout(element) {
    document.cookie = "token=;Path=/;Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    location.href = "/";
}
function signupSubmitEvent(e) {
    let usernameElement = document.getElementById("username");
    let passwordElement = document.getElementById("password");
    let confirmElement = document.getElementById("confirm");
    let otpElement = document.getElementById("otp");
    if (!usernameElement || !passwordElement || !confirmElement || !otpElement) {
        return;
    }
    let username = usernameElement.value;
    let password = passwordElement.value;
    let confirm = confirmElement.value;
    let otp = null;
    if (!otpElement.hidden) {
        otp = otpElement.value;
    }
    if (!otpElement.hidden && !otp) {
        otpElement.focus();
        return;
    }
    else if (!username) {
        usernameElement.focus();
        return;
    }
    else if (!password) {
        passwordElement.focus();
        return;
    }
    else if (password !== confirm) {
        confirmElement.focus();
        createToast("Passwords don't match.");
        return;
    }
    fetch("/api/user/signup", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: sha256(password),
            otp: otp
        }),
        headers: { Accept: "application/json" }
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            document.cookie = `token=${json.token};Path=/;SameSite=Lax;Expires=${new Date(new Date().getTime() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
            location.href = "/";
        }
        else {
            switch (json.reason) {
                case "USERNAME_USED":
                    createToast("Username in use.", `User '${escapeHTML(username)}' already exists.`);
                    usernameElement.focus();
                    break;
                case "BAD_PASSWORD":
                    createToast("Invalid password.");
                    passwordElement.focus();
                    break;
                case "INVALID_OTP":
                    createToast("Invalid invite code.", "Make sure your invite code is valid and try again.");
                    otpElement.focus();
                    break;
                case "RATELIMIT":
                    createToast("Ratelimited.", "Try again in a few seconds.");
                    break;
                default: createToast("Something went wrong!");
            }
        }
    })
        .catch((err) => {
        createToast("Something went wrong!", String(err));
        throw err;
    });
}
function p_signup(element) {
    element.querySelector("#submit").addEventListener("click", signupSubmitEvent);
}

let faviconRegex = /\/favicons\/([a-z]+)-([a-z]+)\.ico^/;
inc = 0;
home = true;
let output = "<select id=\"color\">";
for (const color of validColors) {
    output += `<option ${((localStorage.getItem("color") == color || (!localStorage.getItem("color") && color == "mauve")) ? "selected" : "")} value="${color}">${lang.generic.colors[color]}</option>`;
}
output += "</select><br><br>";
if (ENABLE_PRONOUNS && user_pronouns.includes("_")) {
    dom("pronouns-secondary-container").setAttribute("hidden", "");
    document.querySelector(`#pronouns-primary option[value="${user_pronouns}"]`).setAttribute("selected", "");
}
else if (ENABLE_PRONOUNS) {
    dom("pronouns-secondary-container").removeAttribute("hidden");
    document.querySelector(`#pronouns-primary option[value="${user_pronouns[0]}"]`).setAttribute("selected", "");
    document.querySelector(`#pronouns-secondary option[value="${user_pronouns[1]}"]`).setAttribute("selected", "");
}
if (localStorage.getItem("checkboxes")) {
    dom("disable-checkboxes").setAttribute("checked", "");
}
let currentAccount;
let accounts;
let hasCurrent;
if (ENABLE_ACCOUNT_SWITCHER) {
    currentAccount = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
    accounts = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[localStorage.getItem("username"), currentAccount]]));
    if (!localStorage.getItem("username")) {
        dom("switcher").setAttribute("hidden", "");
    }
    hasCurrent = false;
    for (const acc of accounts) {
        if (currentAccount == acc[1]) {
            hasCurrent = true;
        }
    }
    if (!hasCurrent) {
        accounts.push([
            localStorage.getItem("username"),
            document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1]
        ]);
    }
    accounts = accounts.sort((a, b) => (a[0].toLowerCase() > b[0].toLowerCase() ? 1 : 0));
    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
    let x = new DocumentFragment();
    for (const acc of accounts) {
        let y = document.createElement("option");
        y.innerText = acc[0];
        y.value = acc[1] + "-" + acc[0];
        if (currentAccount == acc[1]) {
            y.setAttribute("selected", "");
        }
        x.append(y);
    }
    dom("accs").append(x);
}
dom("color-selector").innerHTML = output;
dom("post-example").innerHTML = getPostHTML({
    creator: {
        badges: ["administrator"],
        color_one: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
        color_two: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
        display_name: lang.settings.cosmetic_example_post_display_name,
        gradient_banner: true,
        pronouns: "aa",
        username: lang.settings.cosmetic_example_post_username,
    },
    private: false,
    can_delete: false,
    can_view: true,
    comments: Math.floor(Math.random() * 100),
    content: lang.settings.cosmetic_example_post_content,
    liked: true,
    likes: Math.floor(Math.random() * 99) + 1,
    owner: false,
    parent_is_comment: false,
    parent: -1,
    post_id: 0,
    quotes: Math.floor(Math.random() * 100),
    c_warning: null,
    timestamp: Date.now() / 1000 - Math.random() * 86400,
    poll: null,
    logged_in: true
}, false, false, false, true);
function toggleGradient(setUnloadStatus) {
    if (typeof setUnloadStatus !== "boolean" || setUnloadStatus) {
        setUnload();
    }
    if (ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").checked) {
        dom("banner-color-two").removeAttribute("hidden");
        dom("banner").classList.add("gradient");
    }
    else {
        ENABLE_GRADIENT_BANNERS && dom("banner-color-two").setAttribute("hidden", "");
        dom("banner").classList.remove("gradient");
    }
}
function updatePronouns() {
    setUnload();
    if (this.id == "pronouns-primary") {
        if (this.value.length != 1) {
            user_pronouns = this.value;
            dom("pronouns-secondary-container").setAttribute("hidden", "");
        }
        else {
            user_pronouns = this.value + dom("pronouns-secondary").value;
            dom("pronouns-secondary-container").removeAttribute("hidden");
        }
    }
    else {
        user_pronouns = user_pronouns[0] + this.value;
    }
}
function setUnload() {
    if (!onbeforeunload) {
        onbeforeunload = function () {
            return lang.settings.unload;
        };
    }
}
toggleGradient(false);
dom("color").addEventListener("change", function () {
    localStorage.setItem("color", dom("color").value);
    favicon.href = favicon.href.replace(faviconRegex, `/favicons/$1-${dom("color").value}.ico`);
    document.body.setAttribute('data-color', dom("color").value);
});
dom("bar-pos").value = localStorage.getItem("bar-pos") || "ul";
dom("bar-pos").addEventListener("change", function () {
    localStorage.setItem("bar-pos", dom("bar-pos").value);
    document.body.setAttribute("data-bar-pos", dom("bar-pos").value);
});
dom("bar-dir").value = localStorage.getItem("bar-dir") || "v";
dom("bar-dir").addEventListener("change", function () {
    localStorage.setItem("bar-dir", dom("bar-dir").value);
    document.body.setAttribute("data-bar-dir", dom("bar-dir").value);
});
dom("disable-checkboxes").addEventListener("input", function () {
    if (localStorage.getItem("checkboxes")) {
        localStorage.removeItem("checkboxes");
        document.body.removeAttribute("data-disable-checkboxes");
    }
    else {
        localStorage.setItem("checkboxes", ":3");
        document.body.setAttribute("data-disable-checkboxes", "");
    }
});
ENABLE_USER_BIOS && dom("bio").addEventListener("input", postTextInputEvent);
dom("displ-name").addEventListener("input", setUnload);
dom("default-post").addEventListener("input", setUnload);
dom("followers-approval").addEventListener("input", setUnload);
dom("no-css").addEventListener("input", setUnload);
dom("theme").addEventListener("change", function () {
    dom("theme").setAttribute("disabled", "");
    fetch("/api/user/settings/theme", {
        method: "PATCH",
        body: JSON.stringify({
            theme: dom("theme").value
        })
    })
        .then((response) => (response.json()))
        .then((json) => {
        if (!json.success) {
            showlog(lang.generic.something_went_wrong);
        }
        dom("theme").removeAttribute("disabled");
        favicon.href = favicon.href.replace(faviconRegex, `/favicons/${dom("theme").value}-$2.ico`);
        document.querySelector("body").setAttribute("data-theme", dom("theme").value);
    })
        .catch((err) => {
        dom("theme").removeAttribute("disabled");
        showlog(lang.generic.something_went_wrong);
    });
});
dom("save").addEventListener("click", function () {
    ENABLE_USER_BIOS && dom("bio").setAttribute("disabled", "");
    dom("save").setAttribute("disabled", "");
    dom("displ-name").setAttribute("disabled", "");
    dom("no-css").setAttribute("disabled", "");
    dom("banner-color").setAttribute("disabled", "");
    dom("lang").setAttribute("disabled", "");
    dom("default-post").setAttribute("disabled", "");
    dom("followers-approval").setAttribute("disabled", "");
    ENABLE_GRADIENT_BANNERS && dom("banner-color-two").setAttribute("disabled", "");
    ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").setAttribute("disabled", "");
    fetch("/api/user/settings", {
        method: "PATCH",
        body: JSON.stringify({
            bio: ENABLE_USER_BIOS ? dom("bio").value : "",
            lang: dom("lang").value,
            color: dom("banner-color").value,
            no_css: dom("no-css").checked,
            pronouns: ENABLE_PRONOUNS ? user_pronouns : "__",
            color_two: ENABLE_GRADIENT_BANNERS ? dom("banner-color-two").value : "",
            displ_name: dom("displ-name").value,
            is_gradient: ENABLE_GRADIENT_BANNERS ? dom("banner-is-gradient").checked : false,
            approve_followers: dom("followers-approval").checked,
            default_post_visibility: dom("default-post").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            onbeforeunload = null;
            showlog(lang.generic.success);
            if (lang.meta.language !== dom("lang").value) {
                location.reload();
            }
        }
        else {
            showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
        }
        throw "erm what the flip";
    })
        .catch((err) => {
        ENABLE_USER_BIOS && dom("bio").removeAttribute("disabled");
        dom("save").removeAttribute("disabled");
        dom("displ-name").removeAttribute("disabled");
        dom("no-css").removeAttribute("disabled");
        dom("banner-color").removeAttribute("disabled");
        dom("lang").removeAttribute("disabled");
        dom("default-post").removeAttribute("disabled");
        dom("followers-approval").removeAttribute("disabled");
        ENABLE_GRADIENT_BANNERS && dom("banner-color-two").removeAttribute("disabled");
        ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").removeAttribute("disabled");
    });
});
dom("banner-color").addEventListener("input", function () {
    setUnload();
    document.body.style.setProperty("--banner", this.value);
});
ENABLE_GRADIENT_BANNERS && dom("banner-color-two").addEventListener("input", function () {
    setUnload();
    document.body.style.setProperty("--banner-two", this.value);
});
ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").addEventListener("input", toggleGradient);
ENABLE_ACCOUNT_SWITCHER && dom("acc-switch").addEventListener("click", function () {
    let val = dom("accs").value.split("-", 2);
    setCookie("token", val[0]);
    localStorage.setItem("username", val[1]);
    location.reload();
});
ENABLE_ACCOUNT_SWITCHER && dom("acc-remove").addEventListener("click", function () {
    let removed = dom("accs").value.split("-", 2);
    if (removed[0] == currentAccount) {
        showlog(lang.settings.account_switcher_remove_error);
    }
    else {
        for (let i = 0; i < accounts.length; i++) {
            if (accounts[i][1] == removed[0]) {
                accounts.splice(i, 1);
                --i;
            }
        }
        dom("accs").querySelector(`option[value="${dom("accs").value}"]`).remove();
        localStorage.setItem("acc-switcher", JSON.stringify(accounts));
    }
});
ENABLE_PRONOUNS && dom("pronouns-primary").addEventListener("input", updatePronouns);
ENABLE_PRONOUNS && dom("pronouns-secondary").addEventListener("input", updatePronouns);
dom("toggle-password").addEventListener("click", function () {
    let newType = dom("password").getAttribute("type") === "password" ? "text" : "password";
    dom("current").setAttribute("type", newType);
    dom("password").setAttribute("type", newType);
    dom("confirm").setAttribute("type", newType);
});
dom("set-password").addEventListener("click", function () {
    let old_password = sha256(dom("current").value);
    let password = sha256(dom("password").value);
    if (password !== sha256(dom("confirm").value)) {
        showlog(lang.account.password_match_failure);
        return;
    }
    this.setAttribute("disabled", "");
    fetch("/api/user/password", {
        method: "PATCH",
        body: JSON.stringify({
            password: old_password,
            new_password: password
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            setCookie("token", json.token);
            if (ENABLE_ACCOUNT_SWITCHER) {
                let switcher = JSON.parse(localStorage.getItem("acc-switcher"));
                for (let i = 0; i < switcher.length; i++) {
                    if (switcher[i][1] == currentAccount) {
                        switcher[i][1] = json.token;
                    }
                }
                localStorage.setItem("acc-switcher", JSON.stringify(switcher));
            }
            showlog(lang.settings.account_password_success, 5000);
        }
        else {
            showlog(lang.settings.account_password_failure.replaceAll("%s", json.reason));
        }
        this.removeAttribute("disabled");
    }).catch((err) => {
        this.removeAttribute("disabled");
        showlog(lang.generic.something_went_wrong);
    });
});
dom("current").addEventListener("keydown", function (event) {
    if (event.key == "Enter" || event.keyCode == 18) {
        dom("password").focus();
    }
});
dom("password").addEventListener("keydown", function (event) {
    if (event.key == "Enter" || event.keyCode == 18) {
        dom("confirm").focus();
    }
});
dom("confirm").addEventListener("keydown", function (event) {
    if (event.key == "Enter" || event.keyCode == 18) {
        dom("set-password").focus();
        dom("set-password").click();
    }
});
ENABLE_EMAIL && dom("email-submit").addEventListener("click", function () {
    dom("email").setAttribute("disabled", "");
    dom("email-submit").setAttribute("disbaled", "");
    fetch("/api/email/save", {
        body: JSON.stringify({
            email: dom("email").value
        }),
        method: "POST"
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            if (hasEmail) {
                dom("email-output").innerHTML = lang.settings.account_email_check;
            }
            else {
                dom("email-output").innerHTML = lang.settings.account_email_verify;
            }
        }
        else {
            dom("email-output").innerHTML = json.reason;
        }
    });
});

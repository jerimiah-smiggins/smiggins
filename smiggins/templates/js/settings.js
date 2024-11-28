let unload = false;
inc = 0;
home = true;
let output = "<select id=\"color\">";
for (const color of validColors) {
    output += `<option ${((localStorage.getItem("color") == color || (!localStorage.getItem("color") && color == "mauve")) ? "selected" : "")} value="${color}">${lang.generic.colors[color]}</option>`;
}
output += "</select><br><br>";
if (ENABLE_PRONOUNS && lang.generic.pronouns.enable_pronouns) {
    try {
        let primary = document.querySelector(`#pronouns-primary > option[value="${userPronouns.primary}"]`);
        primary.setAttribute("selected", "");
        if (lang.generic.pronouns.enable_secondary) {
            if (primary.dataset.special == "no-secondary") {
                dom("pronouns-secondary").setAttribute("hidden", "");
            }
            document.querySelector(`#pronouns-secondary > option[value="${userPronouns.secondary}"]`).setAttribute("selected", "");
        }
    }
    catch (err) {
        console.error("Error loading pronouns", err);
    }
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
    can_edit: false,
    can_pin: false,
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
    logged_in: true,
    edited: false
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
        if (lang.generic.pronouns.enable_secondary) {
            if (document.querySelector(`#pronouns-primary > option[value="${this.value}"]`).dataset.special == "no-secondary") {
                dom("pronouns-secondary-container").setAttribute("hidden", "");
                userPronouns.secondary = null;
            }
            else {
                dom("pronouns-secondary-container").removeAttribute("hidden");
                userPronouns.secondary = dom("pronouns-secondary").value;
            }
        }
        userPronouns.primary = this.value;
    }
    else {
        if (document.querySelector(`#pronouns-secondary > option[value="${this.value}"]`).dataset.special == "inherit") {
            userPronouns.secondary = userPronouns.primary;
        }
        else {
            userPronouns.secondary = this.value;
        }
    }
}
function setUnload() {
    unload = true;
    if (!onbeforeunload) {
        onbeforeunload = function (event) {
            return lang.settings.unload;
        };
    }
}
function removeUnload() {
    unload = false;
    onbeforeunload = null;
}
if (oldFavicon) {
    dom("old-favi").setAttribute("checked", "");
}
ENABLE_DYNAMIC_FAVICON && dom("old-favi").addEventListener("input", function () {
    oldFavicon = this.checked;
    if (oldFavicon) {
        localStorage.setItem("old-favicon", "1");
        setOldFavicon();
    }
    else {
        localStorage.removeItem("old-favicon");
        if (autoEnabled) {
            autoSetFavicon();
        }
        else {
            setGenericFavicon();
        }
    }
});
toggleGradient(false);
dom("color").addEventListener("change", function () {
    localStorage.setItem("color", dom("color").value);
    document.body.setAttribute('data-color', dom("color").value);
    if (!oldFavicon) {
        setGenericFavicon();
    }
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
dom("lang").addEventListener("input", setUnload);
dom("lang").addEventListener("change", setUnload);
dom("theme").addEventListener("change", function () {
    dom("theme").setAttribute("disabled", "");
    s_fetch("/api/user/settings/theme", {
        method: "PATCH",
        body: JSON.stringify({
            theme: dom("theme").value
        }),
        disable: [this]
    });
});
function save(post, log) {
    removeUnload();
    s_fetch("/api/user/settings", {
        method: "PATCH",
        body: JSON.stringify({
            bio: ENABLE_USER_BIOS ? dom("bio").value : "",
            lang: dom("lang").value,
            color: dom("banner-color").value,
            pronouns: userPronouns || { primary: "", secondary: null },
            color_two: ENABLE_GRADIENT_BANNERS ? dom("banner-color-two").value : "",
            displ_name: dom("displ-name").value,
            is_gradient: ENABLE_GRADIENT_BANNERS ? dom("banner-is-gradient").checked : false,
            approve_followers: dom("followers-approval").checked,
            default_post_visibility: dom("default-post").value
        }),
        customLog: log,
        disable: [
            this,
            dom("displ-name"),
            ENABLE_USER_BIOS && dom("bio"),
            ENABLE_PRONOUNS && dom("pronouns-primary"),
            ENABLE_PRONOUNS && dom("pronouns-secondary"),
            dom("banner-color"),
            ENABLE_GRADIENT_BANNERS && dom("banner-color-two"),
            ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient"),
            dom("default-post"),
            dom("followers-approval"),
            dom("lang"),
        ],
        postFunction: (success) => {
            if (!success) {
                setUnload();
            }
            if (typeof post == "function") {
                post(success);
            }
        }
    });
}
dom("save").addEventListener("click", () => (save()));
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
    if (unload) {
        createModal(lang.settings.unload.title, lang.settings.unload.content, [
            {
                name: lang.settings.unload.leave,
                onclick: () => {
                    let val = dom("accs").value.split("-", 2);
                    setCookie("token", val[0]);
                    localStorage.setItem("username", val[1]);
                    removeUnload();
                    location.href = location.href;
                    closeModal();
                }
            },
            { name: lang.generic.cancel, onclick: closeModal }
        ]);
    }
    else {
        let val = dom("accs").value.split("-", 2);
        setCookie("token", val[0]);
        localStorage.setItem("username", val[1]);
        location.href = location.href;
    }
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
ENABLE_PRONOUNS && lang.generic.pronouns.enable_pronouns && dom("pronouns-primary").addEventListener("input", updatePronouns);
ENABLE_PRONOUNS && lang.generic.pronouns.enable_pronouns && lang.generic.pronouns.enable_secondary && dom("pronouns-secondary").addEventListener("input", updatePronouns);
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
    s_fetch("/api/user/password", {
        method: "PATCH",
        body: JSON.stringify({
            password: old_password,
            new_password: password
        }),
        disable: [this],
        postFunction: (success) => {
            if (success && ENABLE_ACCOUNT_SWITCHER) {
                let switcher = JSON.parse(localStorage.getItem("acc-switcher"));
                let newToken = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
                for (let i = 0; i < switcher.length; i++) {
                    if (switcher[i][1] == currentAccount) {
                        switcher[i][1] = newToken;
                    }
                }
                currentAccount = newToken;
                localStorage.setItem("acc-switcher", JSON.stringify(switcher));
            }
        }
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
    s_fetch("/api/email/save", {
        method: "POST",
        body: JSON.stringify({
            email: dom("email").value,
            password: sha256(dom("email-password").value)
        }),
        disable: [dom("email"), dom("email-submit")]
    });
});
dom("delete-account").addEventListener("click", function () {
    createModal(escapeHTML(lang.admin.account_deletion.title), escapeHTML(lang.settings.account_deletion_warning), [
        { name: lang.generic.cancel, onclick: closeModal },
        { name: lang.settings.account_deletion_confirm, onclick: () => {
                createModal(escapeHTML(lang.admin.account_deletion.title), `${escapeHTML(lang.settings.account_deletion_password)}<br><input type="password" id="account-deletion-password" placeholder="${escapeHTML(lang.account.password_placeholder)}">`, [
                    { name: lang.generic.cancel, onclick: closeModal },
                    { name: lang.admin.account_deletion.button, onclick: () => {
                            s_fetch("/api/user", {
                                method: "DELETE",
                                body: JSON.stringify({
                                    password: sha256(dom("account-deletion-password").value)
                                }),
                                customLog: dom("modal-log"),
                                postFunction: (success) => {
                                    if (success) {
                                        closeModal();
                                    }
                                }
                            });
                        } }
                ]);
            } }
    ]);
});
onLoad = function () {
    document.querySelectorAll("a").forEach((val, index) => {
        if (!val.href || val.href[0] === "#" || val.href.startsWith("javascript:") || val.target === "_blank") {
            return;
        }
        val.addEventListener("click", (event) => {
            if (unload) {
                let url = val.href;
                event.preventDefault();
                createModal(lang.settings.unload.title, lang.settings.unload.content, [
                    {
                        name: lang.settings.unload.leave,
                        onclick: () => {
                            removeUnload();
                            location.href = url;
                            closeModal();
                        }
                    }, {
                        name: lang.settings.unload.save,
                        class: "primary",
                        onclick: () => {
                            save((success) => {
                                if (success) {
                                    location.href = url;
                                }
                            }, dom("modal-log"));
                        }
                    },
                    { name: lang.generic.cancel, onclick: closeModal }
                ]);
            }
        });
    });
};

let unload;
function toggleGradient(setUnloadStatus) {
    if (typeof setUnloadStatus !== "boolean" || setUnloadStatus) {
        setUnload();
    }
    if (conf.gradient_banners && dom("banner-is-gradient").checked) {
        dom("banner-color-two").removeAttribute("hidden");
        dom("banner").classList.add("gradient");
    }
    else {
        conf.gradient_banners && dom("banner-color-two").setAttribute("hidden", "");
        dom("banner").classList.remove("gradient");
    }
}
function updatePronouns() {
    setUnload();
    if (this.id == "pronouns-primary") {
        if (lang.generic.pronouns.enable_secondary) {
            if (document.querySelector(`#pronouns-primary > option[value="${this.value}"]`).dataset.special == "no-secondary") {
                dom("pronouns-secondary-container").setAttribute("hidden", "");
                context.pronouns.secondary = null;
            }
            else {
                dom("pronouns-secondary-container").removeAttribute("hidden");
                context.pronouns.secondary = dom("pronouns-secondary").value;
            }
        }
        context.pronouns.primary = this.value;
    }
    else {
        if (document.querySelector(`#pronouns-secondary > option[value="${this.value}"]`).dataset.special == "inherit") {
            context.pronouns.secondary = context.pronouns.primary;
        }
        else {
            context.pronouns.secondary = this.value;
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
function save(post) {
    removeUnload();
    s_fetch("/api/user/settings", {
        method: "PATCH",
        body: JSON.stringify({
            bio: conf.user_bios ? dom("bio").value : "",
            lang: dom("lang").value,
            color: dom("banner-color").value,
            pronouns: Boolean(Object.keys(context.pronouns).length) ? context.pronouns : { primary: "", secondary: null },
            color_two: conf.gradient_banners ? dom("banner-color-two").value : "",
            displ_name: dom("displ-name").value,
            is_gradient: conf.gradient_banners ? dom("banner-is-gradient").checked : false,
            approve_followers: dom("followers-approval").checked,
            default_post_visibility: dom("default-post").value
        }),
        disable: [
            this,
            dom("displ-name"),
            conf.user_bios && dom("bio"),
            conf.pronouns && dom("pronouns-primary"),
            conf.pronouns && dom("pronouns-secondary"),
            dom("banner-color"),
            conf.gradient_banners && dom("banner-color-two"),
            conf.gradient_banners && dom("banner-is-gradient"),
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
function settingsInit() {
    document.body.style.setProperty("--banner", context.banner_color_one);
    document.body.style.setProperty("--banner-two", context.banner_color_two);
    unload = false;
    inc = 0;
    if (conf.pronouns && lang.generic.pronouns.enable_pronouns && lang.generic.pronouns.enable_secondary) {
        let primary = document.querySelector(`#pronouns-primary > option[value="${context.pronouns.primary}"]`);
        if (!primary || primary.dataset.special == "no-secondary") {
            dom("pronouns-secondary-container").setAttribute("hidden", "");
        }
    }
    if (localStorage.getItem("checkboxes")) {
        dom("disable-checkboxes").setAttribute("checked", "");
    }
    let currentAccount;
    let accounts;
    let hasCurrent;
    if (conf.account_switcher) {
        currentAccount = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
        accounts = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[username, currentAccount]]));
        if (!username) {
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
                username,
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
    if (oldFavicon) {
        dom("old-favi").setAttribute("checked", "");
    }
    conf.dynamic_favicon && dom("old-favi").addEventListener("input", function () {
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
    dom("expand-cws").checked = !!localStorage.getItem("expand-cws");
    dom("expand-cws").addEventListener("change", function () {
        if (this.checked) {
            localStorage.setItem("expand-cws", "1");
        }
        else {
            localStorage.removeItem("expand-cws");
        }
    });
    dom("compact").checked = !!localStorage.getItem("compact");
    dom("compact").addEventListener("change", function () {
        if (this.checked) {
            localStorage.setItem("compact", "1");
            document.body.dataset.compact = "";
        }
        else {
            localStorage.removeItem("compact");
            document.body.removeAttribute("data-compact");
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
    dom("save").addEventListener("click", () => (save()));
    dom("banner-color").addEventListener("input", function () {
        setUnload();
        document.body.style.setProperty("--banner", this.value);
    });
    conf.gradient_banners && dom("banner-color-two").addEventListener("input", function () {
        setUnload();
        document.body.style.setProperty("--banner-two", this.value);
    });
    conf.gradient_banners && dom("banner-is-gradient").addEventListener("input", toggleGradient);
    conf.account_switcher && dom("acc-switch").addEventListener("click", function () {
        if (unload) {
            createModal(lang.settings.unload.title, lang.settings.unload.content, [
                {
                    name: lang.settings.unload.leave,
                    onclick: () => {
                        let val = dom("accs").value.split("-", 2);
                        setCookie("token", val[0]);
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
            location.href = location.href;
        }
    });
    conf.account_switcher && dom("acc-remove").addEventListener("click", function () {
        let removed = dom("accs").value.split("-", 2);
        if (removed[0] == currentAccount) {
            toast(lang.settings.account_switcher_remove_error, true);
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
    conf.pronouns && lang.generic.pronouns.enable_pronouns && dom("pronouns-primary").addEventListener("input", updatePronouns);
    conf.pronouns && lang.generic.pronouns.enable_pronouns && lang.generic.pronouns.enable_secondary && dom("pronouns-secondary").addEventListener("input", updatePronouns);
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
            toast(lang.account.password_match_failure, true);
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
                if (success && conf.account_switcher) {
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
        if (event.key == "Enter") {
            dom("password").focus();
        }
    });
    dom("password").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            dom("confirm").focus();
        }
    });
    dom("confirm").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            dom("set-password").focus();
            dom("set-password").click();
        }
    });
    dom("save-muted").addEventListener("click", function () {
        s_fetch("/api/user/muted", {
            method: "POST",
            body: JSON.stringify({
                soft: dom("soft-mute").value,
                hard: dom("hard-mute").value
            }),
            disable: [this, dom("muted")]
        });
    });
    conf.email && dom("email-submit").addEventListener("click", function () {
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
    redirectConfirmation = (url) => {
        if (!unload) {
            return true;
        }
        createModal(lang.settings.unload.title, lang.settings.unload.content, [
            {
                name: lang.settings.unload.leave,
                onclick: () => {
                    removeUnload();
                    closeModal();
                    redirect(url, true);
                }
            }, {
                name: lang.settings.unload.save,
                class: "primary",
                onclick: () => {
                    save((success) => {
                        if (success) {
                            removeUnload();
                            closeModal();
                            redirect(url, true);
                        }
                    });
                }
            },
            { name: lang.generic.cancel, onclick: closeModal }
        ]);
        return false;
    };
}

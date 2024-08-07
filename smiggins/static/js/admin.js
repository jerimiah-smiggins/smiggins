inc = 0;
home = true;
adminLevel >= 1 && dom("post-delete").addEventListener("click", function () {
    fetch(`/api/${dom("comment-toggle").checked ? "comment" : "post"}`, {
        method: "DELETE",
        body: JSON.stringify({
            id: Number(dom("post-id").value)
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.post_deletion_error), 5000);
        }
    });
});
adminLevel >= 2 && dom("account-delete").addEventListener("click", function () {
    fetch("/api/admin/user", {
        method: "DELETE",
        body: JSON.stringify({
            identifier: dom("account-del-identifier").value,
            use_id: dom("delete-id-toggle").checked
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.account_deletion_error), 5000);
        }
    });
});
ENABLE_BADGES && adminLevel >= 3 && dom("badge-add").addEventListener("click", function () {
    fetch("/api/admin/badge", {
        method: "POST",
        body: JSON.stringify({
            identifier: dom("badge-identifier").value,
            use_id: dom("badge-use-id").checked,
            badge_name: dom("badge-name").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.badge_manage_add_error));
        }
    });
});
ENABLE_BADGES && adminLevel >= 3 && dom("badge-remove").addEventListener("click", function () {
    fetch("/api/admin/badge", {
        method: "PATCH",
        body: JSON.stringify({
            identifier: dom("badge-identifier").value,
            use_id: dom("badge-use-id").checked,
            badge_name: dom("badge-name").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.badge_manage_remove_error));
        }
    });
});
ENABLE_BADGES && adminLevel >= 3 && dom("badge-create").addEventListener("click", function () {
    fetch("/api/admin/badge", {
        method: "PUT",
        body: JSON.stringify({
            badge_name: dom("badge-create-name").value,
            badge_data: dom("badge-create-data").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(`${lang.generic.success} ${lang.admin.badge_create_success}`);
        }
        else {
            showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
        }
    });
});
ENABLE_BADGES && adminLevel >= 3 && dom("badge-delete").addEventListener("click", function () {
    fetch("/api/admin/badge", {
        method: "DELETE",
        body: JSON.stringify({
            badge_name: dom("badge-delete-name").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
        }
    });
});
adminLevel >= 4 && dom("data-get").addEventListener("click", function () {
    fetch(`/api/admin/info?identifier=${dom("data-identifier").value}&use_id=${dom("data-use-id").checked}`)
        .then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            dom("data-section").innerHTML = `
          ${lang.admin.modify_current} <a href="/u/${json.username}"><code>@${json.username}</code></a> (${lang.admin.modify_id.replaceAll("%s", json.user_id)})<br>
          <input maxlength="300" id="data-display-name" placeholder="${lang.settings.profile_display_name_placeholder}" value="${escapeHTML(json.displ_name || "")}"><br>
          <textarea maxlength="65536" id="data-bio" placeholder="${lang.settings.profile_bio_placeholder}">${escapeHTML(json.bio || "")}</textarea><br>
          <button id="data-save" data-user-id="${json.user_id}">${lang.admin.modify_save}</button><br>
          ${ENABLE_ACCOUNT_SWITCHER ? `<button id="data-switcher" data-token="${json.token}" data-username="${json.username}">${lang.admin.modify_switcher}</button>` : ""}
        `;
            dom("data-display-name").addEventListener("input", postTextInputEvent);
            dom("data-bio").addEventListener("input", postTextInputEvent);
            ENABLE_ACCOUNT_SWITCHER && dom("data-switcher").addEventListener("click", function () {
                let username = this.dataset.username;
                let token = this.dataset.token;
                let accounts = JSON.parse(localStorage.getItem("acc-switcher") || "[]");
                if (!accounts.includes([username, token])) {
                    accounts.push([username, token]);
                    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
                }
                showlog(lang.generic.success);
            });
            dom("data-save").addEventListener("click", function () {
                fetch("/api/admin/save-acc", {
                    method: "PATCH",
                    body: JSON.stringify({
                        id: this.dataset.userId,
                        bio: dom("data-bio").value,
                        displ_name: dom("data-display-name").value
                    })
                }).then((response) => (response.json()))
                    .then((json) => {
                    if (json.success) {
                        showlog("Saved!");
                    }
                    else {
                        showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
                    }
                });
            });
        }
        else {
            showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
        }
    });
});
adminLevel >= 4 && dom("debug-button").addEventListener("click", function () {
    this.setAttribute("disabled", "");
    fetch("/api/admin/logs")
        .then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            let lines = atob(json.content).split("\n");
            let output = `<table class="admin-logs bordered"><tr><th>${lang.admin.logs_timestamp}</th><th>${lang.admin.logs_action}</th><th>${lang.admin.logs_who}</th><th class="nowrap">${lang.admin.logs_more_info}</th></tr>`;
            for (const line of lines) {
                try {
                    output += `<tr><td class="nowrap">${timeSince(+line.split(" ", 2)[0])}</td><td class="nowrap">${line.split(",", 2)[0].split("- ", 2)[1]}</td><td class="nowrap">${line.split(",")[1].split(") - ", 2)[0]})</td><td>${escapeHTML(line.split(",").slice(1).join(",").split(") - ", 2)[1])}</td></tr>`;
                }
                catch (err) { }
            }
            dom("debug").innerHTML = output + "</table>";
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.logs_error));
            this.removeAttribute("disabled");
        }
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.logs_error));
        this.removeAttribute("disabled");
    });
});
adminLevel >= 5 && dom("level-set").addEventListener("click", function () {
    fetch("/api/admin/level", {
        method: "PATCH",
        body: JSON.stringify({
            identifier: dom("level-identifier").value,
            use_id: dom("level-use-id").checked,
            level: dom("level-selection").value
        })
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.generic.success);
        }
        else {
            showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.level_error));
        }
    });
});

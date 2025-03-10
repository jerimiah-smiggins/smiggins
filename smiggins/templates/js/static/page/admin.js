var Mask;
(function (Mask) {
    Mask[Mask["DeletePost"] = 0] = "DeletePost";
    Mask[Mask["DeleteUser"] = 1] = "DeleteUser";
    Mask[Mask["CreateBadge"] = 2] = "CreateBadge";
    Mask[Mask["DeleteBadge"] = 3] = "DeleteBadge";
    Mask[Mask["GiveBadges"] = 4] = "GiveBadges";
    Mask[Mask["ModifyAccount"] = 5] = "ModifyAccount";
    Mask[Mask["AccSwitcher"] = 6] = "AccSwitcher";
    Mask[Mask["AdminLevel"] = 7] = "AdminLevel";
    Mask[Mask["ReadLogs"] = 8] = "ReadLogs";
    Mask[Mask["GenerateOTP"] = 9] = "GenerateOTP";
    Mask[Mask["ChangeMutedWords"] = 10] = "ChangeMutedWords";
})(Mask || (Mask = {}));
;
function testMask(identifier, level = context.level) {
    return !!(level >> identifier & 1);
}
function adminInit() {
    inc = 0;
    conf.post_deletion && testMask(Mask.DeletePost) && dom("post-delete").addEventListener("click", function () {
        s_fetch(`/api/${dom("comment-toggle").checked ? "comment" : "post"}`, {
            method: "DELETE",
            body: JSON.stringify({
                id: Number(dom("post-id").value)
            }),
            disable: [this, dom("post-id")],
            postFunction: (success) => {
                if (success) {
                    toast(lang.generic.success);
                }
            }
        });
    });
    testMask(Mask.DeleteUser) && dom("account-delete").addEventListener("click", function () {
        s_fetch("/api/admin/user", {
            method: "DELETE",
            body: JSON.stringify({
                identifier: dom("account-del-identifier").value,
                use_id: dom("delete-id-toggle").checked
            }),
            disable: [this, dom("account-del-identifier")]
        });
    });
    conf.badges && testMask(Mask.GiveBadges) && dom("badge-add").addEventListener("click", function () {
        s_fetch("/api/admin/badge", {
            method: "POST",
            body: JSON.stringify({
                identifier: dom("badge-identifier").value,
                use_id: dom("badge-use-id").checked,
                badge_name: dom("badge-name").value
            }),
            disable: [this, dom("badge-identifier"), dom("badge-use-id"), dom("badge-name")]
        });
    });
    conf.badges && testMask(Mask.GiveBadges) && dom("badge-remove").addEventListener("click", function () {
        s_fetch("/api/admin/badge", {
            method: "PATCH",
            body: JSON.stringify({
                identifier: dom("badge-identifier").value,
                use_id: dom("badge-use-id").checked,
                badge_name: dom("badge-name").value
            }),
            disable: [this, dom("badge-identifier"), dom("badge-use-id"), dom("badge-name")]
        });
    });
    conf.badges && testMask(Mask.CreateBadge) && dom("badge-create").addEventListener("click", function () {
        s_fetch("/api/admin/badge", {
            method: "PUT",
            body: JSON.stringify({
                badge_name: dom("badge-create-name").value,
                badge_data: dom("badge-create-data").value
            }),
            disable: [this, dom("badge-create-name"), dom("badge-create-data")]
        });
    });
    conf.badges && testMask(Mask.DeleteBadge) && dom("badge-delete").addEventListener("click", function () {
        s_fetch("/api/admin/badge", {
            method: "DELETE",
            body: JSON.stringify({
                badge_name: dom("badge-delete-name").value
            }),
            disable: [this, dom("badge-delete-name")]
        });
    });
    testMask(Mask.ModifyAccount) && dom("data-get").addEventListener("click", function () {
        s_fetch(`/api/admin/info?identifier=${dom("data-identifier").value}&use_id=${dom("data-use-id").checked}`, {
            disable: [this, dom("data-identifier")]
        });
    });
    testMask(Mask.ReadLogs) && dom("load-logs").addEventListener("click", function () {
        s_fetch("/api/admin/logs", {
            disable: [this]
        });
    });
    testMask(Mask.AdminLevel) && dom("level-set").addEventListener("click", function () {
        s_fetch("/api/admin/level", {
            method: "PATCH",
            body: JSON.stringify({
                identifier: dom("level-identifier").value,
                use_id: dom("level-use-id").checked,
                level: parseInt(inlineFor([...document.querySelectorAll("#level-selection input[type='checkbox']")], (el) => (String(+el.checked))).split("").reverse().join(""), 2)
            }),
            disable: [this, dom("level-identifier")]
        });
    });
    testMask(Mask.AdminLevel) && dom("level-load").addEventListener("click", function () {
        s_fetch(`/api/admin/level?identifier=${dom("level-identifier").value}&use_id=${dom("level-use-id").checked}`, {
            disable: [this, dom("level-identifier")]
        });
    });
    conf.new_accounts == "otp" && testMask(Mask.GenerateOTP) && dom("otp-create").addEventListener("click", function () {
        s_fetch("/api/admin/otp", {
            method: "POST",
            disable: [this]
        });
    });
    conf.new_accounts == "otp" && testMask(Mask.GenerateOTP) && dom("otp-load").addEventListener("click", function () {
        s_fetch("/api/admin/otp", {
            disable: [this]
        });
    });
    testMask(Mask.ChangeMutedWords) && dom("save-muted").addEventListener("click", function () {
        s_fetch("/api/admin/muted", {
            method: "POST",
            body: JSON.stringify({
                muted: dom("muted").value
            }),
            disable: [this, dom("muted")]
        });
    });
}
function deleteOTP(code) {
    conf.new_accounts == "otp" && testMask(Mask.GenerateOTP) && s_fetch("/api/admin/otp", {
        method: "DELETE",
        body: JSON.stringify({
            otp: code
        }),
        disable: [this]
    });
}

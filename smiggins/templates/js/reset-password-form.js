dom("save").addEventListener("click", function () {
    if (!dom("confirm").value || !dom("password").value) {
        return;
    }
    if (dom("password").value !== dom("confirm").value) {
        toast(lang.account.password_match_failure, true);
        return;
    }
    s_fetch(formURL, {
        body: JSON.stringify({
            passhash: sha256(dom("password").value)
        }),
        method: "POST"
    });
});
dom("toggle-password").addEventListener("click", function () {
    let newType = dom("password").getAttribute("type") === "password" ? "text" : "password";
    dom("password").setAttribute("type", newType);
    dom("confirm").setAttribute("type", newType);
});

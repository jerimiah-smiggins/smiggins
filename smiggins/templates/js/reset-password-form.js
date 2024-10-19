dom("save").addEventListener("click", function () {
    if (!dom("confirm").value || !dom("password").value) {
        return;
    }
    if (dom("password").value !== dom("confirm").value) {
        showlog(lang.account.password_match_failure);
        return;
    }
    fetch(formURL, {
        body: JSON.stringify({
            passhash: sha256(dom("password").value)
        }),
        method: "POST"
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.valid) {
            setCookie("token", json.token);
            location.href = "/home/";
        }
        else {
            showlog(json.reason);
        }
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong);
        throw err;
    });
});
dom("toggle-password").addEventListener("click", function () {
    let newType = dom("password").getAttribute("type") === "password" ? "text" : "password";
    dom("password").setAttribute("type", newType);
    dom("confirm").setAttribute("type", newType);
});

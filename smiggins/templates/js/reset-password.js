dom("submit").addEventListener("click", function () {
    dom("username").setAttribute("disabled", "");
    dom("submit").setAttribute("disabled", "");
    fetch("/api/email/password", {
        body: JSON.stringify({
            username: dom("username").value
        }),
        method: "POST"
    }).then((response) => (response.json()))
        .then((json) => {
        if (json.success) {
            showlog(lang.settings.account_email_check);
        }
        else if (json.reason) {
            showlog(json.reason);
        }
        else {
            showlog(lang.generic.something_went_wrong);
        }
        dom("username").removeAttribute("disabled");
        dom("submit").removeAttribute("disabled");
    }).catch((err) => {
        showlog(lang.generic.something_went_wrong);
        dom("username").removeAttribute("disabled");
        dom("submit").removeAttribute("disabled");
    });
});

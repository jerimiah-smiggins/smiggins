inc = 0;
dom("toggle-password").addEventListener("click", function () {
    if (dom("password").getAttribute("type") == "password") {
        dom("password").setAttribute("type", "text");
    }
    else {
        dom("password").setAttribute("type", "password");
    }
});
dom("submit").addEventListener("click", function () {
    this.setAttribute("disabled", "");
    let username = dom("username").value;
    let password = sha256(dom("password").value);
    0;
    fetch("/api/user/login", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then((response) => {
        if (response.status == 429) {
            dom("post").removeAttribute("disabled");
            dom("post-text").removeAttribute("disabled");
            showlog(lang.generic.ratelimit_verbose);
        }
        else {
            response.json().then((json) => {
                if (json.valid) {
                    setCookie("token", json.token);
                    location.href = "/home";
                }
                else {
                    dom("submit").removeAttribute("disabled");
                    showlog(lang.account.log_in_failure.replaceAll("%s", json.reason));
                }
            });
        }
    })
        .catch((err) => {
        dom("submit").removeAttribute("disabled");
        showlog(lang.generic.something_went_wrong);
    });
});
dom("username").addEventListener("keydown", function (event) {
    if (event.key == "Enter" || event.keyCode == 18) {
        dom("password").focus();
    }
});
dom("password").addEventListener("keydown", function (event) {
    if (event.key == "Enter" || event.keyCode == 18) {
        dom("submit").focus();
        dom("submit").click();
    }
});

inc = 0;
dom("toggle-password").addEventListener("click", function () {
    if (dom("password").getAttribute("type") == "password") {
        dom("password").setAttribute("type", "text");
        dom("confirm").setAttribute("type", "text");
    }
    else {
        dom("password").setAttribute("type", "password");
        dom("confirm").setAttribute("type", "password");
    }
});
dom("submit").addEventListener("click", function () {
    let username = dom("username").value;
    let password = sha256(dom("password").value);
    if (password !== sha256(dom("confirm").value)) {
        showlog(lang.account.password_match_failure);
        return;
    }
    if (!username || password === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
        return;
    }
    s_fetch("/api/user/signup", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password
        }),
        disable: [this, dom("username"), dom("password"), dom("confirm")]
    });
});
dom("username").addEventListener("keydown", function (event) {
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
        dom("submit").focus();
        dom("submit").click();
    }
});

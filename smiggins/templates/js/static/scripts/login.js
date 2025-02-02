function loginInit() {
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
        s_fetch("/api/user/login", {
            method: "POST",
            body: JSON.stringify({
                username: username,
                password: password
            }),
            disable: [this, dom("username"), dom("password")]
        });
    });
    dom("username").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            event.preventDefault();
            dom("password").focus();
        }
    });
    dom("password").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            event.preventDefault();
            dom("submit").focus();
            dom("submit").click();
        }
    });
}

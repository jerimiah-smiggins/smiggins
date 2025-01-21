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
function signupInit() {
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
        let password = dom("password").value;
        if (password !== dom("confirm").value) {
            toast(lang.account.password_match_failure, false);
            return;
        }
        if (username === "" || password === "") {
            return;
        }
        let body = {
            username: username,
            password: sha256(password)
        };
        if (conf.new_accounts == "otp") {
            body.otp = dom("otp").value;
            if (body.otp.length !== 32) {
                toast(lang.account.invite_code_invalid, false);
                return;
            }
        }
        s_fetch("/api/user/signup", {
            method: "POST",
            body: JSON.stringify(body),
            disable: [this, dom("username"), dom("password"), dom("confirm"), dom("otp")]
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
            dom("confirm").focus();
        }
    });
    dom("confirm").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            event.preventDefault();
            if (dom("otp")) {
                dom("otp").focus();
            }
            else {
                dom("submit").focus();
                dom("submit").click();
            }
        }
    });
    dom("otp") && dom("otp").addEventListener("keydown", function (event) {
        if (event.key == "Enter") {
            event.preventDefault();
            dom("submit").focus();
            dom("submit").click();
        }
    });
}

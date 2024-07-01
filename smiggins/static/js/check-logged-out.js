(function () {
    let accounts = JSON.parse(localStorage.getItem("acc-switcher") || "[]");
    let username = localStorage.getItem("username");
    if (username && accounts.length) {
        let set = false;
        if (window.location.search != "?from=token") {
            for (const account of accounts) {
                if (!set && account[0] == username) {
                    setCookie("token", account[1]);
                    set = true;
                }
            }
        }
        localStorage.setItem("acc-switcher", JSON.stringify(accounts));
        if (!set) {
            setCookie("token", accounts[0][1]);
            localStorage.setItem("username", accounts[0][0]);
        }
        window.location.href = window.location.href;
    }
})();

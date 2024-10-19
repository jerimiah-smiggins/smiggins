(function () {
    let accounts = JSON.parse(localStorage.getItem("acc-switcher") || "[]");
    let username = localStorage.getItem("username");
    if (username && accounts.length) {
        let set = false;
        if (location.search != "?from=token") {
            for (const account of accounts) {
                if (!set && account[0] == username && document.cookie.split(/\btoken=/)[1].split(";")[0] != account[1]) {
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
        location.href = location.href;
    }
})();

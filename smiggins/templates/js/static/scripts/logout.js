function logoutInit() {
    eraseCookie("token");
    if (location.search == "?from=switcher") {
        location.href = "/login/";
    }
    else {
        localStorage.removeItem("home-page");
        localStorage.removeItem("color");
        localStorage.removeItem("acc-switcher");
        localStorage.removeItem("bar-pos");
        localStorage.removeItem("bar-dir");
        location.href = "/";
    }
}

function resetPasswordInit() {
    dom("submit").addEventListener("click", function () {
        s_fetch("/api/email/password", {
            method: "POST",
            body: JSON.stringify({
                username: dom("username").value
            }),
            disable: [dom("username"), dom("submit")]
        });
    });
}

let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") {
    page = "recent";
}
url = `/api/post/${page}`;
type = "post";
includeUserLink = true;
includePostLink = true;
function getPollText() {
    if (dom("poll").hasAttribute("hidden")) {
        return [];
    }
    let out = [];
    forEach(document.querySelectorAll("#poll input"), function (val, index) {
        if (val.value) {
            out.push(val.value);
        }
    });
    return out;
}
dom("switch").innerText = page == "recent" ? lang.home.switch_following : lang.home.switch_recent;
dom("post-text").addEventListener("input", postTextInputEvent);
dom("post").addEventListener("click", function () {
    if (dom("post-text").value || getPollText().length) {
        s_fetch("/api/post/create", {
            method: "PUT",
            body: JSON.stringify({
                c_warning: ENABLE_CONTENT_WARNINGS ? dom("c-warning").value : "",
                content: dom("post-text").value,
                poll: getPollText(),
                private: dom("default-private").checked
            }),
            disable: [
                this,
                dom("post-text"),
                ENABLE_CONTENT_WARNINGS && dom("c-warning")
            ]
        });
    }
});
dom("switch").addEventListener("click", function () {
    page = page == "following" ? "recent" : "following";
    localStorage.setItem("home-page", page);
    dom("switch").innerHTML = page == "recent" ? lang.home.switch_following : lang.home.switch_recent;
    url = `/api/post/${page}`;
    refresh();
});
if (ENABLE_POLLS) {
    dom("toggle-poll").addEventListener("click", function () {
        if (dom("poll").hasAttribute("hidden")) {
            dom("poll").removeAttribute("hidden");
        }
        else {
            dom("poll").setAttribute("hidden", "");
        }
    });
    output = "";
    for (let i = 1; i <= MAX_POLL_OPTIONS; i++) {
        output += `<input data-create-post placeholder="${(i > 2 ? lang.home.poll_optional : lang.home.poll_option).replaceAll("%s", i)}" maxlength="${MAX_POLL_OPTION_LENGTH}"></br>`;
    }
    dom("poll").innerHTML = output;
}

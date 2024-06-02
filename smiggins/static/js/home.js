let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") {
    page = "recent";
}
url = `/api/post/${page}`;
type = "post";
includeUserLink = true;
includePostLink = true;
dom("switch").innerText = page == "recent" ? lang.home.switch_following : lang.home.switch_recent;
dom("post-text").addEventListener("input", postTextInputEvent);
dom("post").addEventListener("click", function () {
    if (dom("post-text").value) {
        this.setAttribute("disabled", "");
        dom("post-text").setAttribute("disabled", "");
        fetch("/api/post/create", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "content": dom("post-text").value
            })
        })
            .then((response) => {
            dom("post").removeAttribute("disabled");
            dom("post-text").removeAttribute("disabled");
            if (response.status == 429) {
                showlog(lang.generic.ratelimit_verbose);
            }
            else {
                response.json().then((json) => {
                    if (json.success) {
                        dom("post-text").value = "";
                        refresh();
                    }
                    else {
                        showlog(lang.generic.something_went_wrong);
                    }
                });
            }
        })
            .catch((err) => {
            dom("post").removeAttribute("disabled");
            dom("post-text").removeAttribute("disabled");
            showlog(lang.generic.something_went_wrong);
            throw (err);
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

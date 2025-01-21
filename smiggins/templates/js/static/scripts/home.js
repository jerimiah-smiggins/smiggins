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
function homeInit() {
    let page = localStorage.getItem("home-page");
    if (page !== "following" && page !== "recent") {
        page = "recent";
    }
    type = "post";
    includeUserLink = true;
    includePostLink = true;
    timelineConfig.timelines = {
        recent: "/api/post/recent",
        following: "/api/post/following"
    };
    timelineConfig.url = timelineConfig.timelines[page];
    dom("switch").querySelector(`[data-timeline="${page}"]`).removeAttribute("href");
    dom("post").addEventListener("click", function () {
        if (hasContent(dom("post-text").value) || getPollText().length) {
            s_fetch("/api/post/create", {
                method: "PUT",
                body: JSON.stringify({
                    c_warning: conf.content_warnings ? dom("c-warning").value : "",
                    content: dom("post-text").value,
                    poll: getPollText(),
                    private: dom("default-private").checked
                }),
                disable: [
                    this,
                    dom("post-text"),
                    conf.content_warnings && dom("c-warning")
                ]
            });
        }
    });
    if (conf.polls) {
        dom("toggle-poll").addEventListener("click", function () {
            if (dom("poll").hasAttribute("hidden")) {
                dom("poll").removeAttribute("hidden");
            }
            else {
                dom("poll").setAttribute("hidden", "");
            }
        });
        output = "";
        for (let i = 1; i <= conf.max_poll_options; i++) {
            output += `<input data-create-post placeholder="${(i > 2 ? lang.home.poll_optional : lang.home.poll_option).replaceAll("%s", i)}" maxlength="${conf.max_poll_option_length}"></br>`;
        }
        dom("poll").innerHTML = output;
    }
}

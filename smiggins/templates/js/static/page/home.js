function getPollText() {
    if (dom("poll").hasAttribute("hidden")) {
        return [];
    }
    let out = [];
    for (const el of document.querySelectorAll("#poll input")) {
        if (el.value) {
            out.push(el.value);
        }
    }
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
        recent: { url: "/api/post/recent", forwards: true, pages: false },
        following: { url: "/api/post/following", forwards: true, pages: false }
    };
    timelineConfig.url = timelineConfig.timelines[page].url;
    timelineConfig.enableForwards = timelineConfig.timelines[page].forwards;
    timelineConfig.usePages = timelineConfig.timelines[page].pages;
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
    }
}

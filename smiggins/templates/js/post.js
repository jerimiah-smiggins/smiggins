type = "comment";
includeUserLink = true;
includePostLink = true;
timelineConfig.useOffsetC = true;
timelineConfig.timelines = {
    random: `/api/comments?id=${post_id}&comment=${comment}&sort=random`,
    newest: `/api/comments?id=${post_id}&comment=${comment}&sort=newest`,
    oldest: `/api/comments?id=${post_id}&comment=${comment}&sort=oldest`,
    liked: `/api/comments?id=${post_id}&comment=${comment}&sort=liked`,
};
timelineConfig.url = timelineConfig.timelines.newest;
dom("post") && dom("post").addEventListener("click", function () {
    if (hasContent(dom("post-text").value)) {
        s_fetch("/api/comment/create", {
            method: "PUT",
            body: JSON.stringify({
                c_warning: conf.content_warnings ? dom("c-warning").value : "",
                comment: comment,
                content: dom("post-text").value,
                id: post_id,
                private: dom("default-private").checked
            }),
            disable: [
                dom("post"),
                dom("post-text"),
                conf.content_warnings && dom("c-warning")
            ]
        });
    }
});

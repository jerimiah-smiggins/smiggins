type = "comment";
includeUserLink = true;
includePostLink = true;
useOffsetC = true;
timelines = {
    random: `/api/comments?id=${post_id}&comment=${comment}&sort=random`,
    newest: `/api/comments?id=${post_id}&comment=${comment}&sort=newest`,
    oldest: `/api/comments?id=${post_id}&comment=${comment}&sort=oldest`,
    liked: `/api/comments?id=${post_id}&comment=${comment}&sort=liked`,
};
url = timelines.newest;
dom("post-text") && dom("post-text").addEventListener("input", postTextInputEvent);
dom("post") && dom("post").addEventListener("click", function () {
    if (dom("post-text").value) {
        s_fetch("/api/comment/create", {
            method: "PUT",
            body: JSON.stringify({
                c_warning: ENABLE_CONTENT_WARNINGS ? dom("c-warning").value : "",
                comment: comment,
                content: dom("post-text").value,
                id: post_id,
                private: dom("default-private").checked
            }),
            disable: [
                dom("post"),
                dom("post-text"),
                ENABLE_CONTENT_WARNINGS && dom("c-warning")
            ]
        });
    }
});

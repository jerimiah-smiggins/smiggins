url = `/api/comments?id=${post_id}&comment=${comment}`;
type = "comment";
includeUserLink = true;
includePostLink = true;
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

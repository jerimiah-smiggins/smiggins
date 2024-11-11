declare const post_id: number;
declare const comment: boolean;

url = `/api/comments?id=${post_id}&comment=${comment}`;
type = "comment";
includeUserLink = true;
includePostLink = true;

dom("post-text") && dom("post-text").addEventListener("input", postTextInputEvent);

dom("post") && dom("post").addEventListener("click", function() {
  if ((dom("post-text") as HTMLButtonElement).value) {
    s_fetch("/api/comment/create", {
      method: "PUT",
      body: JSON.stringify({
        c_warning: ENABLE_CONTENT_WARNINGS ? (dom("c-warning") as HTMLInputElement).value : "",
        comment: comment,
        content: (dom("post-text") as HTMLInputElement).value,
        id: post_id,
        private: (dom("default-private") as HTMLInputElement).checked
      }),
      disable: [
        dom("post"),
        dom("post-text"),
        ENABLE_CONTENT_WARNINGS && dom("c-warning")
      ]
    });
  }
});

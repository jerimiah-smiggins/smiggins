declare const post_id: number;
declare const comment: boolean;

type = "comment";
includeUserLink = true;
includePostLink = true;
timelineConfig.useOffsetC = true;
timelineConfig.timelines = {
  random: `/api/comments?id=${post_id}&comment=${comment}&sort=random`,
  newest: `/api/comments?id=${post_id}&comment=${comment}&sort=newest`,
  oldest: `/api/comments?id=${post_id}&comment=${comment}&sort=oldest`,
  liked: `/api/comments?id=${post_id}&comment=${comment}&sort=liked`,
}

timelineConfig.url = timelineConfig.timelines.newest;

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

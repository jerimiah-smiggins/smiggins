function postInit(): void {
  share = window.location.href;
  type = "comment";
  includeUserLink = true;
  includePostLink = true;
  timelineConfig.useOffsetC = true;
  timelineConfig.timelines = {
    random: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=random`,
    newest: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=newest`,
    oldest: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=oldest`,
    liked: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=liked`,
  }

  timelineConfig.url = timelineConfig.timelines.newest;

  dom("post") && dom("post").addEventListener("click", function() {
    if (hasContent((dom("post-text") as HTMLButtonElement).value)) {
      s_fetch("/api/comment/create", {
        method: "PUT",
        body: JSON.stringify({
          c_warning: conf.content_warnings ? (dom("c-warning") as HTMLInputElement).value : "",
          comment: context.comment,
          content: (dom("post-text") as HTMLInputElement).value,
          id: context.post.post_id,
          private: (dom("default-private") as HTMLInputElement).checked
        }),
        disable: [
          dom("post"),
          dom("post-text"),
          conf.content_warnings && dom("c-warning")
        ]
      });
    }
  });
}

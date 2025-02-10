function postInit(): void {
  share = window.location.href;
  type = "comment";
  includeUserLink = true;
  includePostLink = true;
  timelineConfig.timelines = {
    random: { url: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=random`, forwards: false, pages: false },
    newest: { url: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=newest`, forwards: true, pages: false },
    oldest: { url: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=oldest`, forwards: false, pages: false },
    liked: { url: `/api/comments?id=${context.post.post_id}&comment=${context.comment}&sort=liked`, forwards: false, pages: true },
  }

  timelineConfig.url = timelineConfig.timelines.newest.url;
  timelineConfig.enableForwards = timelineConfig.timelines.newest.forwards;
  timelineConfig.usePages = timelineConfig.timelines.newest.pages;

  dom("post") && dom("post").addEventListener("click", function(): void {
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

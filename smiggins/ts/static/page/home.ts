function getPollText(): string[] {
  if (dom("poll").hasAttribute("hidden")) {
    return [];
  }

  let out: string[] = [];

  for (const el of document.querySelectorAll("#poll input")) {
    if ((el as HTMLInputElement).value) {
      out.push((el as HTMLInputElement).value);
    }
  }

  return out;
}

function homeInit(): void {
  let page: string = localStorage.getItem("home-page");
  if (page !== "following" && page !== "recent") { page = "recent"; }

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

  (dom("switch").querySelector(`[data-timeline="${page}"]`) as HTMLAnchorElement).removeAttribute("href");

  dom("post").addEventListener("click", function(): void {
    if (hasContent((dom("post-text") as HTMLInputElement).value) || getPollText().length) {
      s_fetch("/api/post/create", {
        method: "PUT",
        body: JSON.stringify({
          c_warning: conf.content_warnings ? (dom("c-warning") as HTMLInputElement).value : "",
          content: (dom("post-text") as HTMLInputElement).value,
          poll: getPollText(),
          private: (dom("default-private") as HTMLInputElement).checked
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
    dom("toggle-poll").addEventListener("click", function(): void {
      if (dom("poll").hasAttribute("hidden")) {
        dom("poll").removeAttribute("hidden");
      } else {
        dom("poll").setAttribute("hidden", "");
      }
    });
  }
}

function p_home(element: HTMLDivElement): void {
  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as HTMLDivElement, {
    following: { url: "/api/timeline/following", prependPosts: true },
    global: { url: "/api/timeline/global", prependPosts: true }
  }, "global");
}

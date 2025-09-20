function getPostIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function postSetDNE(): void {
  // TODO: something when post doesn't exist
}

function updateFocusedPost(post: post): void {
  let pid: number = insertIntoPostCache([post])[0];
  document.getElementById("focused-post")?.replaceChildren(getPost(pid, false));

  if (post.comment) {
    document.getElementById("comment-parent")?.removeAttribute("hidden");
    document.getElementById("comment-parent")?.setAttribute("href", `/p/${post.comment}/`);
    document.getElementById("home-link")?.setAttribute("hidden", "");
  } else {
    document.getElementById("comment-parent")?.setAttribute("hidden", "");
    document.getElementById("home-link")?.removeAttribute("hidden");
  }
}

function p_postPage(element: HTMLDivElement): void {
  let pid: number = getPostIDFromPath();
  let p: post | undefined = postCache[pid];
  let postElement: HTMLElement | null = element.querySelector("#focused-post");
  let timelineElement: HTMLDivElement | null = element.querySelector("#timeline-posts");

  if (!timelineElement || !postElement) { return; }

  if (p) {
    postElement.replaceChildren(getPost(pid, false));
  }

  hookTimeline(timelineElement, {
    [`post_${pid}_recent`]: { url: `/api/timeline/post/${pid}?sort=recent`, prependPosts: pid },
    [`post_${pid}_oldest`]: { url: `/api/timeline/post/${pid}?sort=oldest`, prependPosts: false, disablePolling: true },
    // [`post_${pid}_random`]: { url: `/api/timeline/post/${pid}?sort=random`, prependPosts: pid, disablePolling: true, disableCaching: true }
  }, `post_${pid}_recent`, element);
}

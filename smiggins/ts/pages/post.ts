function getPostIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function updateFocusedPost(json: api_timeline) {
  if (!json.success) {
    if (json.reason === "POST_NOT_FOUND") {
      // TODO: something about post not found
    }
    return;
  }

  let p: post | undefined = json.extraData && json.extraData.focused_post;
  if (!p) { return; }

  let pid: number = insertIntoPostCache([p])[0];
  document.getElementById("focused-post")?.replaceChildren(getPost(pid, false));

  if (p.comment) {
    document.getElementById("comment-parent")?.removeAttribute("hidden");
    document.getElementById("comment-parent")?.setAttribute("href", `/p/${p.comment}/`);
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
    [`post_${pid}_recent`]: { url: `/api/timeline/post/${pid}?sort=recent`, prependPosts: pid, timelineCallback: updateFocusedPost },
    [`post_${pid}_oldest`]: { url: `/api/timeline/post/${pid}?sort=oldest`, prependPosts: false, timelineCallback: updateFocusedPost, disablePolling: true },
    [`post_${pid}_random`]: { url: `/api/timeline/post/${pid}?sort=random`, prependPosts: pid, timelineCallback: updateFocusedPost, disablePolling: true, disableCaching: true }
  }, `post_${pid}_recent`, element);
}

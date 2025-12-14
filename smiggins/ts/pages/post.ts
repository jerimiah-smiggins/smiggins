let commentBoxValueSet: boolean = false;

function getPostIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function postSetDNE(): void {
  let notFound: HTMLElement = document.createElement("div");
  notFound.innerText = "This post doesn't exist.";
  notFound.classList.add("generic-margin-top");
  document.getElementById("focused-post")?.replaceChildren(notFound);
  document.getElementById("comment-parent")?.setAttribute("hidden", "");
  document.getElementById("home-link")?.removeAttribute("hidden");

  for (const el of document.querySelectorAll("#focused-post + hr ~ *")) {
    el.setAttribute("hidden", "");
  }
}

function updateFocusedPost(post: Post): void {
  let pid: number = insertIntoPostCache([post])[0];
  let cwElement: HTMLDetailsElement | null = document.querySelector("#focused-post .content-warning");

  document.getElementById("focused-post")?.replaceChildren(
    getPost(pid, false, cwElement ? cwElement.open : null)
  );

  if (post.comment) {
    document.getElementById("comment-parent")?.removeAttribute("hidden");
    document.getElementById("comment-parent")?.setAttribute("href", `/p/${post.comment}/`);
    document.getElementById("home-link")?.setAttribute("hidden", "");
  } else {
    document.getElementById("comment-parent")?.setAttribute("hidden", "");
    document.getElementById("home-link")?.removeAttribute("hidden");
  }

  let commentElement: HTMLTextAreaElement | null = document.getElementById("post-content") as HTMLTextAreaElement | null;
  let cwInputElement: Iel = document.getElementById("post-cw") as Iel;

  if (!commentBoxValueSet && commentElement && !commentElement.value && cwInputElement && !cwInputElement.value) {
    commentBoxValueSet = true;
    commentElement.value = getPostMentionsString(post);
    cwInputElement.value = getPostTemplatedCW(post);

    if (post.private || defaultPostPrivate) {
      document.querySelector("#post-private:not([data-private-set])")?.setAttribute("checked", "");
    }
    document.querySelector("#post-private:not([data-private-set])")?.setAttribute("data-private-set", "");
  }
}

function getPostMentionsString(p: Post): string {
  return getMentionsFromPost(p).map((a: string): string => (`@${a} `)).join("")
}

function getPostTemplatedCW(p: Post): string {
  let cw: string | null = p.content_warning;

  if (cw) {
    let style: string | null = localStorage.getItem("smiggins-cw-cascading");

    switch (style) {
      case "email":
      case null:
        if (!cw.toLowerCase().startsWith("re:")) {
          return "RE: " + cw.slice(0, limits.content_warning - 4);
        }

      case "copy":
        return cw;
    }
  }

  return "";
}

function createComment(e: Event): void {
  let cwElement: el = document.getElementById("post-cw");
  let contentElement: el = document.getElementById("post-content");
  let privatePostElement: el = document.getElementById("post-private");

  if (!cwElement || !contentElement || !privatePostElement) { return; }

  let cw: string = (cwElement as I).value;
  let content: string = (contentElement as I).value;
  let privatePost: boolean = (privatePostElement as I).checked;

  if (!content) { contentElement.focus(); return; }

  (e.target as Bel)?.setAttribute("disabled", "");
  createPost(content, cw || null, privatePost, (success: boolean): void => {
    (e.target as Bel)?.removeAttribute("disabled");
    contentElement.focus();

    if (success) {
      (cwElement as I).value = "";

      let p: Post | undefined = postCache[getPostIDFromPath()];

      if (p) {
        (contentElement as I).value = getMentionsFromPost(p).map((a: string): string => (`@${a} `)).join("");
      } else {
        (contentElement as I).value = "";
      }
    }
  }, { comment: getPostIDFromPath() });
}

function p_postPage(element: D): void {
  let pid: number = getPostIDFromPath();
  let p: Post | undefined = postCache[pid];
  let postElement: el = element.querySelector("#focused-post");
  let timelineElement: Del = element.querySelector("#timeline-posts");
  commentBoxValueSet = false;

  if (!timelineElement || !postElement) { return; }

  if (p) {
    let commentElement: HTMLTextAreaElement | null = element.querySelector("#post-content");
    let cwElement: HTMLTextAreaElement | null = element.querySelector("#post-cw");
    if (commentElement) { commentElement.value = getPostMentionsString(p); }
    if (cwElement) { cwElement.value = getPostTemplatedCW(p); }

    postElement.replaceChildren(getPost(pid, false));
  } else {
    postElement.replaceChildren(getSnippet("post-placeholder"));
  }

  hookTimeline(timelineElement, element.querySelector("#timeline-carousel") as Del, {
    [`post_${pid}_recent`]: { api: api_TimelineComments, args: [pid, "recent"], prependPosts: pid },
    [`post_${pid}_oldest`]: { api: api_TimelineComments, args: [pid, "oldest"], prependPosts: false, disablePolling: true, invertOffset: true },
    // [`post_${pid}_random`]: { url: `/api/timeline/post/${pid}?sort=random`, prependPosts: pid, disablePolling: true, disableCaching: true }
  }, `post_${pid}_recent`, element);

  element.querySelector("#post")?.addEventListener("click", createComment);
}

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

function updateFocusedPost(post: post): void {
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

  let p: post | undefined = postCache[pid];
  if (!commentBoxValueSet && commentElement && !commentElement.value && p) {
    commentBoxValueSet = true;
    commentElement.value = getMentionsFromPost(p).map((a) => (`@${a} `)).join("");
  }
}

function createComment(e: Event): void {
  let cwElement: HTMLElement | null = document.getElementById("post-cw");
  let contentElement: HTMLElement | null = document.getElementById("post-content");
  let privatePostElement: HTMLElement | null = document.getElementById("post-private");

  if (!cwElement || !contentElement || !privatePostElement) { return; }

  let cw: string = (cwElement as HTMLInputElement).value;
  let content: string = (contentElement as HTMLInputElement).value;
  let privatePost: boolean = (privatePostElement as HTMLInputElement).checked;

  if (!content) { contentElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");
  createPost(content, cw || null, privatePost, (success: boolean): void => {
    (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");

    contentElement.focus();

    if (success) {
      (cwElement as HTMLInputElement).value = "";

      let p: post | undefined = postCache[getPostIDFromPath()];

      if (p) {
        (contentElement as HTMLInputElement).value = getMentionsFromPost(p).map((a) => (`@${a} `)).join("");
      } else {
        (contentElement as HTMLInputElement).value = "";
      }
    }
  }, { comment: getPostIDFromPath() });
}

function p_postPage(element: HTMLDivElement): void {
  let pid: number = getPostIDFromPath();
  let p: post | undefined = postCache[pid];
  let postElement: HTMLElement | null = element.querySelector("#focused-post");
  let timelineElement: HTMLDivElement | null = element.querySelector("#timeline-posts");
  commentBoxValueSet = false;

  if (!timelineElement || !postElement) { return; }

  if (p) {
    let commentElement: HTMLTextAreaElement | null = element.querySelector("#post-content");
    if (commentElement) {
      commentElement.value = getMentionsFromPost(p).map((a: string): string => (`@${a} `)).join("");
    }

    postElement.replaceChildren(getPost(pid, false));
  } else {
    postElement.replaceChildren(getSnippet("post-placeholder"));
  }

  hookTimeline(timelineElement, {
    [`post_${pid}_recent`]: { url: `/api/timeline/post/${pid}?sort=recent`, prependPosts: pid },
    [`post_${pid}_oldest`]: { url: `/api/timeline/post/${pid}?sort=oldest`, prependPosts: false, disablePolling: true },
    // [`post_${pid}_random`]: { url: `/api/timeline/post/${pid}?sort=random`, prependPosts: pid, disablePolling: true, disableCaching: true }
  }, `post_${pid}_recent`, element);

  element.querySelector("#post")?.addEventListener("click", createComment);
}

function p_home(element: D): void {
  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as D, element.querySelector("#timeline-carousel") as Del, {
    following: { url: "/api/timeline/following", prependPosts: true },
    global: { url: "/api/timeline/global", prependPosts: true },
    following__comments: { url: "/api/timeline/following?comments=true", prependPosts: true },
    global__comments: { url: "/api/timeline/global?comments=true", prependPosts: true }
  }, "global", element);

  element.querySelector("#post")?.addEventListener("click", homeCreatePost);
}

function homeCreatePost(e: Event): void {
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
      (contentElement as I).value = "";
    }
  });
}

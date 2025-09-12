function p_home(element: HTMLDivElement): void {
  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as HTMLDivElement, {
    following: { url: "/api/timeline/following", prependPosts: true },
    global: { url: "/api/timeline/global", prependPosts: true }
  }, "global", element);

  element.querySelector("#post")?.addEventListener("click", homeCreatePost)
}

function homeCreatePost(e: Event): void {
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
      (contentElement as HTMLInputElement).value = "";
    }
  });
}

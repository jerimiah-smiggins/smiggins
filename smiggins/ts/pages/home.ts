function p_home(element: HTMLDivElement): void {
  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as HTMLDivElement, {
    following: { url: "/api/timeline/following", prependPosts: true },
    global: { url: "/api/timeline/global", prependPosts: true }
  }, "global");

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

function createPost(content: string, cw: string | null, followersOnly: boolean, callback?: (success: boolean) => void): void {
  fetch("/api/post", {
    method: "POST",
    body: JSON.stringify({
      content: content,
      cw: cw,
      private: followersOnly,
      poll: [] // TODO: posting polls
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_post> => (response.json()))
    .then((json: api_post): void => {
      if (json.success) {
        if (currentTl.prependPosts) {
          tlElement.prepend(getPost(json.post));
        }
      } else {
        createToast(...errorCodeStrings(json.reason, "post"));
      }

      callback && callback(json.success);
    })
    .catch((err: any): void => {
      callback && callback(false);
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

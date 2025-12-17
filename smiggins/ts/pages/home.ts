function p_home(element: D): void {
  hookTimeline(element.querySelector("[id=\"timeline-posts\"]") as D, element.querySelector("#timeline-carousel") as Del, {
    following: { api: api_TimelineFollowing, prependPosts: true },
    global: { api: api_TimelineGlobal, prependPosts: true },
    following__comments: { api: api_TimelineFollowing, args: [true], prependPosts: true },
    global__comments: { api: api_TimelineGlobal, args: [true], prependPosts: true }
  }, "global", element);

  element.querySelector("#post")?.addEventListener("click", homeCreatePost);
  element.querySelector("#poll-toggle")?.addEventListener("click", function(): void {
    let pollElement: Del = (element.querySelector("#poll-area") as Del);

    if (pollElement) {
      pollElement.hidden = !pollElement.hidden;
    }
  });
}

function getPollInputsHTML(id: string, submit: string): string {
  let output: string = "";

  for (let i: number = 0; i < limits.poll_count; i++) {
    output += `<div><input data-poll-input="${id}" data-poll-num="${i}" ${i + 1 < limits.poll_count ? `data-enter-next="[data-poll-input='${id}'][data-poll-num='${i + 1}']"` : ""} data-enter-submit="${submit}" placeholder="${lr(L.post[i >= 2 ? "poll_placeholder_optional" : "poll_placeholder"], { n: String(i + 1) })}" maxlength="${limits.poll_item}"></div>`;
  }

  return output;
}

function homeCreatePost(e: Event): void {
  let cwElement: el = document.getElementById("post-cw");
  let contentElement: el = document.getElementById("post-content");
  let privatePostElement: el = document.getElementById("post-private");

  if (!cwElement || !contentElement || !privatePostElement) { return; }

  let cw: string = (cwElement as I).value;
  let content: string = (contentElement as I).value;
  let privatePost: boolean = (privatePostElement as I).checked;

  let poll: string[] = [];

  if (!postModalFor || postModalFor.type !== "edit") {
    for (const el of document.querySelectorAll(":not([hidden]) > div > [data-poll-input=\"home\"]") as NodeListOf<I>) {
      if (el.value) {
        poll.push(el.value);
      }
    }
  }

  if (!content && poll.length === 0) { contentElement.focus(); return; }

  (e.target as Bel)?.setAttribute("disabled", "");
  createPost(content, cw || null, privatePost, (success: boolean): void => {
    (e.target as Bel)?.removeAttribute("disabled");

    contentElement.focus();

    if (success) {
      (cwElement as I).value = "";
      (contentElement as I).value = "";

      document.getElementById("poll-area")?.setAttribute("hidden", "");

      for (const el of document.querySelectorAll("[data-poll-input]") as NodeListOf<I>) {
        el.value = "";
      }
    }
  }, {
    poll: poll.length ? poll : undefined
  });
}

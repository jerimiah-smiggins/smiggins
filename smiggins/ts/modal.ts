let postModalFor: {
  type: "quote" | "comment",
  id: number
} | undefined = undefined;

function createPostModal(): void;
function createPostModal(type: "quote" | "comment", id: number): void;
function createPostModal(type?: "quote" | "comment", id?: number): void {
  if (document.getElementById("compose-modal")) { return; }

  let extraVars: { [key: string]: string | [string, number] } = {
    "hidden_if_no_quote": "hidden",
    "private_post": ""
  };

  postModalFor = undefined;

  if (type && id !== undefined) {
    postModalFor = {
      type: type,
      id: id
    };

    if (type === "quote") {
      let post: post | undefined = postCache[id];
      if (!post) { return; }

      extraVars = {
        "hidden_if_no_quote": "",
        "private_post": post.private ? "data-private-post" : "",
        "username": post.user.username,
        "timestamp": getTimestamp(post.timestamp),
        "content": [escapeHTML(post.content), 1],
        "display_name": [escapeHTML(post.user.display_name), 1]
      };
    }

    // TODO: add replies to this
  }

  let el: HTMLDivElement = getSnippet("compose-modal", extraVars);
  el.querySelector("#modal-post")?.addEventListener("click", postModalCreatePost);
  el.querySelector("#compose-modal")?.addEventListener("click", clearPostModalIfClicked);
  document.body.append(el);
  (el.querySelector("#modal-post-content") as HTMLElement | null)?.focus();

  document.addEventListener("keydown", clearPostModalOnEscape);
}

function postModalCreatePost(e: Event): void {
  let cwElement: HTMLElement | null = document.getElementById("modal-post-cw");
  let contentElement: HTMLElement | null = document.getElementById("modal-post-content");
  let privatePostElement: HTMLElement | null = document.getElementById("modal-post-private");

  if (!cwElement || !contentElement || !privatePostElement) { return; }

  let cw: string = (cwElement as HTMLInputElement).value;
  let content: string = (contentElement as HTMLInputElement).value;
  let privatePost: boolean = (privatePostElement as HTMLInputElement).checked;

  if (!content) { contentElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");
  createPost(
    content,
    cw || null,
    privatePost,
    (success: boolean): void => {
      if (success) {
        if (postModalFor && postModalFor.type === "quote") {
          let el: HTMLElement | null = document.querySelector(`[data-interaction-quote="${postModalFor.id}"] [data-number]`);

          if (el) {
            el.innerText = String(+el.innerText + 1);
          }
        }

        clearPostModal();
      } else {
        contentElement.focus();
        (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      }
    },
    postModalFor && { quote: postModalFor.id }
  );
}

function clearPostModalOnEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    clearPostModal();
    document.removeEventListener("keydown", clearPostModalOnEscape);
    e.preventDefault();
  }
}

function clearPostModalIfClicked(e: Event): void {
  if ((e.target as HTMLElement | null)?.dataset.closeModal !== undefined) {
    clearPostModal();
  }
}

function clearPostModal(): void {
  document.getElementById("compose-modal")?.remove();
}

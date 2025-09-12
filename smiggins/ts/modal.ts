function createPostModal(): void;
function createPostModal(type: "quote" | "comment", replyTo: { id: number, comment?: true }): void;
function createPostModal(type?: "quote" | "comment", replyTo?: { id: number, comment?: true }): void {
  if (document.getElementById("compose-modal")) { return; }

  let el: HTMLDivElement = getSnippet("compose-modal");
  el.querySelector("#modal-post")?.addEventListener("click", postModalCreatePost);
  el.querySelector("#compose-modal")?.addEventListener("click", clearPostModalIfClicked);
  document.body.append(el);
  (el.querySelector("#modal-post-content") as HTMLElement | null)?.focus();

  document.addEventListener("keydown", clearPostModalOnEscape);

  if (type && replyTo) {
    // TODO: add quotes replies to this
  }
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
  createPost(content, cw || null, privatePost, (success: boolean): void => {
    if (success) {
      clearPostModal();
    } else {
      contentElement.focus();
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
    }
  });
}

function clearPostModalOnEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    clearPostModal();
    document.removeEventListener("keydown", clearPostModalOnEscape);
    e.preventDefault();
  }
}

function clearPostModalIfClicked(e: Event): void {
  if ((e.target as HTMLElement | null)?.dataset.closeModal) {
    clearPostModal();
  }
}

function clearPostModal(): void {
  document.getElementById("compose-modal")?.remove();
}

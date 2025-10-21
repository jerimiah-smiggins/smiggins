let postModalFor: {
  type: "quote" | "comment" | "edit",
  id: number
} | undefined = undefined;

function createPostModal(): void;
function createPostModal(type: "quote" | "comment" | "edit", id: number): void;
function createPostModal(type?: "quote" | "comment" | "edit", id?: number): void {
  if (document.getElementById("modal")) { return; }

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
    } else if (type === "comment") {
      // TODO: comment modal
    } else if (type === "edit") {
      // TODO: edit modal
    }
  }

  let el: HTMLDivElement = getSnippet("compose-modal", extraVars);
  el.querySelector("#modal-post")?.addEventListener("click", postModalCreatePost);
  el.querySelector("#modal")?.addEventListener("click", clearModalIfClicked);
  document.body.append(el);
  (el.querySelector("#modal-post-content") as HTMLElement | null)?.focus();

  document.addEventListener("keydown", clearModalOnEscape);
}

function modifyKeybindModal(kbId: string): void {
  let kbData = keybinds[kbId];
  let el: HTMLDivElement = getSnippet("keybind-modal", {
    keybind_title: kbData.name,
    keybind_description: kbData.description || "",
    hidden_if_no_description: kbData.description ? "" : "hidden"
  });

  forceDisableKeybinds = true;

  // @ts-ignore
  el.querySelector("#kb-modal-input")?.addEventListener("keydown", (e: KeyboardEvent): void => {
    if (["shift", "alt", "control", "meta", " "].includes(e.key.toLowerCase())) {
      // Ignore modifier keys
    } else if (setKeybindKey(kbId, e.key, {
      alt: e.altKey,
      ctrl: e.ctrlKey,
      nav: kbData.modifiers && kbData.modifiers.includes("nav"),
      shift: e.shiftKey
    })) {
      if (kbId === "navModifier") {
        for (const el of document.querySelectorAll("[data-kb-id^=\"nav\"]") as NodeListOf<HTMLDivElement>) {
          setKeybindElementData(el.dataset.kbId || kbId, el);
        }
      }

      let kbEl: HTMLDivElement | null = document.querySelector(`[data-kb-id="${kbId}"]`) as HTMLDivElement | null;
      if (kbEl) { setKeybindElementData(kbId, kbEl); }

      clearModal();
    } else {
      createToast("Key already in use");
    }

    e.preventDefault();
  });

  document.body.append(el);
  (el.querySelector("#kb-modal-input") as HTMLInputElement | null)?.focus();
  el.querySelector("#modal")?.addEventListener("click", clearModalIfClicked);

  document.addEventListener("keydown", clearModalOnEscape);
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

        clearModal();
      } else {
        contentElement.focus();
        (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      }
    },
    postModalFor && { quote: postModalFor.id }
  );
}

function clearModalOnEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    clearModal();
    document.removeEventListener("keydown", clearModalOnEscape);
    e.preventDefault();
  }
}

function clearModalIfClicked(e: Event): void {
  if ((e.target as HTMLElement | null)?.dataset.closeModal !== undefined) {
    clearModal();
  }
}

function clearModal(): void {
  document.getElementById("modal")?.remove();
  forceDisableKeybinds = false;
}

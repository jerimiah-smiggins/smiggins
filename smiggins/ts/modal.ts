let postModalFor: {
  type: "quote" | "comment" | "edit",
  id: number
} | undefined = undefined;

function createPostModal(): void;
function createPostModal(type: "quote" | "comment" | "edit", id: number): void;
function createPostModal(type?: "quote" | "comment" | "edit", id?: number): void {
  if (document.getElementById("modal")) { return; }

  let extraVars: { [key: string]: string | [string, number] } = {
    hidden_if_no_quote: "hidden",
    hidden_if_no_comment: "hidden",
    hidden_if_no_poll: "",
    poll_items: getPollInputsHTML("modal", "#modal-post"),
    private_post: "",
    placeholder: "Cool post",
    action: "Post"
  };

  postModalFor = undefined;

  if (type && id !== undefined) {
    let post: post | undefined = postCache[id];
    if (!post) { console.log("post modal post not found", id); return; }

    postModalFor = {
      type: type,
      id: id
    };

    extraVars = {
      placeholder: "Cool post",
      action: "Post",

      hidden_if_no_quote: "hidden",
      hidden_if_no_comment: "hidden",
      hidden_if_no_poll: "",

      poll_items: getPollInputsHTML("modal", "#modal-post"),

      private_post: post.private ? "data-private-post" : "",
      username: post.user.username,
      timestamp: getTimestamp(post.timestamp),

      content: [simplePostContent(post), 1],
      display_name: [escapeHTML(post.user.display_name), 1],
      // duplicated to prevent possible issues with unescaped strings in the content
      content_2: [simplePostContent(post), 1],
      display_name_2: [escapeHTML(post.user.display_name), 1]
    };

    if (type === "quote") {
      extraVars.hidden_if_no_quote = "";
      extraVars.action = "Quote";
      extraVars.placeholder = [
        "Cool quote",
        "What did they say this time?",
        "Yet another mistake to point out?",
        "Ugh... not again..."
      ][Math.floor(Math.random() * 4)];
    } else if (type === "comment") {
      extraVars.hidden_if_no_comment = "";
      extraVars.action = "Reply";
      extraVars.placeholder = [
        "Cool comment",
        "Got something to say about this?",
        "Let them know how you feel",
        "Go spread your opinions, little one"
      ][Math.floor(Math.random() * 4)];
    } else if (type === "edit") {
      extraVars.placeholder = "Cool post but edited";
      extraVars.action = "Save";
      extraVars.hidden_if_no_poll = "hidden";
    }
  }

  let el: D = getSnippet("compose-modal", extraVars);
  el.querySelector("#modal-post")?.addEventListener("click", postModalCreatePost);
  el.querySelector("#modal")?.addEventListener("click", clearModalIfClicked);
  document.body.append(el);
  (el.querySelector("#modal-post-content") as el)?.focus();

  el.querySelector("#modal-poll-toggle")?.addEventListener("click", function(): void {
    let pollElement: Del = (el.querySelector("#modal-poll-area") as Del);

    if (pollElement) {
      pollElement.hidden = !pollElement.hidden;
    }
  });

  document.addEventListener("keydown", clearModalOnEscape);

  if (type === "edit" && id !== undefined) {
    let post: post | undefined = postCache[id];
    if (!post) { return; }

    if (post.content_warning) {
      let cwEl: Iel = el.querySelector("#modal-post-cw");
      if (cwEl) { cwEl.value = post.content_warning; }
    }

    let contentEl: Iel = el.querySelector("#modal-post-content");
    if (contentEl) { contentEl.value = post.content; }

    let privEl: Iel = el.querySelector("#modal-post-private");
    if (privEl) { privEl.checked = post.private; }
  } else if (type === "comment" && id !== undefined) {
    let post: post | undefined = postCache[id];
    if (!post) { return; }

    let contentEl: Iel = el.querySelector("#modal-post-content");
    if (contentEl) { contentEl.value = getPostMentionsString(post); }
  }
}

function modifyKeybindModal(kbId: string): void {
  let kbData = keybinds[kbId];
  let el: D = getSnippet("keybind-modal", {
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
        for (const el of document.querySelectorAll("[data-kb-id^=\"nav\"]") as NodeListOf<D>) {
          setKeybindElementData(el.dataset.kbId || kbId, el);
        }
      }

      let kbEl: Del = document.querySelector(`[data-kb-id="${kbId}"]`) as Del;
      if (kbEl) { setKeybindElementData(kbId, kbEl); }

      clearModal();
    } else {
      createToast("Key already in use");
    }

    e.preventDefault();
  });

  document.body.append(el);
  (el.querySelector("#kb-modal-input") as Iel)?.focus();
  el.querySelector("#modal")?.addEventListener("click", clearModalIfClicked);

  document.addEventListener("keydown", clearModalOnEscape);
}

function postModalCreatePost(e: Event): void {
  let cwElement: el = document.getElementById("modal-post-cw");
  let contentElement: el = document.getElementById("modal-post-content");
  let privatePostElement: el = document.getElementById("modal-post-private");

  if (!cwElement || !contentElement || !privatePostElement) { return; }

  let cw: string = (cwElement as I).value;
  let content: string = (contentElement as I).value;
  let privatePost: boolean = (privatePostElement as I).checked;

  let poll: string[] = [];

  if (!postModalFor || postModalFor.type !== "edit") {
    for (const el of document.querySelectorAll(":not([hidden]) > div > [data-poll-input=\"modal\"]") as NodeListOf<I>) {
      if (el.value) {
        poll.push(el.value);
      }
    }
  }

  if (!content && poll.length === 0) { contentElement.focus(); return; }

  (e.target as Bel)?.setAttribute("disabled", "");
  if (postModalFor && postModalFor.type === "edit") {
    fetch("/api/post", {
      method: "PATCH",
      body: buildRequest([
        [postModalFor.id, 32],
        privatePost,
        [content, 16],
        [cw, 8]
      ])
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then((ab: ArrayBuffer): ArrayBuffer => {
        let success: boolean = !((new Uint8Array(ab)[0] >> 7) & 1);
        if (success && postModalFor) {
          let p: post | undefined = postCache[postModalFor.id];
          clearModal();

          if (p) {
            p.content = content;
            p.content_warning = cw;
            p.private = privatePost
            p.edited = true;

            for (const el of document.querySelectorAll(`[data-edit-replace="${postModalFor.id}"]`)) {
              el.replaceWith(getPost(p.id, false));
            }
          }
        } else {
          contentElement.focus();
          (e.target as Bel)?.removeAttribute("disabled");
        }

        return ab;
      })
      .then(parseResponse)
      .catch((err: any): void => {
        contentElement.focus();
        (e.target as Bel)?.removeAttribute("disabled");

        throw err;
      });
  } else {
    let extra: {
      quote?: number,
      poll?: string[],
      comment?: number
    } = {};

    if (postModalFor) {
      extra[postModalFor.type as "quote" | "comment"] = postModalFor.id;
    }

    if (poll.length !== 0) {
      extra.poll = poll;
    }

    createPost(
      content,
      cw || null,
      privatePost,
      (success: boolean): void => {
        if (success) {
          if (postModalFor && postModalFor.type === "quote") {
            let els: NodeListOf<HTMLElement> = document.querySelectorAll(`[data-interaction-quote="${postModalFor.id}"] [data-number]`);
            for (const el of els) { if (!isNaN(+el.innerText)) { el.innerText = String(+el.innerText + 1); }}
          } else if (postModalFor && postModalFor.type === "comment") {
            let els: NodeListOf<HTMLElement> = document.querySelectorAll(`[data-interaction-comment="${postModalFor.id}"] [data-number]`);
            for (const el of els) { if (!isNaN(+el.innerText)) { el.innerText = String(+el.innerText + 1); }}
          }

          clearModal();
        } else {
          contentElement.focus();
          (e.target as Bel)?.removeAttribute("disabled");
        }
      },
      extra
    );
  }
}

function clearModalOnEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    clearModal();
    document.removeEventListener("keydown", clearModalOnEscape);
    e.preventDefault();
  }
}

function clearModalIfClicked(e: Event): void {
  if ((e.target as el)?.dataset.closeModal !== undefined) {
    clearModal();
  }
}

function clearModal(): void {
  document.getElementById("modal")?.remove();
  forceDisableKeybinds = false;
}

let postModalFor: {
  type: "quote" | "comment" | "edit",
  id: number
} | undefined = undefined;

function createPostModal(): void;
function createPostModal(type: "quote" | "comment" | "edit", id: number): void;
function createPostModal(type?: "quote" | "comment" | "edit", id?: number): void {
  if (document.getElementById("modal") || !loggedIn) { return; }

  let extraVars: { [key: string]: string | [string, number] } = {
    hidden_if_no_quote: "hidden",
    hidden_if_no_comment: "hidden",
    hidden_if_no_poll: "",
    poll_items: getPollInputsHTML("modal", "#modal-post"),
    private_post: "",
    placeholder: L.post.placeholder,
    action: L.post.button
  };

  postModalFor = undefined;

  if (type && id !== undefined) {
    let post: Post | undefined = postCache[id];
    if (!post) { console.log("post modal post not found", id); return; }

    postModalFor = {
      type: type,
      id: id
    };

    extraVars = {
      placeholder: L.post.placeholder,
      action: L.post.button,

      hidden_if_no_quote: "hidden",
      hidden_if_no_comment: "hidden",
      hidden_if_no_poll: "",

      poll_items: getPollInputsHTML("modal", "#modal-post"),

      private_post: post.private ? "data-private-post" : "",
      username: post.user.username,
      timestamp: getTimestamp(post.timestamp),
      checked_if_private: (defaultPostPrivate || ((type === "comment" || type === "quote") && post.private)) ? "checked" : "",

      content: [simplePostContent(post), 1],
      display_name: [escapeHTML(post.user.display_name), 1],
      // duplicated to prevent possible issues with unescaped strings in the content
      content_2: [simplePostContent(post), 1],
      display_name_2: [escapeHTML(post.user.display_name), 1]
    };

    if (type === "quote") {
      extraVars.hidden_if_no_quote = "";
      extraVars.action = L.post.quote_button;
      extraVars.placeholder = L.post.quote_placeholder[Math.floor(Math.random() * L.post.quote_placeholder.length)];
    } else if (type === "comment") {
      extraVars.hidden_if_no_comment = "";
      extraVars.action = L.post.comment_button;
      extraVars.placeholder = L.post.comment_placeholder[Math.floor(Math.random() * L.post.comment_placeholder.length)];
    } else if (type === "edit") {
      extraVars.action = L.post.edit_button;
      extraVars.placeholder = L.post.edit_placeholder;
      extraVars.hidden_if_no_poll = "hidden";
    }
  }

  let el: D = getSnippet("modal/compose", extraVars);
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
    let post: Post | undefined = postCache[id];
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
    let post: Post | undefined = postCache[id];
    if (!post) { return; }

    let contentEl: Iel = el.querySelector("#modal-post-content");
    if (contentEl) { contentEl.value = getPostMentionsString(post); }
  }

  if ((type === "comment" || type === "quote") && id !== undefined) {
    let post: Post | undefined = postCache[id];
    if (!post) { return; }

    let cwEl: Iel = el.querySelector("#modal-post-cw");
    if (cwEl) { cwEl.value = getPostTemplatedCW(post); }
  }
}

function createUpdateModal(since: string): void {
  if (document.getElementById("modal")) { return; }

  document.body.append(getSnippet("modal/update", {
    since: since
  }));

  document.getElementById("modal")?.addEventListener("click", clearModalIfClicked);
  document.addEventListener("keydown", clearModalOnEscape);
}

function createFollowingModal(type: "following" | "followers", username: string): void {
  if (document.getElementById("modal")) { return; }

  let displayName: string = userCache[username] && userCache[username].display_name || username;

  document.body.append(getSnippet("modal/following", {
    title: type === "following" ? `${displayName} follows:` : `${displayName} is followed by:`
  }));

  hookFollowingTimeline(type, username);

  document.getElementById("modal")?.addEventListener("click", clearModalIfClicked);
  document.addEventListener("keydown", clearModalOnEscape);
}

function modifyKeybindModal(kbId: string): void {
  let kbData = keybinds[kbId];
  let el: D = getSnippet("modal/keybind", {
    keybind_title: kbData.name || "",
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

function newMessageModal(): void {
  if (document.getElementById("modal")) { return; }

  document.body.append(getSnippet("modal/message"));

  document.getElementById("message-modal-add")?.addEventListener("click", (): void => {
    let count: number = document.querySelectorAll("#message-modal-inputs input").length;

    if (count >= 255) {
      return;
    }

    document.querySelector("#message-modal-inputs input:not([data-enter-next])")?.setAttribute("data-enter-next", `#message-modal-inputs :nth-child(${count + 1}) input`);
    document.getElementById("message-modal-inputs")?.insertAdjacentHTML("beforeend", `<div>@<input autofocus data-enter-submit="#message-modal-create" placeholder="${L.generic.username}"></div>`);
    (document.querySelector("#message-modal-inputs input:not([data-enter-next])") as el)?.addEventListener("keydown", inputEnterEvent);

    if (count >= 254) {
      document.getElementById("message-modal-add")?.setAttribute("hidden", "");
    }
  });

  document.getElementById("message-modal-create")?.addEventListener("click", (): void => {
    let usernames: string[] = [...document.querySelectorAll("#message-modal-inputs input") as NodeListOf<I>].map((a: I): string => (a.value.toLowerCase())).filter(Boolean);
    if (!usernames.length) { return; }

    new api_MessageGetGID(usernames, document.getElementById("message-modal-create") as Bel).fetch();
  });

  document.getElementById("modal")?.addEventListener("click", clearModalIfClicked);
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
    new api_EditPost(postModalFor.id, content, cw, privatePost, e.target as Bel)
      .fetch()
      .then((success: boolean | void): void => {
        if (success && postModalFor) {
          let p: Post | undefined = postCache[postModalFor.id];
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
        }
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

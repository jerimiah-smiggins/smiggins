let end: boolean = false;
offset = null;

function deletePost(postID: number, isComment: boolean, pageFocus: boolean): void {
  s_fetch(`/api/${isComment ? "comment" : "post"}`, {
    method: "DELETE",
    body: JSON.stringify({
      id: postID
    }),
    extraData: {
      pageFocus: pageFocus
    }
  })
}

function pinPost(postID: number): void {
  s_fetch(`/api/user/pin`, {
    method: "PATCH",
    body: JSON.stringify({
      id: postID
    })
  });
}

function unpinPost(): void {
  s_fetch(`/api/user/pin`, {
    method: "DELETE"
  });
}

function addQuote(postID: number, isComment: boolean): void {
  if (typeof logged_in !== "undefined" && !logged_in) { return; }

  const post: Element = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"] .post-after`);
  if (post.querySelector("button")) { return; }

  let c: number = 0;

  let originalPost: HTMLElement = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
  let originalCWEl: HTMLElement = originalPost.querySelector(".c-warning summary .c-warning-main");
  let originalCW: string | null = originalCWEl ? originalCWEl.innerHTML : null;

  post.innerHTML = `
    <div class="log"></div>
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${ lang.post.type_followers_only }:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    </div>
    ${ENABLE_CONTENT_WARNINGS ? `<label><input class="c-warning" ${originalCW ? `value="re: ${escapeHTML(originalCW.slice(0, MAX_CONTENT_WARNING_LENGTH - 4))}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"></label><br>` : ""}
    <label><textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea></label><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>
  `;

  let localGI: number = globalIncrement;

  globalIncrement++;

  post.querySelector("button.post-button").addEventListener("click", function(): void {
    if (!post.querySelector("textarea").value.length) { return; }

    s_fetch("/api/quote/create", {
      method: "PUT",
      body: JSON.stringify({
        c_warning: ENABLE_CONTENT_WARNINGS ? (post.querySelector("input.c-warning") as HTMLInputElement).value : "",
        content: post.querySelector("textarea").value,
        quote_id: postID,
        quote_is_comment: isComment,
        private: (dom(`default-private-${localGI}`) as HTMLInputElement).checked
      }),
      disable: [
        post.querySelector("textarea"),
        post.querySelector("button.post-button"),
        post.querySelector("button.cancel-button"),
        ENABLE_CONTENT_WARNINGS && post.querySelector("input.c-warning")
      ]
    });
  });

  post.querySelector("textarea").addEventListener("input", postTextInputEvent);

  post.querySelector("button.cancel-button").addEventListener("click", function(): void {
    post.innerHTML = "";
  });
}

function toggleLike(postID: number, type: string): void {
  if (typeof logged_in !== "undefined" && !logged_in) { return; }

  let likeButton: HTMLButtonElement = (document.querySelector(`div[data-${type}-id="${postID}"] button.like`) as HTMLButtonElement)

  s_fetch(`/api/${type}/like`, {
    method: likeButton.dataset["liked"] == "true" ? "DELETE" : "POST",
    body: JSON.stringify({
      id: postID
    }),
    disable: [likeButton]
  });
}

function vote(option: number, postID: number, gInc: number): void {
  s_fetch("/api/post/vote", {
    method: "POST",
    body: JSON.stringify({
      id: postID,
      option: option
    })
  });
}

function togglePollResults(gInc: number): void {
  document.querySelector(`#gi-${gInc} .remove-when-the-poll-gets-shown`).remove();

  forEach(dom(`gi-${gInc}`).querySelectorAll(".poll-bar-container"), function(val: Element, index: number): void {
    let el: HTMLElement = val as HTMLElement;

    el.innerHTML = `<div class="poll-bar">
      <div style="width: ${+el.dataset.votes / +el.dataset.totalVotes * 100 || 0}%"></div>
    </div>
    <div class="poll-text">
      ${Math.round(+el.dataset.votes / +el.dataset.totalVotes * 1000) / 10 || 0}% - ` + el.innerHTML.replace('<div class="poll-text">', "");

    el.onclick = null;
    el.onkeydown = null;
    el.removeAttribute("tabindex");
  });
}

function editPost(postID: number, isComment: boolean, private: boolean, originalText: string): void {
  let post: HTMLDivElement = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
  let contentField: HTMLDivElement = post.querySelectorAll(".main-area")[1] as HTMLDivElement;

  let oldContentField: string = contentField.innerHTML;

  let originalCW: string = contentField.querySelector("summary") ? (contentField.querySelector("summary > .c-warning-main") as HTMLElement).innerText : "";

  contentField.innerHTML = `
    <div class="log"></div>
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${private ? "checked" : ""}><br>
    </div>
    ${ENABLE_CONTENT_WARNINGS ? `<label><input class="c-warning" ${originalCW ? `value="${originalCW}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"></label><br>` : ""}
    <label><textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.post_input_placeholder}">${escapeHTML(originalText)}</textarea></label><br>
    <button class="post-button inverted">${lang.generic.post}</button>
    <button class="cancel-button inverted">${lang.generic.cancel}</button>`;

  contentField.querySelector("textarea").focus();
  globalIncrement++;

  contentField.querySelector(".cancel-button").addEventListener("click", function() {
    contentField.innerHTML = oldContentField;
  });

  contentField.querySelector(".post-button").addEventListener("click", function() {
    s_fetch(`/api/${isComment ? "comment" : "post"}/edit`, {
      method: "PATCH",
      body: JSON.stringify({
        c_warning: (contentField.querySelector(".c-warning") as HTMLInputElement).value,
        content: contentField.querySelector("textarea").value,
        private: (contentField.querySelector(".quote-visibility input") as HTMLInputElement).checked,
        id: postID
      }),
      disable: [this]
    });
  });
}

if (typeof disableTimeline === "undefined" || !disableTimeline) {
  function refresh(forceOffset=false): void {
    if (forceOffset !== true) {
      dom("posts").innerHTML = "";
    }

    s_fetch(
      `${url}${forceOffset === true && !end ? `${url.includes("?") ? "&" : "?"}offset=${offset}` : ""}`, {
        disable: [...document.querySelectorAll("button[onclick*='refresh(']")],
        extraData: {
          forceOffset: forceOffset
        }
      }
    );
  }

  refresh();
}

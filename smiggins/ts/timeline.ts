let end: boolean = false;

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

  const post: Element = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"] .quote-inputs`);
  if (post.querySelector("button")) { return; }

  let originalPost: HTMLElement = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
  let originalCWEl: HTMLElement = originalPost.querySelector(".c-warning summary .c-warning-main");
  let originalCW: string | null = originalCWEl ? originalCWEl.innerHTML : null;

  post.innerHTML = `
    <div class="quote-visibility">
      <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
      <input id="default-private-${globalIncrement}" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    </div>
    ${ENABLE_CONTENT_WARNINGS ? `<input class="c-warning" ${originalCW ? `value="${escapeHTML(originalCW.startsWith("re: ") ? originalCW.slice(0, MAX_CONTENT_WARNING_LENGTH) : "re: " + originalCW.slice(0, MAX_CONTENT_WARNING_LENGTH - 4))}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea class="post-text" data-create-post data-create-post-id="quote-post-${globalIncrement}" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.quote_placeholders[Math.floor(Math.random() * lang.home.quote_placeholders.length)]}"></textarea><br>
    <button id="quote-post-${globalIncrement}" class="post-button">${lang.generic.post}</button>
    <button class="cancel-button">${lang.generic.cancel}</button>
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

function vote(option: number, postID: number): void {
  s_fetch(`/api/post/poll`, {
    method: "POST",
    body: JSON.stringify({
      id: postID,
      option: option
    })
  });
}

function showPollResults(gInc: number): void {
  let poll: HTMLDivElement = dom(`gi-${gInc}`) as HTMLDivElement;
  poll.innerHTML = getPollHTML(
    JSON.parse(poll.dataset.pollJson),
    +poll.dataset.pollId,
    gInc,
    true,
    poll.dataset.pollLoggedIn == "true"
  );
}

function hidePollResults(gInc: number): void {
  let poll: HTMLDivElement = dom(`gi-${gInc}`) as HTMLDivElement;
  poll.innerHTML = getPollHTML(
    JSON.parse(poll.dataset.pollJson),
    +poll.dataset.pollId,
    gInc,
    false,
    poll.dataset.pollLoggedIn == "true"
  );
}

function refreshPoll(gInc: number): void {
  let poll: HTMLElement = dom(`gi-${gInc}`);
  s_fetch(`/api/post/poll?id=${poll.dataset.pollId}`);
}

function editPost(postID: number, isComment: boolean, private: boolean, originalText: string): void {
  let post: HTMLDivElement = document.querySelector(`[data-${isComment ? "comment" : "post"}-id="${postID}"]`);
  let contentField: HTMLDivElement = post.querySelectorAll(".main-area")[1] as HTMLDivElement;

  if (contentField.hasAttribute("data-editing")) {
    return;
  }

  contentField.setAttribute("data-editing", "");

  let oldContentField: string = contentField.innerHTML;

  let originalCW: string = contentField.querySelector("summary") ? (contentField.querySelector("summary > .c-warning-main") as HTMLElement).innerText : "";

  contentField.innerHTML = `
    <label for="default-private-${globalIncrement}">${lang.post.type_followers_only}:</label>
    <input id="default-private-${globalIncrement}" type="checkbox" ${private ? "checked" : ""}><br>
    ${ENABLE_CONTENT_WARNINGS ? `<input class="c-warning" ${originalCW ? `value="${originalCW}"` : ""} maxlength="${MAX_CONTENT_WARNING_LENGTH}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea class="post-text" maxlength="${MAX_POST_LENGTH}" placeholder="${lang.home.post_input_placeholder}">${escapeHTML(originalText)}</textarea><br>
    <button class="post-button">${lang.generic.post}</button>
    <button class="cancel-button">${lang.generic.cancel}</button>`;

  contentField.querySelector("textarea").focus();
  globalIncrement++;

  contentField.querySelector(".cancel-button").addEventListener("click", function(): void {
    contentField.innerHTML = oldContentField;
    contentField.removeAttribute("data-editing");
  });

  contentField.querySelector(".post-button").addEventListener("click", function(): void {
    s_fetch(`/api/${isComment ? "comment" : "post"}/edit`, {
      method: "PATCH",
      body: JSON.stringify({
        c_warning: (contentField.querySelector(".c-warning") as HTMLInputElement).value,
        content: contentField.querySelector("textarea").value,
        private: (contentField.querySelector("input[id^='default-private-'") as HTMLInputElement).checked,
        id: postID
      }),
      disable: [this]
    });
  });
}

function switchTimeline(event: MouseEvent): void {
  let storageID: string = this.dataset.storageId;
  let tl: string = this.dataset.timeline;

  if (storageID) {
    localStorage.setItem(storageID, tl);
  }

  if (timelineConfig.url == timelineConfig.timelines[tl]) { return; }

  document.querySelectorAll("#switch > a:not([href])").forEach((val: HTMLAnchorElement, index: number): void => {
    val.href = "javascript:void(0);";
  });

  this.removeAttribute("href")

  timelineConfig.url = timelineConfig.timelines[tl];
  refresh();
}

// function showPostModal(quoting?: string): void {
//   // TODO
// }

document.querySelectorAll("#switch > a").forEach((val: HTMLAnchorElement, index: number): void => {
  val.addEventListener("click", switchTimeline);
});

if (typeof timelineConfig.disableTimeline === "undefined" || !timelineConfig.disableTimeline) {
  function refresh(forceOffset=false): void {
    if (forceOffset !== true) {
      dom("posts").innerHTML = "";
    }

    s_fetch(
      `${timelineConfig.url}${forceOffset === true && !end ? `${timelineConfig.url.includes("?") ? "&" : "?"}offset=${timelineConfig.useOffsetC ? timelineConfig.vars.offsetC : timelineConfig.vars.offset}` : ""}`, {
        disable: [...document.querySelectorAll("button[onclick*='refresh(']")],
        extraData: {
          forceOffset: forceOffset
        }
      }
    );
  }

  refresh();
}

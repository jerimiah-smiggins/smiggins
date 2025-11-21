let currentTl: timelineConfig;
let currentTlID: string;
let tlElement: D;
let timelines: { [key: string]: timelineConfig } = {};
let tlPollingIntervalID: number | null = null;
let tlPollingPendingResponse: boolean = false;
let prependedPosts: number = 0;
let timelineToggles: string[] = [];

let tlCache: { [key: string]: timelineCache | undefined } = {};
let postCache: { [key: number]: post | undefined } = {};
let userCache: { [key: string]: userData | undefined } = {};

let offset: { upper: number | null, lower: number | null } = {
  upper: null,
  lower: null
};

const LOADING_HTML: string = "<i class=\"timeline-status\">Loading...</i>";

// hooks onto an element for a timeline, initialization
function hookTimeline(
  element: D,
  carousel: Del,
  tls: { [key: string]: timelineConfig },
  activeTimeline: string,
  fakeBodyElement?: D
): void {
  timelineToggles = [];

  if (carousel) {
    for (const el of carousel.querySelectorAll("[data-timeline-toggle][data-timeline-toggle-store]") as NodeListOf<D>) {
      if (
        el.dataset.timelineToggle
    && el.dataset.timelineToggleStore
    && localStorage.getItem("smiggins-" + el.dataset.timelineToggleStore)
      ) {
        timelineToggles.push(el.dataset.timelineToggle);
        el.dataset.timelineActive = "";
      }
    }

    if (carousel.dataset.timelineStore) {
      let id: string = localStorage.getItem("smiggins-" + carousel.dataset.timelineStore) || "";
      let el: Del = carousel.querySelector(`[data-timeline-id="${id}"]`) as Del

      if (el) {
        for (const el of carousel.querySelectorAll(`[data-timeline-active]`) as NodeListOf<D>) {
          delete el.dataset.timelineActive;
        }

        el.dataset.timelineActive = "";
        activeTimeline = id;
      }
    }
  }

  timelines = tls;
  tlElement = element;
  _setTimeline(activeTimeline, fakeBodyElement);
}

// completely refreshes the posts, ex. when switching or reloading
function reloadTimeline(ignoreCache: boolean=false, element?: D): void {
  tlElement.innerHTML = LOADING_HTML;
  prependedPosts = 0;

  let cache: timelineCache | undefined = tlCache[currentTlID];
  if (!currentTl.disableCaching && !ignoreCache && cache && cache.pendingForward !== false) {
    offset = {
      upper: cache.upperBound,
      lower: cache.lowerBound
    };

    cache.posts = cache.pendingForward.reverse().concat(cache.posts);

    let posts: number[] = [];
    for (const post of cache.posts) {
      let p = postCache[post];
      let u = p && userCache[p.user.username];
      if (currentTl.url.startsWith("user_") || !u || !u.blocking) {
        posts.push(post);
      }
    }

    (currentTl.customRender || renderTimeline)(
      posts,
      cache.end,
      false,
      element?.querySelector("#timeline-more")
    );

    timelinePolling(true);
    return;
  }

  document.getElementById("timeline-more")?.setAttribute("hidden", "");
  delete tlCache[currentTlID];
  offset.upper = null;
  offset.lower = null;

  fetch(currentTl.url)
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

// takes a list of posts and updates the post cache, returning a list of post ids
function insertIntoPostCache(posts: post[]): number[] {
  let postIds: number[] = [];

  for (const post of posts) {
    postCache[post.id] = post;
    postIds.push(post.id);
  }

  return postIds;
}

// loads more older posts
function loadMorePosts(): void {
  let more: el = document.getElementById("timeline-more");
  if (more) { more.hidden = true; }

  tlElement.insertAdjacentHTML("beforeend", LOADING_HTML);

  fetch(`${currentTl.url}${currentTl.url.includes("?") ? "&" : "?"}offset=${offset.lower}`)
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));

      if (more) { more.hidden = false; }
      clearTimelineStatuses();

      throw err;
    });
}

// clear "Loading..." text and other
function clearTimelineStatuses(): void {
  let statuses: NodeListOf<D> = tlElement.querySelectorAll(".timeline-status");
  for (const el of statuses) { el.remove(); }
}

// appends posts to a timeline
function renderTimeline(
  posts: number[],
  end: boolean,
  updateCache: boolean=true,
  moreElementOverride?: el
): void {
  clearTimelineStatuses();

  if (offset.lower === null && posts.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = "None";

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();
  let more: el = moreElementOverride || document.getElementById("timeline-more");

  if (more) {
    if (end) { more.hidden = true; }
    else { more.hidden = false; }
  }

  for (const post of posts) {
    frag.append(getPost(post));
  }

  tlElement.append(frag);

  if (updateCache && !currentTl.disableCaching) {
    let c: timelineCache | undefined = tlCache[currentTlID];

    if (!c) {
      c = {
        upperBound: null,
        lowerBound: null,
        posts: [],
        pendingForward: [],
        end: false
      };

      tlCache[currentTlID] = c;
    }

    c.posts.push(...posts);
    c.lowerBound = offset.lower;
    c.upperBound = offset.upper;
    c.end = end;
  }
}

// sets variables required when switching or setting a timeline
function _setTimeline(timelineId: string, element?: D): void {
  let c: timelineCache | undefined = tlCache[currentTlID];
  if (c) {
    c.upperBound = offset.upper;
    c.lowerBound = offset.lower;
  }

  currentTlID = timelineId.split("__")[0] + timelineToggles.map((a: string): string => ("__" + a)).join("");
  currentTl = timelines[currentTlID];

  if (tlPollingIntervalID) {
    clearInterval(tlPollingIntervalID);
    tlPollingIntervalID = null;
  }

  if (!currentTl.disablePolling) {
    tlPollingIntervalID = setInterval(timelinePolling, TL_POLLING_INTERVAL);
  }

  reloadTimeline(false, element);
}

// handles switching timelines from the tl-carousel
function switchTimeline(e: MouseEvent): void {
  let el: Del = e.target as Del;
  if (!el) { return; }

  if (el.dataset.timelineId && el.dataset.timelineId in timelines && timelines[el.dataset.timelineId].url !== currentTl.url) {
    _setTimeline(el.dataset.timelineId);

    let carousel: Del = document.querySelector("[data-timeline-store]");
    if (carousel && carousel.dataset.timelineStore) {
      localStorage.setItem("smiggins-" + carousel.dataset.timelineStore, el.dataset.timelineId);
    }
  }

  for (const el of document.querySelectorAll("[data-timeline-active]:not([data-timeline-toggle])")) {
    delete (el as D).dataset.timelineActive;
  }

  (e.target as D).dataset.timelineActive = "";
}

// handles clicking a toggle on the tl-carousel
function toggleTimeline(e: MouseEvent): void {
  let el: Del = e.target as Del;
  if (!el) { return; }

  let t: string | undefined = el.dataset.timelineToggle;
  if (!t) { return; }

  if (typeof el.dataset.timelineActive === "string") {
    delete el.dataset.timelineActive;

    if (el.dataset.timelineToggleStore) {
      localStorage.removeItem("smiggins-" + el.dataset.timelineToggleStore);
    }

    if (timelineToggles.includes(t)) {
      timelineToggles.splice(timelineToggles.indexOf(t), 1);
    }
  } else {
    el.dataset.timelineActive = "";
    timelineToggles.push(t);

    if (el.dataset.timelineToggleStore) {
      localStorage.setItem("smiggins-" + el.dataset.timelineToggleStore, "1");
    }
  }

  _setTimeline(currentTlID);
}

function pollVote(pid: number, option: number): void {
  fetch("/api/post/poll", {
    method: "POST",
    body: buildRequest([[pid, 32], [option, 8]])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any) => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function refreshPollData(pid: number): void {
  fetch(`/api/post/poll/${pid}`)
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any) => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function refreshPollDisplay(pid: number, forceVotedView: boolean=false): void {
  let c: post | undefined = postCache[pid];
  if (!c) { return; }

  for (const el of document.querySelectorAll(`[data-post-id="${pid}"] .poll-container`)) {
    el.innerHTML = getPollHTML(c.poll, pid, forceVotedView);
  }
}

function getPollHTML(poll: post["poll"], pid: number, forceVotedView: boolean=false): string {
  if (!poll) { return ""; }

  let output: string = "";
  let pollButtons: string = "";
  let voted: boolean = poll.has_voted || forceVotedView;
  let votedClass: string = voted ? "poll-voted" : "";
  let c: number = 0;

  for (const item of poll.items) {
    output += `<div ${voted ? "" : `onclick="pollVote(${pid}, ${c})"`} class="poll-bar ${votedClass}" style="--poll-width: ${item.percentage}%;" ${item.voted ? "data-vote" : ""}>
      <div class="poll-bar-text">${voted ? `${item.percentage}% - ` : ""}${escapeHTML(item.content)}</div>
    </div>`;
    c++;
  }

  if (voted) {
    pollButtons = `<a onclick="refreshPollData(${pid})">Refresh</a>`;

    if (!poll.has_voted && forceVotedView) {
      pollButtons += ` - <a onclick="refreshPollDisplay(${pid})">Return to voting</a>`;
    }
  } else {
    pollButtons = `<a onclick="refreshPollDisplay(${pid}, true)">View results</a>`;
  }

  return output + `<small><div>${floatintToStr(poll.votes)} vote${floatintToNum(poll.votes) !== 1 ? "s" : ""} - ${pollButtons}</div></small>`;
}

// turns post data into an html element
function getPost(
  post: number,
  updateOffset: boolean=true,
  forceCwState: boolean | null=null
): D {
  let p: post | undefined = postCache[post];

  if (!p) {
    let el: D = document.createElement("div");
    el.innerText = "Post couldn't be loaded.";
    return el;
  }

  let postContent: string = linkify(escapeHTML(p.content), post);

  if (updateOffset && (!offset.lower || p.timestamp < offset.lower)) { offset.lower = p.timestamp; }
  if (updateOffset && (!offset.upper || p.timestamp > offset.upper)) { offset.upper = p.timestamp; }

  let contentWarningStart: string = "";
  let contentWarningEnd: string = "";

  if (p.content_warning) {
    contentWarningStart = `<details class="content-warning"${forceCwState !== false && (forceCwState === true || localStorage.getItem("smiggins-expand-cws")) ? " open" : "" }><summary><div>${escapeHTML(p.content_warning)} <div class="content-warning-stats">(${p.content.length} char${p.content.length === 1 ? "" : "s"}${p.quote ? ", quote" : ""}${p.poll ? ", poll" : ""})</div></div></summary>`;
    contentWarningEnd = "</details>";
  }

  let pollContent: string = getPollHTML(p.poll, p.id);

  let quoteData: { [key: string]: string | [string, number] } = { hidden_if_no_quote: "hidden" };
  let quoteUnsafeData: { [key: string]: string | [string, number] } = {};
  if (p.quote) {
    let quoteContent: string = linkify(escapeHTML(p.quote.content), p.quote.id);
    let quoteCwStart: string = "";
    let quoteCwEnd: string = "";

    if (p.quote.content_warning) {
      quoteCwStart = `<details class="content-warning"${forceCwState !== false && (forceCwState === true || localStorage.getItem("smiggins-expand-cws")) ? " open" : "" }><summary><div>${escapeHTML(p.quote.content_warning)} <div class="content-warning-stats">(${p.quote.content.length} char${p.quote.content.length === 1 ? "" : "s"}${p.quote.has_quote ? ", quote" : ""}${p.quote.has_poll ? ", poll" : ""})</div></div></summary>`;
      quoteCwEnd = "</details>";
    }

    quoteData = {
      hidden_if_no_quote: "",

      quote_timestamp: getTimestamp(p.quote.timestamp),
      quote_username: p.quote.user.username,
      quote_private_post: p.quote.private ? "data-private-post" : "",
      quote_cw_end: quoteCwEnd,

      quote_banner_one: p.quote.user.banner[0],
      quote_banner_two: p.quote.user.banner[1],

      quote_pid: String(p.quote.id),
      quote_comment_id: String(p.quote.comment),

      hidden_if_no_quote_pronouns: p.quote.user.pronouns ? "" : "hidden",
      hidden_if_no_quote_comment: p.quote.comment ? "" : "hidden",
      hidden_if_no_quote_edit: p.quote.edited ? "" : "hidden"
    };

    quoteUnsafeData = {
      quote_content: [quoteContent + (p.quote.has_poll ? (p.quote.content ? "\n" : "") + "<i>Includes a poll</i>" : "") + (p.quote.has_quote ? (p.quote.content || p.quote.has_poll ? "\n" : "") + "<i>Includes a quote</i>" : ""), 1],
      quote_cw_start: [quoteCwStart, 1],
      quote_pronouns: [p.quote.user.pronouns || "", 1],
      quote_display_name: [escapeHTML(p.quote.user.display_name), 1]
    };
  }

  let el: D = getSnippet("post", {
    timestamp: getTimestamp(p.timestamp),
    username: p.user.username,
    post_interactions_hidden: localStorage.getItem("smiggins-hide-interactions") && "hidden" || "",
    edit_hidden: username === p.user.username ? "" : "hidden",
    delete_hidden: isAdmin || username === p.user.username ? "" : "hidden",

    pid: String(post),
    comment_id: String(p.comment),

    comments: floatintToStr(p.interactions.comments),
    quotes: floatintToStr(p.interactions.quotes),
    likes: floatintToStr(p.interactions.likes),
    liked: String(p.interactions.liked),

    banner_one: p.user.banner[0],
    banner_two: p.user.banner[1],

    private_post: p.private ? "data-private-post" : "",
    cw_end: contentWarningEnd,
    hidden_if_no_pronouns: p.user.pronouns ? "" : "hidden",
    hidden_if_no_comment: p.comment ? "" : "hidden",
    hidden_if_no_poll: p.poll ? "" : "hidden",
    hidden_if_no_edit: p.edited ? "" : "hidden",
    ...quoteData,

    // unsafe items, includes a max replace in order to prevent unwanted injection
    ...quoteUnsafeData,
    poll: [pollContent, 1],
    content: [postContent, 1],
    pronouns: [p.user.pronouns || "", 1],
    display_name: [escapeHTML(p.user.display_name), 1],
    cw_start: [contentWarningStart, 1],
  });

  el.dataset.editReplace = String(post);

  if (p.quote === false) {
    let quoteElement: el = el.querySelector(".post-quote");

    if (quoteElement) {
      quoteElement.removeAttribute("hidden");
      quoteElement.innerHTML = "<i>You can't view this quote.</i>";
    }
  }

  return el;
}

// show pending new posts on the timeline
function timelineShowNew(): void {
  let c: timelineCache | undefined = tlCache[currentTlID];
  if (!c) { return; }

  let posts: number[] | false = c.pendingForward;
  c.pendingForward = [];
  document.getElementById("timeline-show-new")?.remove();

  if (posts === false) {
    reloadTimeline(true);
    return;
  }

  c.posts = posts.reverse().concat(c.posts);

  let frag: DocumentFragment = document.createDocumentFragment();

  for (const post of posts) {
    frag.append(getPost(post));
  }

  prependedPosts = 0;
  for (const el of document.querySelectorAll("[data-prepended]")) {
    el.remove();
  }

  tlElement.prepend(frag);
}

// handles adding posts to forwards
function handleForward(
  posts: post[],
  end: boolean,
  expectedTlID: string,
  forceEvent: boolean=false
): void {
  tlPollingPendingResponse = false;

  let c: timelineCache | undefined = tlCache[expectedTlID];
  if (!c) { return; }

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");

    if (end) { c.pendingForward = false; }
    else if (c.pendingForward !== false) {
      c.pendingForward.push(...insertIntoPostCache(posts).reverse());
    }

    return;
  }

  if (posts.length === 0 || c.pendingForward === false) { return; }

  let showNewElement: el = document.getElementById("timeline-show-new");

  if (!forceEvent && !showNewElement && (!end || (c.pendingForward.length + posts.length - prependedPosts) > 0)) {
    showNewElement = document.createElement("button");
    showNewElement.id = "timeline-show-new";
    showNewElement.addEventListener("click", timelineShowNew);
    tlElement.prepend(showNewElement);
  }

  if (end) {
    offset.upper = posts[0].timestamp;
    c.pendingForward.push(...insertIntoPostCache(posts).reverse());

    if (showNewElement) {
      showNewElement.innerText = `Show new posts (${c.pendingForward.length - prependedPosts})`;
    }
  } else {
    c.pendingForward = false;
    if (showNewElement) { showNewElement.innerText = "Refresh"; }
  }

  if (forceEvent) {
    timelineShowNew();
  }
}

// fetch new posts for a timeline
function timelinePolling(forceEvent: boolean=false): void {
  if (currentTl.disablePolling || !offset.upper || (tlPollingPendingResponse && !forceEvent)) { return; }

  let c: timelineCache | undefined = tlCache[currentTlID];
  tlPollingPendingResponse = true;

  if (c && c.pendingForward === false) { return; }

  if (localStorage.getItem("smiggins-auto-show-posts")) {
    forceEvent = true;
  }

  fetch(`${currentTl.url}${currentTl.url.includes("?") ? "&" : "?"}offset=${offset.upper}&forwards=true`)
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then((ab: ArrayBuffer): void => (parseResponse(ab, (forceEvent ? "$" : "") + currentTlID)))
    .catch((err: any): void => {
      console.log("Something went wrong polling", err)
      tlPollingPendingResponse = false;
    });
}

// prepends a post to the current timeline (ex. when creating a post, shows it immediately instead of waiting for load)
function prependPostToTimeline(post: post): void {
  if (currentTl.prependPosts) {
    if (
      typeof currentTl.prependPosts === "number" &&
      post.comment !== currentTl.prependPosts
    ) { return; }

    if (!tlElement.querySelector(".post")) { clearTimelineStatuses(); }

    let newButton: el = document.getElementById("timeline-show-new");
    let prependedPost: D = getPost(insertIntoPostCache([post])[0], false);
    prependedPost.dataset.prepended = "";
    prependedPosts++;

    if (newButton) {
      tlElement.prepend(newButton, prependedPost);
    } else {
      tlElement.prepend(prependedPost);
    }
  }
}

// handles events when clicking the like, quote, etc. buttons on posts
function postButtonClick(e: Event): void {
  let el: el = e.currentTarget as el;
  if (!el) { return; }

  if (el.dataset.interactionQuote) {
    createPostModal("quote", +el.dataset.interactionQuote);
  } else if (el.dataset.interactionLike) {
    let postId: number = +el.dataset.interactionLike;
    let liked: boolean = el.dataset.liked === "true";
    let c: post | undefined = postCache[postId];
    if (c) {
      c.interactions.liked = !liked;
      c.interactions.likes += (-liked + 0.5) * 2 * (1 << 3); // floatint, must increase/decrease by int 8 to change floatint by one (div10 bit, kmb 2 bits)
    }

    for (const element of document.querySelectorAll(`[data-interaction-like="${postId}"]`) as NodeListOf<HTMLElement>) {
      element.dataset.liked = String(!liked);

      let number: el = element.querySelector("[data-number]");
      if (number && !isNaN(+number.innerText)) {
        number.innerText = String(+number.innerText + (-liked + 0.5) * 2);
      }
    }

    fetch(`/api/post/like/${postId}`, {
      method: liked ? "DELETE" : "POST"
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any) => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  } else if (el.dataset.interactionEdit) {
    createPostModal("edit", +el.dataset.interactionEdit);
  } else if (el.dataset.interactionPin) {
    let postId: number = +el.dataset.interactionPin;

    fetch(`/api/post/pin/${postId}`, {
      method: "POST"
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any) => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  } else if (el.dataset.interactionUnpin) {
    fetch("/api/post/pin", {
      method: "DELETE"
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any) => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  } else if (el.dataset.interactionDelete) {
    let postId: number = +el.dataset.interactionDelete;

    fetch("/api/post", {
      method: "DELETE",
      body: buildRequest([[postId, 32]])
    }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any) => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  } else {
    console.log("Unknown interaction type for post button", e);
  }

  e.preventDefault();
}

// actually posts the post
function createPost(
  content: string,
  cw: string | null,
  followersOnly: boolean,
  callback?: (success: boolean) => void,
  extra?: {
    quote?: number,
    poll?: string[],
    comment?: number
  }
): void {
  fetch("/api/post", {
    method: "POST",
    body: buildRequest([
      followersOnly,
      Boolean(extra && extra.quote),
      Boolean(extra && extra.poll && extra.poll.length),
      Boolean(extra && extra.comment),
      [content, 16],
      [cw || "", 8],
      ...((extra && extra.poll && extra.poll.length) ? [[extra.poll.length, 8] as [number, 8], ...extra.poll.map((a: string): [string, 8] => ([a, 8]))] : []),
      ...((extra && extra.quote) ? [[extra.quote, 32] as [number, 32]] : []),
      ...((extra && extra.comment) ? [[extra.comment, 32] as [number, 32]] : [])
    ])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then((ab: ArrayBuffer): ArrayBuffer => {
      callback && callback(!((new Uint8Array(ab)[0] >> 7) & 1));
      return ab;
    })
    .then(parseResponse)
    .catch((err: any): void => {
      callback && callback(false);
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

// handles deleting posts, removing from tls, caches, etc.
function handlePostDelete(pid: number): void {
  for (const tlData of Object.values(tlCache)) {
    while (tlData?.posts.includes(pid)) {
      tlData.posts.splice(tlData.posts.indexOf(pid), 1);
    }
  }

  for (const el of document.querySelectorAll(`[data-post-id="${pid}"]`)) {
    el.innerHTML = "<i>This post has been deleted.</i>";
  }

  delete tlCache[`post_${pid}_recent`];
  delete tlCache[`post_${pid}_oldest`];

  if (getPostIDFromPath() === pid) {
    currentPage = "home";
    history.pushState("home", "", "/");
    renderPage("home");
  }

  for (const [newPid, data] of Object.entries(postCache)) {
    if (data?.comment === pid) {
      delete postCache[+newPid];
      handlePostDelete(+newPid);
    }
  }
}

// returns an escaped string containing the post content, or a content warning if there is one
function simplePostContent(post: post): string {
  return escapeHTML(post.content_warning ? "CW: " + post.content_warning : post.content) || (post.poll ? "Poll" : "");
}

// (processing) timeline "show more" button
function p_tlMore(element: D): void {
  let el: Element | null = element.querySelector("[id=\"timeline-more\"]");

  if (el) {
    el.addEventListener("click", (): void => {
      el.setAttribute("hidden", "");
      loadMorePosts();
    });
  }
}

// (processing) timeline carousel switching
function p_tlSwitch(element: D): void {
  let carouselItems: NodeListOf<D> = element.querySelectorAll("[data-timeline-id]");
  let carouselToggles: NodeListOf<D> = element.querySelectorAll("[data-timeline-toggle]");

  for (const i of carouselItems) { i.addEventListener("click", switchTimeline); }
  for (const i of carouselToggles) { i.addEventListener("click", toggleTimeline); }
}

// (processing) adds the click events to posts
function p_post(element: D): void {
  element.querySelector("[data-interaction-comment]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-quote]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-like]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-edit]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-pin]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-delete]")?.addEventListener("click", postButtonClick);
}

setInterval(updateTimestamps, 1000);

let currentTl: timelineConfig;
let currentTlID: string;
let tlElement: HTMLDivElement;
let timelines: { [key: string]: timelineConfig } = {};
let tlPollingIntervalID: number | null = null;
let tlPollingPendingResponse: boolean = false;
let prependedPosts: number = 0;

let tlCache: { [key: string]: timelineCache | undefined } = {};
let postCache: { [key: number]: post | undefined } = {};
let userCache: { [key: string]: userData | undefined } = {};

let offset: { upper: number | null, lower: number | null } = {
  upper: null,
  lower: null
};

const LOADING_HTML: string = "<i class=\"timeline-status\">Loading...</i>";
const TL_POLLING_INTERVAL: number = 10_000; // 10s

// hooks onto an element for a timeline, initialization
function hookTimeline(
  element: HTMLDivElement,
  tls: { [key: string]: timelineConfig },
  activeTimeline: string,
  fakeBodyElement?: HTMLDivElement
): void {
  timelines = tls;
  tlElement = element;
  _setTimeline(activeTimeline, fakeBodyElement);
}

// completely refreshes the posts, ex. when switching or reloading
function reloadTimeline(ignoreCache: boolean=false, element?: HTMLDivElement): void {
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

    renderTimeline(
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
  let more: HTMLElement | null = document.getElementById("timeline-more");
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
  let statuses: NodeListOf<HTMLDivElement> = tlElement.querySelectorAll(".timeline-status");
  for (const el of statuses) { el.remove(); }
}

// appends posts to a timeline
function renderTimeline(
  posts: number[] | [postId: number, notificationType: number][],
  end: boolean,
  updateCache: boolean=true,
  moreElementOverride?: HTMLElement | null
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
  let more: HTMLElement | null = moreElementOverride || document.getElementById("timeline-more");

  if (more) {
    if (end) { more.hidden = true; }
    else { more.hidden = false; }
  }

  for (const post of posts) {
    if (typeof post === "number") {
      frag.append(getPost(post));
    } else {
      let title: HTMLDivElement = document.createElement("div");
      title.classList.add("notification-title");

      switch (post[1] & 0b01111111) {
        case NotificationCodes.Comment: title.innerText = `${postCache[post[0]]?.user.display_name} commented on your post:`; break;
        case NotificationCodes.Quote: title.innerText = `${postCache[post[0]]?.user.display_name} quoted your post:`; break;
        case NotificationCodes.Ping: title.innerText = `${postCache[post[0]]?.user.display_name} mentioned you:`; break;
        case NotificationCodes.Like: title.innerText = `${postCache[post[0]]?.user.display_name} liked your post:`; break;
        default: title.innerText = "Unknown notification type";
      }

      frag.append(title, getPost(post[0]));
    }
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

    if (posts && typeof posts[0] === "number") {
      // @ts-ignore
      c.posts.push(...posts);
    } else if (posts && typeof posts[0] === "object") {
      // @ts-ignore
      c.posts.push(...(posts.map((a) => (a[0]))));
    }

    c.lowerBound = offset.lower;
    c.upperBound = offset.upper;
    c.end = end;
  }
}

// sets variables required when switching or setting a timeline
function _setTimeline(timelineId: string, element?: HTMLDivElement): void {
  let c: timelineCache | undefined = tlCache[currentTlID];
  if (c) {
    c.upperBound = offset.upper;
    c.lowerBound = offset.lower;
  }

  currentTl = timelines[timelineId];
  currentTlID = timelineId;

  if (tlPollingIntervalID) {
    clearInterval(tlPollingIntervalID);
    tlPollingIntervalID = null;
  }

  if (!currentTl.disablePolling) {
    tlPollingIntervalID = setInterval(timelinePolling, TL_POLLING_INTERVAL);
  }

  reloadTimeline(undefined, element);
}

// handles switching timelines from the tl-carousel
function switchTimeline(e: MouseEvent): void {
  let el: HTMLDivElement | null = e.target as HTMLDivElement | null;
  if (!el) { return; }

  if (el.dataset.timelineId && el.dataset.timelineId in timelines && timelines[el.dataset.timelineId].url !== currentTl.url) {
    _setTimeline(el.dataset.timelineId);
  }

  for (const el of document.querySelectorAll("[data-timeline-active]")) {
    delete (el as HTMLDivElement).dataset.timelineActive;
  }

  (e.target as HTMLDivElement).dataset.timelineActive = "";
}

// turns post data into an html element
function getPost(post: number, updateOffset: boolean=true): HTMLDivElement {
  let p: post | undefined = postCache[post];

  if (!p) {
    let el: HTMLDivElement = document.createElement("div");
    el.innerText = "Post couldn't be loaded. Oops.";
    return el;
  }

  let postContent: string = linkify(escapeHTML(p.content), post);

  if (updateOffset && (!offset.lower || p.timestamp < offset.lower)) { offset.lower = p.timestamp; }
  if (updateOffset && (!offset.upper || p.timestamp > offset.upper)) { offset.upper = p.timestamp; }

  let contentWarningStart: string = "";
  let contentWarningEnd: string = "";

  if (p.content_warning) {
    contentWarningStart = `<details class="content-warning"${localStorage.getItem("smiggins-expand-cws") ? " open" : "" }><summary><div>${escapeHTML(p.content_warning)} <div class="content-warning-stats">(${p.content.length} char${p.content.length === 1 ? "" : "s"}${p.quote ? ", quote" : ""})</div></div></summary>`;
    contentWarningEnd = "</details>";
  }

  let quoteData: { [key: string]: string | [string, number] } = { hidden_if_no_quote: "hidden" };
  if (p.quote) {
    let quoteContent: string = linkify(escapeHTML(p.quote.content), p.quote.id);
    let quoteCwStart: string = "";
    let quoteCwEnd: string = "";

    if (p.quote.content_warning) {
      quoteCwStart = `<details class="content-warning"${localStorage.getItem("smiggins-expand-cws") ? " open" : "" }><summary><div>${escapeHTML(p.quote.content_warning)} <div class="content-warning-stats">(${p.quote.content.length} char${p.quote.content.length === 1 ? "" : "s"})</div></div></summary>`;
      quoteCwEnd = "</details>";
    }

    quoteData = {
      hidden_if_no_quote: "",
      quote_timestamp: getTimestamp(p.quote.timestamp),
      quote_username: p.quote.user.username,
      quote_content: [quoteContent, 1],
      quote_display_name: [escapeHTML(p.quote.user.display_name), 1],
      quote_private_post: p.quote.private ? "data-private-post" : "",
      quote_cw_start: quoteCwStart,
      quote_cw_end: quoteCwEnd
    };
  }

  let el: HTMLDivElement = getSnippet("post", {
    timestamp: getTimestamp(p.timestamp),
    username: p.user.username,
    post_interactions_hidden: localStorage.getItem("smiggins-hide-interactions") && "hidden" || "",

    pid: String(post),

    comments: String(p.interactions.comments),
    quotes: String(p.interactions.quotes),
    likes: String(p.interactions.likes),
    liked: String(p.interactions.liked),

    // unsafe items, includes a max replace in order to prevent unwanted injection
    content: [postContent, 1],
    display_name: [escapeHTML(p.user.display_name), 1],
    private_post: p.private ? "data-private-post" : "",
    cw_start: contentWarningStart,
    cw_end: contentWarningEnd,
    ...quoteData
  });

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
function handleForward(posts: post[], end: boolean, expectedTlID: string, forceEvent: boolean=false): void {
  tlPollingPendingResponse = false;

  let c: timelineCache | undefined = tlCache[expectedTlID];
  if (!c) { return; }

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");

    if (end) { c.pendingForward = false; }
    else if (c.pendingForward !== false) {
      c.pendingForward.push(...insertIntoPostCache(posts).reverse());
    }
  }

  if (posts.length === 0 || c.pendingForward === false) { return; }

  let showNewElement: HTMLElement | null = document.getElementById("timeline-show-new");

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
  if (currentTl.disablePolling) { return; }

  let c: timelineCache | undefined = tlCache[currentTlID];

  if (tlPollingPendingResponse && !forceEvent) { return; }
  tlPollingPendingResponse = true;

  if (!c || c.pendingForward === false || !offset.upper) { return; }

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

    let newButton: HTMLElement | null = document.getElementById("timeline-show-new");
    let prependedPost: HTMLDivElement = getPost(insertIntoPostCache([post])[0], false);
    prependedPost.dataset.prepended = "";
    prependedPosts++;

    if (newButton) {
      tlElement.prepend(newButton, prependedPost);
    } else {
      tlElement.prepend(prependedPost);
    }
  }
}

// handles events when clicking the like and quote buttons on posts
function postButtonClick(e: Event): void {
  let el: HTMLElement | null = e.currentTarget as HTMLElement | null;

  if (!el) { return; }

  if (el.dataset.interactionQuote) {
    let postId: number = +el.dataset.interactionQuote;

    createPostModal("quote", postId);
  } else if (el.dataset.interactionLike) {
    let postId: number = +el.dataset.interactionLike;
    let liked: boolean = el.dataset.liked === "true";
    let number: HTMLElement | null = el.querySelector("[data-number]");

    if (number) {
      number.innerText = String(+number.innerText + (-liked + 0.5) * 2);
    }

    let c: post | undefined = postCache[postId];
    if (c) {
      c.interactions.liked = !liked;
      c.interactions.likes += (-liked + 0.5) * 2;
    }

    el.dataset.liked = String(!liked);

    fetch(`/api/post/like/${postId}`)
      .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
      .then(parseResponse)
      .catch((err: any) => {
        createToast("Something went wrong!", String(err));
        throw err;
      });
  }
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
  console.log(...[
      followersOnly,
      Boolean(extra && extra.quote),
      Boolean(extra && extra.poll && extra.poll.length),
      Boolean(extra && extra.comment),
      [content, 16],
      [cw || "", 8],
      ...(extra && extra.poll ? [[extra.poll.length, 8] as [number, 8], ...extra.poll.map((a: string): [string, 8] => ([a, 8]))] : []),
      ...(extra && extra.quote ? [[extra.quote, 32] as [number, 32]] : []),
      ...(extra && extra.comment ? [[extra.comment, 32] as [number, 32]] : [])
    ]);

  fetch("/api/post", {
    method: "POST",
    body: buildRequest([
      followersOnly,
      Boolean(extra && extra.quote),
      Boolean(extra && extra.poll && extra.poll.length),
      Boolean(extra && extra.comment),
      [content, 16],
      [cw || "", 8],
      ...(extra && extra.poll ? [[extra.poll.length, 8] as [number, 8], ...extra.poll.map((a: string): [string, 8] => ([a, 8]))] : []),
      ...(extra && extra.quote ? [[extra.quote, 32] as [number, 32]] : []),
      ...(extra && extra.comment ? [[extra.comment, 32] as [number, 32]] : [])
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

// (processing) timeline "show more" button
function p_tlMore(element: HTMLDivElement): void {
  let el: Element | null = element.querySelector("[id=\"timeline-more\"]");

  if (el) {
    el.addEventListener("click", (): void => {
      el.setAttribute("hidden", "");
      loadMorePosts();
    });
  }
}

// (processing) timeline carousel switching
function p_tlSwitch(element: HTMLDivElement): void {
  let carouselItems: NodeListOf<HTMLDivElement> = element.querySelectorAll("[data-timeline-id]");

  for (const i of carouselItems) {
    i.addEventListener("click", switchTimeline);
  }
}

// (processing) adds the click events to posts
function p_post(element: HTMLDivElement): void {
  element.querySelector("[data-interaction-quote]")?.addEventListener("click", postButtonClick);
  element.querySelector("[data-interaction-like]")?.addEventListener("click", postButtonClick);
}

setInterval(updateTimestamps, 1000);

let currentTl: timelineConfig;
let currentTlID: string;
let tlElement: HTMLDivElement;
let timelines: { [key: string]: timelineConfig } = {};
let tlPollingIntervalID: number | null = null;
let tlPollingPendingResponse: boolean = false;
let prependedPosts: number = 0;

let tlCache: { [key: string]: {
  timestamp: number,
  upperBound: number | null,
  lowerBound: number | null,
  posts: post[],
  pendingForward: post[] | false,
  extraData: { [key: string]: any },
  end: boolean
}} = {};

let offset: { upper: number | null, lower: number | null } = {
  upper: null,
  lower: null
};

const LOADING_HTML: string = "<i class=\"timeline-status\">Loading...</i>";
const TL_CACHE_TTL: number = 60 * 60; // 1h
const TL_POLLING_INTERVAL: number = 10_000; // 10s

// hooks onto an element for a timeline, initialization
function hookTimeline(
  element: HTMLDivElement,
  tls: { [key: string]: timelineConfig },
  activeTimeline: string
): void {
  timelines = tls;
  tlElement = element;
  _setTimeline(activeTimeline);
}

// completely refreshes the posts, ex. when switching or reloading
function reloadTimeline(ignoreCache: boolean=false): void {
  tlElement.innerHTML = LOADING_HTML;
  prependedPosts = 0;

  let cache = tlCache[currentTlID];
  if (!ignoreCache && cache && Math.round(Date.now() / 1000) < cache.timestamp + TL_CACHE_TTL && cache.pendingForward !== false) {
    offset = {
      upper: cache.upperBound,
      lower: cache.lowerBound
    };

    cache.posts = cache.pendingForward.reverse().concat(cache.posts);
    renderTimeline({
      success: true,
      posts: cache.posts,
      end: cache.end,
      extraData: cache.extraData,
    }, false);

    timelinePolling(true);
    return;
  }

  document.getElementById("timeline-more")?.setAttribute("hidden", "");
  delete tlCache[currentTlID];
  offset.upper = null;
  offset.lower = null;

  fetch(currentTl.url, {
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_timeline> => (response.json()))
    .then((json: api_timeline): void => {
      renderTimeline(json);
    })
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

// loads more older posts
function loadMorePosts(): void {
  let more: HTMLElement | null = document.getElementById("timeline-more");
  let currentTimeline: timelineConfig = currentTl;
  let currentTimelineID: string = currentTlID;
  if (more) { more.hidden = true; }

  tlElement.insertAdjacentHTML("beforeend", LOADING_HTML);

  fetch(`${currentTl.url}?offset=${offset.lower}`, {
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_timeline> => (response.json()))
    .then((json: api_timeline): void => {
      if (currentTl.url !== currentTimeline.url) {
        console.log("timeline switched, discarding request");
        if (json.success) { tlCache[currentTimelineID]?.posts.push(...json.posts); }
        return;
      }

      renderTimeline(json);
    })
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
function renderTimeline(json: api_timeline, updateCache: boolean=true): void {
  if (currentTl.timelineCallback) {
    currentTl.timelineCallback(json);
  }

  if (!json.success) {
    createToast("Something went wrong!");
    // TODO - better error handling
    console.log(json);
    return;
  }

  clearTimelineStatuses();

  let frag: DocumentFragment = document.createDocumentFragment();
  let more: HTMLElement | null = document.getElementById("timeline-more");

  if (more) {
    if (json.end) { more.hidden = true; }
    else { more.hidden = false; }
  }

  for (const post of json.posts) {
    frag.append(getPost(post));
  }

  tlElement.append(frag);

  if (updateCache) {
    if (!tlCache[currentTlID]) {
      tlCache[currentTlID] = {
        timestamp: 0,
        upperBound: null,
        lowerBound: null,
        posts: [],
        pendingForward: [],
        extraData: {},
        end: false
      };
    }

    tlCache[currentTlID].timestamp = Math.round(Date.now() / 1000);
    tlCache[currentTlID].posts.push(...json.posts);
    tlCache[currentTlID].lowerBound = offset.lower;
    tlCache[currentTlID].upperBound = offset.upper;
    tlCache[currentTlID].end = json.end;
    if (json.extraData) { tlCache[currentTlID].extraData = json.extraData; }
  }
}

// sets variables required when switching or setting a timeline
function _setTimeline(timelineId: string): void {
  if (tlCache[currentTlID]) {
    tlCache[currentTlID].upperBound = offset.upper;
    tlCache[currentTlID].lowerBound = offset.lower;
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

  reloadTimeline();
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
function getPost(post: post, updateOffset: boolean=true): HTMLDivElement {
  let postContent: string = escapeHTML(post.content);

  if (updateOffset && (!offset.lower || post.id < offset.lower)) { offset.lower = post.id; }
  if (updateOffset && (!offset.upper || post.id > offset.upper)) { offset.upper = post.id; }

  if (post.content_warning) {
    postContent = `<details class="content-warning"${localStorage.getItem("smiggins-expand-cws") ? " open" : "" }><summary><div>${escapeHTML(post.content_warning)} <div class="content-warning-stats">(${post.content.length} char${post.content.length === 1 ? "" : "s"})</div></div></summary>${postContent}</details>`;
  }

  let el: HTMLDivElement = getSnippet("post", {
    timestamp: getTimestamp(post.timestamp),
    username: post.user.username,

    // unsafe items, includes a max replace in order to prevent unwanted injection
    content: [linkify(postContent, post.id), 1],
    display_name: [escapeHTML(post.user.display_name), 1]
  });

  if (post.private) {
    el.dataset.privatePost = "";
  }

  return el;
}

// show pending new posts on the timeline
function timelineShowNew(): void {
  let posts: false | post[] = tlCache[currentTlID].pendingForward;
  tlCache[currentTlID].pendingForward = [];
  document.getElementById("timeline-show-new")?.remove();

  if (posts === false) {
    reloadTimeline(true);
    return;
  }

  tlCache[currentTlID].posts = posts.reverse().concat(tlCache[currentTlID].posts);

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

// fetch new posts for a timeline
function timelinePolling(forceEvent: boolean=false): void {
  let currentTimeline: timelineConfig = currentTl;
  let currentTimelineID: string = currentTlID;

  tlPollingPendingResponse = true;
  if (tlCache[currentTlID].pendingForward === false || !offset.upper) { return; }

  if (localStorage.getItem("smiggins-auto-show-posts")) {
    forceEvent = true;
  }

  fetch(`${currentTl.url}?offset=${offset.upper}&forwards=true`)
    .then((response: Response): Promise<api_timeline> => (response.json()))
    .then((json: api_timeline): void => {
      if (currentTimeline.url !== currentTl.url) {
        console.log("timeline switched, discarding request");

        if (json.success) {
          let cache = tlCache[currentTimelineID];

          if (json.end) { cache.pendingForward = false; }
          else if (cache.pendingForward !== false) { cache.pendingForward.push(...json.posts.reverse()); }
        }
      }

      if (currentTl.timelineCallback) {
        currentTl.timelineCallback(json);
      }

      if (json.success) {
        if (json.posts.length === 0) { return; }

        let cache = tlCache[currentTlID];
        if (cache.pendingForward === false) { return; }

        let showNewElement: HTMLElement | null = document.getElementById("timeline-show-new");

        if (!forceEvent && !showNewElement && (!json.end || (cache.pendingForward.length + json.posts.length - prependedPosts) > 0)) {
          showNewElement = document.createElement("button");
          showNewElement.id = "timeline-show-new";
          showNewElement.addEventListener("click", timelineShowNew);
          tlElement.prepend(showNewElement);
        }

        if (json.end) {
          offset.upper = json.posts[0].id;
          cache.pendingForward.push(...json.posts.reverse());

          if (showNewElement) {
            showNewElement.innerText = `Show new posts (${cache.pendingForward.length - prependedPosts})`;
          }
        } else {
          cache.pendingForward = false;
          if (showNewElement) { showNewElement.innerText = "Refresh"; }
        }

        if (forceEvent) {
          timelineShowNew();
        }
      } else {
        console.log("Unsuccessful timeline polling, reason " + json.reason);
      }

      tlPollingPendingResponse = false;
    })
    .catch((err: any): void => {
      console.log("Something went wrong polling", err)
      tlPollingPendingResponse = false;
    });
}

// prepends a post to the current timeline (ex. when creating a post, shows it immediately instead of waiting for load)
function prependPostToTimeline(post: post): void {
  if (currentTl.prependPosts) {
    let newButton: HTMLElement | null = document.getElementById("timeline-show-new");
    let prependedPost: HTMLDivElement = getPost(post, false);
    prependedPost.dataset.prepended = "";
    prependedPosts++;

    if (newButton) {
      tlElement.prepend(newButton, prependedPost);
    } else {
      tlElement.prepend(prependedPost);
    }
  }
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

setInterval(updateTimestamps, 1000);

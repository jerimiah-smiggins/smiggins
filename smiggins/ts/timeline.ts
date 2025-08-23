let currentTl: timelineConfig;
let tlElement: HTMLDivElement;
let timelines: { [key: string]: timelineConfig } = {};
let tlCache: { [key: string]: { timestamp: number, posts: post[] } } = {}
let offset: number | null = null;

const LOADING_HTML: string = "<i class=\"timeline-status\">Loading...</i>";
const TL_CACHE_TTL: number = 60 * 60 * 1000; // 1h

function hookTimeline(
  element: HTMLDivElement,
  tls: { [key: string]: timelineConfig },
  activeTimeline: string
): void {
  timelines = tls;
  currentTl = timelines[activeTimeline];
  tlElement = element;

  reloadTimeline();
}

function reloadTimeline(): void {
  tlElement.innerHTML = LOADING_HTML;

  fetch(currentTl.url, {
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_timeline> => (response.json()))
    .then(renderTimeline)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function loadMorePosts(): void {
  let more: HTMLElement | null = document.getElementById("timeline-more");
  let currentTimeline: timelineConfig = currentTl;
  if (more) { more.hidden = true; }

  tlElement.insertAdjacentHTML("beforeend", LOADING_HTML);

  fetch(`${currentTl.url}?offset=${offset}`, {
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_timeline> => (response.json()))
    .then((json: api_timeline): void => {
      if (currentTl.url !== currentTimeline.url) {
        console.log("timeline switched, discarding request");
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

function clearTimelineStatuses() {
    let statuses: NodeListOf<HTMLDivElement> = tlElement.querySelectorAll(".timeline-status");
    for (const el of statuses) { el.remove(); }
}

function renderTimeline(json: api_timeline): void {
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
    if (json.end) {
      more.hidden = true;
    } else {
      more.hidden = false;
    }
  }

  for (const post of json.posts) {
    frag.append(getPost(post));
  }

  tlElement.append(frag);
}

function switchTimeline(e: MouseEvent): void {
  let el: HTMLDivElement | null = e.target as HTMLDivElement | null;
  if (!el) { return; }

  if (el.dataset.timelineId && el.dataset.timelineId in timelines && timelines[el.dataset.timelineId].url !== currentTl.url) {
    currentTl = timelines[el.dataset.timelineId];
    reloadTimeline();
  }

  for (const el of document.querySelectorAll("[data-timeline-active]")) {
    delete (el as HTMLDivElement).dataset.timelineActive;
  }

  (e.target as HTMLDivElement).dataset.timelineActive = "";
}

function p_tlMore(element: HTMLDivElement): void {
  let el: Element | null = element.querySelector("[id=\"timeline-more\"]");

  if (el) {
    el.addEventListener("click", (): void => {
      el.setAttribute("hidden", "");
      loadMorePosts();
    });
  }
}

function p_tlSwitch(element: HTMLDivElement): void {
  let carouselItems: NodeListOf<HTMLDivElement> = element.querySelectorAll("[data-timeline-id]");

  for (const i of carouselItems) {
    i.addEventListener("click", switchTimeline);
  }
}

function p_search(element: D): void {
  let contentElement:  Iel = element.querySelector("#search-content");
  let advancedElement:  el = element.querySelector("details");
  let cwElement:       Iel = element.querySelector("#search-cw");
  let usernameElement: Iel = element.querySelector("#search-username");
  let quoteElement:    Iel = element.querySelector("#search-quote");
  let pollElement:     Iel = element.querySelector("#search-poll");
  let commentElement:  Iel = element.querySelector("#search-comment");

  let params: URLSearchParams = new URLSearchParams(location.search);

  if (contentElement && params.get("q")) { contentElement.value = params.get("q") || ""; }
  if (cwElement && params.get("cw")) { cwElement.value = params.get("cw") || ""; advancedElement?.setAttribute("open", ""); }
  if (usernameElement && params.get("user")) { usernameElement.value = params.get("user") || ""; advancedElement?.setAttribute("open", ""); }
  if (quoteElement && params.get("quote")) { quoteElement.value = params.get("quote") || ""; advancedElement?.setAttribute("open", ""); }
  if (pollElement && params.get("poll")) { pollElement.value = params.get("poll") || ""; advancedElement?.setAttribute("open", ""); }
  if (commentElement && params.get("comment")) { commentElement.value = params.get("comment") || ""; advancedElement?.setAttribute("open", ""); }

  element.querySelector("#apply-search")?.addEventListener("click", (): void => resetSearchTL());
  resetSearchTL(element);
}

function resetSearchTL(baseElement?: D): void {
  let contentElement:  Iel = (baseElement || document).querySelector("#search-content");
  let cwElement:       Iel = (baseElement || document).querySelector("#search-cw");
  let usernameElement: Iel = (baseElement || document).querySelector("#search-username");
  let quoteElement:    Iel = (baseElement || document).querySelector("#search-quote");
  let pollElement:     Iel = (baseElement || document).querySelector("#search-poll");
  let commentElement:  Iel = (baseElement || document).querySelector("#search-comment");

  let content:    string = contentElement  ? contentElement.value.toLowerCase()  : "";
  let cw:         string = cwElement       ? cwElement.value.toLowerCase()       : "";
  let username:   string = usernameElement ? usernameElement.value.toLowerCase() : "";
  let quoteStr:   string = quoteElement    ? quoteElement.value   : "";
  let pollStr:    string = pollElement     ? pollElement.value    : "";
  let commentStr: string = commentElement  ? commentElement.value : "";

  let tlElement: Del = (baseElement || document).querySelector("#timeline-posts");
  if (!tlElement) { return; }

  let queryParams: string = "";
  if (content) { queryParams += "&q=" + content; }
  if (cw) { queryParams += "&cw=" + cw; }
  if (username) { queryParams += "&user=" + username; }
  if (quoteStr === "true" || quoteStr === "false") { queryParams += "&quote=" + quoteStr; }
  if (pollStr === "true" || pollStr === "false") { queryParams += "&poll=" + pollStr; }
  if (commentStr === "true" || commentStr === "false") { queryParams += "&comment=" + commentStr; }
  queryParams = queryParams.slice(1);

  if (location.search !== "?" + queryParams && location.search !== queryParams) {
    if (queryParams) {
      history.pushState("search", "", `/search/?${queryParams}`);
    } else {
      history.pushState("search", "", "/search/");
    }
  }

  hookTimeline(
    tlElement,
    (baseElement || document).querySelector("#timeline-carousel"),
    {
      search_recent: { api: api_TimelineSearch, args: [queryParams, "new"], prependPosts: false, disableCaching: true, disablePolling: true },
      search_oldest: { api: api_TimelineSearch, args: [queryParams, "old"], prependPosts: false, disableCaching: true, disablePolling: true, invertOffset: true }
    },
    ((baseElement || document).querySelector("#timeline-carousel [data-timeline-active]") as el)?.dataset.timelineId || "search_recent",
    baseElement
  );
}

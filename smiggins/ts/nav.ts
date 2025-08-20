function urlToIntent(path: string): intent {
  if (!path.endsWith("/"))  { path += "/"; }
  if (!path.startsWith("/")) { path = "/" + path; }

  if (loggedIn) {
    switch (path) {
      case "/home/": history.pushState("home", "", "/");
      case "/": return "home";
    }
  } else {
    switch (path) {
      case "/": return "index";
      case "/login/": return "login";
      case "/signup/": return "signup";
    }
  }

  if (path === "/logout/") { return "logout"; }

  return "404";
}

function generateInternalLinks(element?: HTMLElement): void {
  if (!element) { element = container; }

  let links: NodeListOf<HTMLElement> = element.querySelectorAll("[data-internal-link]:not([data-link-processed])");

  for (const i of links) {
    i.dataset.linkProcessed = "";
    i.addEventListener("click", internalLinkHandler);
  }
}

function internalLinkHandler(e: MouseEvent): void {
  if (!e.ctrlKey) {
    let el: HTMLElement = e.currentTarget as HTMLElement;
    let newPage: intent = el.dataset.internalLink as intent;
    let newURL: string | null = (el as HTMLAnchorElement).href || null;

    if (newPage !== currentPage) {
      history.pushState(newPage, "", newURL);
      renderPage(newPage);
      currentPage = newPage;
    }

    e.preventDefault();
  }
}

onpopstate = function(e: PopStateEvent): void {
  currentPage = e.state as intent;
  renderPage(currentPage);
}

function urlToIntent(path: string): intent {
  path = normalizePath(path);

  if (loggedIn) {
    switch (path) {
      case "/home/": history.pushState("home", "", "/");
      case "/": return "home";
      case "/settings/": return "settings";
      case "/settings/profile/": return "settings/profile";
      case "/settings/cosmetic/": return "settings/cosmetic";
      case "/settings/account/": return "settings/account";
      case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "": return "user";
    }
  } else {
    switch (path) {
      case "/": return "index";
      case "/login/": return "login";
      case "/signup/": return "signup";
    }
  }

  switch (path) {
    case "/logout/": return "logout";
    default: return "404";
  }
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

function normalizePath(path: string): string {
  if (!path.endsWith("/"))  { path += "/"; }
  if (!path.startsWith("/")) { path = "/" + path; }

  return path.toLowerCase();
}

onpopstate = function(e: PopStateEvent): void {
  currentPage = e.state as intent;
  renderPage(currentPage);
}

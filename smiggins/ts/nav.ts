const container = document.getElementById("container") as HTMLDivElement;

function urlToIntent(path: string): intent {
  path = normalizePath(path);

  if (loggedIn) {
    switch (path) {
      case "/home/":
      case "/login/":
      case "/signup/": history.pushState("home", "", "/");
      case "/": return "home";

      case "/notifications/": return "notifications";

      case "/settings/": return "settings";
      case "/settings/profile/": return "settings/profile";
      case "/settings/cosmetic/": return "settings/cosmetic";
      case "/settings/keybinds/": return "settings/keybinds";
      case "/settings/account/": return "settings/account";
      case "/settings/about/": return "settings/about";

      case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "": return "user";
      case /^\/p\/[0-9]+\/$/.test(path) ? path : "": return "post";
      case /^\/tag\/[a-z0-9_]+\/$/.test(path) ? path : "": return "hashtag";
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

    if (newURL?.includes("//")) {
      newURL = "/" + newURL.split("//")[1].split("/").slice(1).join("/");
    }

    if (newURL && newPage === "post" && getPostIDFromPath(newURL) === getPostIDFromPath()) {
      createPostModal("comment", getPostIDFromPath());
    } else if (
      newPage !== currentPage
   || (newURL && newPage === "user" && getUsernameFromPath(newURL) !== getUsernameFromPath())
   || (newURL && newPage === "hashtag" && getHashtagFromPath(newURL) !== getHashtagFromPath())
    ) {
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

function renderPage(intent: intent): void {
  let extraVariables: { [key: string]: string | [string, number] } = {};
  let c: userData | undefined;

  switch (intent) {
    case "user":
      let u: string = getUsernameFromPath();
      c = userCache[u];
      extraVariables = {
        user_username: u,
        color_one: c && c.color_one || "var(--background-mid)",
        color_two: c && c.color_two || "var(--background-mid)",
        following: c && String(c.num_following) || "0",
        followers: c && String(c.num_followers) || "0",
        bio: c && [linkify(escapeHTML(c.bio)), 1] || "",
        display_name: c && [escapeHTML(c.display_name), 1] || u
      }; break;

    case "settings/profile":
      let defaultBanner: string = window.getComputedStyle(document.documentElement).getPropertyValue("--background-mid");
      c = userCache[username];
      extraVariables = {
        color_one: c && c.color_one || defaultBanner,
        color_two: c && c.color_two || defaultBanner,
        checked_if_gradient: !c || !c.color_one || !c.color_two || c.color_one === c.color_two ? "" : "checked",
        display_name: c && escapeHTML(c.display_name) || username,
        bio: c && escapeHTML(c.bio) || ""
      }; break;

    case "post":
      let pid: number = getPostIDFromPath();
      let p: post | undefined = postCache[pid];
      extraVariables = {
        pid: String(pid),
        parent: String(p && p.comment),
        hidden_if_comment: p && p.comment ? "hidden" : "",
        hidden_if_not_comment: p && p.comment ? "" : "hidden"
      }; break;

    case "hashtag":
      extraVariables = {
        tag: getHashtagFromPath()
      }; break;
  }

  if (tlPollingIntervalID) {
    clearInterval(tlPollingIntervalID);
    tlPollingIntervalID = null;
  }

  let snippet: HTMLDivElement = getSnippet(`pages/${intent}`, extraVariables);
  container.replaceChildren(snippet);
  document.title = getPageTitle(intent);
  currentPage = intent;

  resetNotificationIndicators();
}

function getPageTitle(intent: intent): string {
  switch (intent) {
    case "login": return "Log In - " + pageTitle;
    case "signup": return "Sign Up - " + pageTitle;
    case "logout": return "Log Out - " + pageTitle;
    case "404": return "Page Not Found - " + pageTitle;
    case "user": return getUsernameFromPath() + " - " + pageTitle;
    case "notifications": return "Notifications - " + pageTitle;

    case "index":
    case "home":
    case "post":
      return pageTitle;

    case "settings":
    case "settings/profile":
    case "settings/cosmetic":
    case "settings/keybinds":
    case "settings/account":
    case "settings/about":
      return "Settings - " + pageTitle;

    default: return intent + " - " + pageTitle;
  }
}

onpopstate = function(e: PopStateEvent): void {
  currentPage = e.state as intent;
  renderPage(currentPage);
}

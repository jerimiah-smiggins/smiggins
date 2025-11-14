const container = document.getElementById("container") as D;

function urlToIntent(path: string): intent {
  path = normalizePath(path);

  if (loggedIn) {
    switch (path) {
      case "/home/":
      case "/login/":
      case "/signup/": history.pushState("home", "", "/");
      case "/": return "home";

      case "/notifications/": return "notifications";
      case "/follow-requests/": return "follow-requests";

      case "/settings/": return "settings";
      case "/settings/profile/": return "settings/profile";
      case "/settings/cosmetic/": return "settings/cosmetic";
      case "/settings/keybinds/": return "settings/keybinds";
      case "/settings/account/": return "settings/account";
      case "/settings/about/": return "settings/about";

      case isAdmin && "/admin/": return "admin";

      case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "": return "user";
      case /^\/p\/[0-9]+\/$/.test(path) ? path : "": return "post";
      case /^\/tag\/[a-z0-9_]+\/$/.test(path) ? path : "": return "hashtag";
    }
  } else {
    switch (path) {
      case "/": return "index";
      case "/login/": return "login";
      case "/signup/": return "signup";

      case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "":
      case /^\/p\/[0-9]+\/$/.test(path) ? path : "":
        return "404-noauth";
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
      newPage !== currentPage || newPage === "post"
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

  return path.toLowerCase().split("?")[0];
}

function renderPage(intent: intent): void {
  let extraVariables: { [key: string]: string | [string, number] } = {};
  let c: userData | undefined;

  switch (intent) {
    case "home":
      extraVariables = {
        poll_items: getPollInputsHTML("home", "#post")
      }; break;

    case "user":
      let u: string = getUsernameFromPath();
      c = userCache[u];
      extraVariables = {
        color_one: c && c.color_one || "var(--background-mid)",
        color_two: c && c.color_two || "var(--background-mid)",
        following: c && floatintToStr(c.num_following) || "0",
        followers: c && floatintToStr(c.num_followers) || "0",
        bio: c && [linkify(escapeHTML(c.bio)), 1] || "",
        user_username: c && [escapeHTML(u + (c.pronouns ? " - " + c.pronouns : "")), 1] || u,
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

    case "404-noauth":
      extraVariables = {
        item: location.pathname.startsWith("/u/") ? "profile" : location.pathname.startsWith("/p/") ? "post" : "thing"
      };
  }

  if (tlPollingIntervalID) {
    clearInterval(tlPollingIntervalID);
    tlPollingIntervalID = null;
  }

  let snippet: D = getSnippet(`pages/${intent}`, extraVariables);
  container.replaceChildren(snippet);
  document.title = getPageTitle(intent);
  currentPage = intent;

  resetNotificationIndicators();
}

function getPageTitle(intent: intent): string {
  let notificationString: String = "";

  if (Object.values(pendingNotifications).some(Boolean)) {
    notificationString = "\u2022 ";
  }

  let val: null | string = intent + " - ";

  switch (intent) {
    case "login": val = "Log In - "; break;
    case "signup": val = "Sign Up - "; break;
    case "logout": val = "Log Out - "; break;
    case "404": val = "Page Not Found - "; break;
    case "404-noauth": val = "Not Logged In - "; break;
    case "user": val = getUsernameFromPath() + " - "; break;
    case "notifications": val = "Notifications - "; break;
    case "follow-requests": val = "Follow Requests - "; break;

    case "admin": val = "Administration - "; break;

    case "index":
    case "home":
    case "post":
      val = null; break;

    case "settings":
    case "settings/profile":
    case "settings/cosmetic":
    case "settings/keybinds":
    case "settings/account":
    case "settings/about":
      val = "Settings - "; break;
  }

  if (val) {
    return notificationString + val + pageTitle;
  }

  return notificationString + pageTitle;
}

onpopstate = function(e: PopStateEvent): void {
  currentPage = e.state as intent;
  renderPage(currentPage);
}

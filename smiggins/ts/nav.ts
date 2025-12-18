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
      case "/search/": return "search";
      case "/messages/": return "message-list";

      // these settings pages are only visible when logged in
      case "/settings/profile/": return "settings/profile";
      case "/settings/keybinds/": return "settings/keybinds";
      case "/settings/account/": return "settings/account";

      case isAdmin && "/admin/": return "admin";

      case /^\/tag\/[a-z0-9_]+\/$/.test(path) ? path : "": return "hashtag";
      case /^\/message\/[0-9]+\/$/.test(path) ? path : "": return "message";
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

    case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "": return "user";
    case /^\/p\/[0-9]+\/$/.test(path) ? path : "": return "post";

    case "/settings/": return "settings";
    case "/settings/cosmetic/": return "settings/cosmetic";
    case "/settings/about/": return "settings/about";

    case "/changes/all/":
    case /^\/changes\/[0-9]+\.[0-9]+\.[0-9]\/$/.test(path) ? path : "":
      return "changelog";

    default: return "404";
  }
}

function generateInternalLinks(element?: HTMLElement): void {
  if (!element) { element = container; }

  let links: NodeListOf<HTMLElement> = element.querySelectorAll("[data-internal-link]:not([data-link-processed])");

  for (const i of links) {
    i.dataset.linkProcessed = "";

    if (IS_IFRAME) {
      i.setAttribute("target", "_blank");
    } else {
      i.addEventListener("click", internalLinkHandler);
    }
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

function normalizePath(path: string, includeQueryParams?: true): string {
  if (!path.split("?")[0].endsWith("/"))  { path = path.split("?")[0] + "/" + path.split("?").slice(1).map((a: string): string => ("?" + a)); }
  if (!path.startsWith("/")) { path = "/" + path; }

  return includeQueryParams ? path.toLowerCase() : path.toLowerCase().split("?")[0];
}

function renderPage(intent: intent): void {
  let extraVariables: { [key: string]: string | [string, number] } = {};
  let c: UserData | undefined;

  clearModal();

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
        following: lr(L.user.following_count, { n: c && floatintToStr(c.num_following) || "0" }),
        followers: lr(L.user.followed_by_count, { n: c && floatintToStr(c.num_followers) || "0" }),
        post_count: lr(L.user.posts_count, { n: c && floatintToStr(c.num_posts) || "0" }),
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
        bio: c && escapeHTML(c.bio) || "",
        pronouns_presets: L.settings.profile.pronouns_presets.map((a: string): string => (`<option value="${a}">${a}</option>`)).join("")
      }; break;

    case "settings/account":
      extraVariables = {
        delete_account_confirmation: lr(L.settings.account.confirmation, {
          B: "<span class=\"warning\">",
          b: "</span>",
          u: `<b>@${username}</b>`
        })
      }; break;

    case "settings/about":
      let maintainerMap: (a: [string | null, string]) => string = (a: [string | null, string]): string => (a[0] ? `<li><a target="_blank" href="https://github.com/${a[0]}/">${escapeHTML(a[1])}</a></li>` : `<li>${escapeHTML(a[1])}</li>`);
      let translators: string = "";

      for (const i of Object.values(LANGS)) {
        translators += `<li><b>${escapeHTML(i.meta.name)}</b>:<ul class="no-margin-top">`;
        translators += `<li><div>${L.settings.about.maintainers}</div>`;

        if (i.meta.maintainers.length) {
          translators += `<ul class="no-margin-top">${i.meta.maintainers.map(maintainerMap)}</ul>`;
        } else {
          translators = translators.slice(0, translators.length - 6) + ` <i>${L.generic.none}</i></div>`;
        }

        translators += `</li>`;

        if (i.meta.past_maintainers.length) {
          translators += `<li>${L.settings.about.past_maintainers}<ul class="no-margin-top">${i.meta.past_maintainers.map(maintainerMap)}</ul></li>`;
        }

        translators += "</ul></li>";
      }

      extraVariables = {
        changes_link: lr(L.settings.about.past_changes, {
          h: `<a href="/changes/all/" data-internal-link="changelog">${L.settings.about.here}</a>`
        }),
        translator_credits: `<ul class="no-margin-top">${translators}</ul>`
      }; break;

    case "post":
      let pid: number = getPostIDFromPath();
      let p: Post | undefined = postCache[pid];
      extraVariables = {
        pid: String(pid),
        parent: String(p && p.comment),
        hidden_if_comment: p && p.comment ? "hidden" : "",
        hidden_if_not_comment: p && p.comment ? "" : "hidden",
        checked_if_private: defaultPostPrivate || p && p.private ? "checked" : ""
      }; break;

    case "hashtag":
      extraVariables = {
        tag: getHashtagFromPath()
      }; break;

    case "changelog":
      extraVariables = {
        changes: generateChangesHTML(location.pathname.split("/").filter(Boolean)[1])
      }; break;
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

  let val: null | string = intent;

  switch (intent) {
    case "login": val = L.titles.login; break;
    case "signup": val = L.titles.signup; break;
    case "logout": val = L.titles.logout; break;
    case "404": val = L.titles.not_found; break;
    case "user": val = getUsernameFromPath() + " - "; break;
    case "notifications": val = L.titles.notifications; break;
    case "follow-requests": val = L.titles.follow_requests; break;
    case "changelog": val = L.titles.changes; break;
    case "admin": val = L.titles.admin; break;
    case "search": val = L.titles.search; break;

    case "message-list":
    case "message":
      val = L.titles.messages; break;

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
      val = L.titles.settings; break;
  }

  if (val) {
    return notificationString + lr(L.titles.base, {
      l: val,
      n: pageTitle
    });
  }

  return notificationString + pageTitle;
}

onpopstate = function(e: PopStateEvent): void {
  currentPage = e.state as intent;
  renderPage(currentPage);
}

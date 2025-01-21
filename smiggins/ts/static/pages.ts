let hasHistoryBeenUsedYet: boolean = false;
let contextLoading: boolean = false;
const pageNotFound: "404" = "404";
const pages: { [key: string]: [() => string, (() => void) | null] } = {
  "404": [(): string => `<h1>${lang.http["404"].standard_title}</h1>${lang.http["404"].standard_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404_user": [(): string => `<h1>${lang.http["404"].user_title}</h1>${lang.http["404"].user_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404_post": [(): string => `<h1>${lang.http["404"].post_title}</h1>${lang.http["404"].post_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  index: [(): string => `
    <h1>${escapeHTML(conf.site_name)}</h1>
    <h3>${escapeHTML(conf.version)}</h3>
    ${conf.new_accounts === false ? lang.account.no_new + "<br>" : `<a data-link href='/signup/'>${lang.account.sign_up_title}</a> -`}
    <a data-link href='/login/'>${lang.account.log_in_title}</a>
    ${context.source ? `<br><br>
      <a href="https://github.com/jerimiah-smiggins/smiggins" target="_blank">${lang.generic.source_code}</a>` : ""}
    ${context.discord ? `<br>${context.source ? "" : "<br>"}
      <a href="https://discord.gg/${context.discord}" target="_blank">${lang.generic.discord}</a>` : ""}
  `, null],
  login: [(): string => `
    <h1>${ lang.account.log_in_title }</h1>
    <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
    <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br><br>
    <button id="submit">${lang.account.log_in_title}</button><br><br>
    <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    <a data-link href="/signup/">${lang.account.sign_up_instead}</a>
    ${conf.email ? `<br><a data-link href="/reset-password/">${lang.account.forgot_password}</a>` : ""}
  `, loginInit],
  signup: [(): string => `
    <h1>${lang.account.sign_up_title}</h1>
    ${conf.new_accounts === false ? escapeHTML(lang.account.no_new) + "<br><br>" : `
      <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
      <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br>
      <input id="confirm" placeholder="${lang.account.confirm_placeholder}" type="password"><br><br>
      ${conf.new_accounts === "otp" ? `
        <div>${lang.account.invite_code_info}</div>
        <input id="otp" placeholder="${lang.account.invite_code}" maxlength="32"><br>
      ` : ""}
      <button id="submit">${lang.account.sign_up_title}</button><br><br>
      <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    `}

    <a data-link href="/login/">${lang.account.log_in_instead}</a>
  `, signupInit]
};

function linkEventHandler(event: MouseEvent): void {
  // allow using ctrl to open in a new tab
  if (event.ctrlKey) { return; }

  event.preventDefault();

  // the element.href property automatically adds the whole url (ex. http://localhost:8000/login/ instead of /login/), which is why this is needed
  loadContext((event.target as HTMLAnchorElement).getAttribute("href"));
}

function renderPage(): void {
  document.title = `${context.strings[0] ? `${context.strings[0]} - ` : ""}${conf.site_name} ${conf.version}`;

  let page;
  if (pages[context.page]) {
    page = pages[context.page];
  } else {
    page = pages[pageNotFound];
  }

  dom("content").innerHTML = page[0]();

  for (const el of document.querySelectorAll("a[data-link]")) {
    el.addEventListener("click", linkEventHandler);
  }

  if (page[1]) {
    page[1]();
  }
}

function loadContext(url: string, postFunction: () => void=renderPage): void {
  if (contextLoading) {
    return;
  }

  contextLoading = true;

  fetch(`/api/init/context?url=${encodeURIComponent(url)}`)
    .then((response) => (response.json()))
    .then((json: {
      success: boolean,
      context: _context,
      message?: string,
      set_url?: string
    }) => {
      if (json.success) {
        context = json.context;
        let args: [_context, "", string?] = [context, ""];

        if (json.set_url) {
          args.push(json.set_url);
        } else if (url !== location.pathname) {
          args.push(url);
        }

        if (!hasHistoryBeenUsedYet) {
          history.replaceState(...args);
          hasHistoryBeenUsedYet = true;
        } else {
          history.pushState(...args);
        }

        contextLoading = false;
        postFunction();
      } else {
        // This should only happen if ratelimiting occurs
        contextLoading = false;
        toast(`${somethingWentWrong} ${json.message || ""}`, true);
      }
    })
    .catch((err: any) => {
      contextLoading = false;
      toast(`${somethingWentWrong} ${err}`, true);
    })
}

addEventListener("popstate", (e: PopStateEvent): void => {
  if (e.state) {
    context = e.state;
    renderPage();
  }
});

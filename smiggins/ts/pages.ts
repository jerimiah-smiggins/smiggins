function renderPage(intent: intent): void {
  let extraVariables: { [key: string]: string } = {};

  switch (intent) {
    case "user": extraVariables = {
      user_username: getUsernameFromPath(),
      display_name: getUsernameFromPath(),
      color_one: "var(--background-mid)",
      color_two: "var(--background-mid)",
      following: "0",
      followers: "0"
    }; break;
  }

  let snippet: HTMLDivElement = getSnippet(`pages/${intent}`, extraVariables);
  container.replaceChildren(snippet);
  document.title = getPageTitle(intent);
}

function getPageTitle(intent: intent): string {
  switch (intent) {
    case "index":
    case "home":
      return pageTitle;
    case "login": return "Log In - " + pageTitle;
    case "signup": return "Sign Up - " + pageTitle;
    case "logout": return "Log Out - " + pageTitle;
    case "404": return "Page Not Found - " + pageTitle;
    case "user": return getUsernameFromPath() + " - " + pageTitle;
    case "settings":
    case "settings/profile":
    case "settings/cosmetic":
    case "settings/account":
      return "Settings - " + pageTitle;
    default: return intent + " - " + pageTitle;
  }
}

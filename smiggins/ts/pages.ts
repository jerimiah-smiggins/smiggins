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
}

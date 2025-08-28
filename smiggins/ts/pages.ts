function renderPage(intent: intent): void {
  let extraVariables: { [key: string]: string } = {};

  switch (intent) {
    case "user": extraVariables = {
      user_username: location.pathname.split("/").filter(Boolean)[1],
      display_name: location.pathname.split("/").filter(Boolean)[1],
      color_one: "var(--background-mid)",
      color_two: "var(--background-mid)"
    }; break;
  }

  let snippet: HTMLDivElement = getSnippet(`pages/${intent}`, extraVariables);
  container.replaceChildren(snippet);
}

function renderPage(intent: intent): void {
  let snippet: HTMLDivElement = getSnippet(`pages/${intent}`);
  generateInternalLinks(snippet);
  container.replaceChildren(snippet);
}

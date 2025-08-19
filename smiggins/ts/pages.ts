function renderPage(intent: intent): void {
  let snippet: HTMLDivElement = getSnippet(intent);
  processInternalLinks(snippet);
  container.replaceChildren(snippet);
}

function createToast(
  title: string,
  content?: string,
  timeout?: number
): void {
  let toast: HTMLDivElement = getSnippet("toast", {
    title: title,
    content: content || ""
  });

  document.getElementById("toasts")?.append(toast);
  setTimeout((): void => (toast.remove()), timeout || 3000);
}

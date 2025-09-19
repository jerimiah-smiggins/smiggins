function createToast(
  title: string | null,
  content?: string,
  timeout?: number
): void {
  if (!title) { return; }

  let toast: HTMLDivElement = getSnippet("toast", {
    title: title,
    content: content || ""
  });

  document.getElementById("toasts")?.append(toast);
  toast.addEventListener("click", (): void => (toast.remove()));
  setTimeout((): void => (toast.remove()), timeout || 3000);
}

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
  toast.addEventListener("click", (): void => (toast.remove()));
  setTimeout((): void => (toast.remove()), timeout || 3000);
}

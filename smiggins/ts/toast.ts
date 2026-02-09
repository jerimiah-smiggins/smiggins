function createToast(
  title: string | null,
  content?: string,
  timeout?: number,
  type: "info" | "warning" | "error"="info"
): void {
  if (!title) { return; }

  let toast: D = getSnippet("toast", {
    title: title,
    content: content || "",
    type: type
  });

  document.getElementById("toasts")?.append(toast);
  toast.addEventListener("click", (): void => (toast.remove()));
  setTimeout((): void => (toast.remove()), timeout || 3000);
}

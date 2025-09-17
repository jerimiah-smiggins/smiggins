function getPostIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function p_postPage(element: HTMLDivElement): void {
  let pid: number = getPostIDFromPath();
  let p: post | undefined = postCache[pid];
  let postElement: HTMLElement | null = element.querySelector("#focused-post");

  if (p && postElement) {
    postElement.replaceChildren(getPost(pid, false));
  }
}

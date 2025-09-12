const keybinds: { [key: string]: (e?: KeyboardEvent) => void } = {
  n: (): void => { createPostModal(); }
}

function keyHandler(e: KeyboardEvent): void {
  let el: HTMLElement | null = e.target as HTMLElement | null;

  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) { return; }

  if (e.key in keybinds) {
    keybinds[e.key](e);
    e.preventDefault();
  }
}

onkeydown = keyHandler;

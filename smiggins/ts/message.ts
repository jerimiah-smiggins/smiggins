let forwardOffset: number = 0;
let reverseOffset: number = 0;
u_for = document.body.dataset.username;
c = 0;

home = true;

function refreshMessages(start=false, forward=true): void {
  let params: {
    username: string,
    forward: boolean,
    offset: number
  } = {
    username: u_for,
    forward: start || forward,
    offset: start ? -1 : forward ? forwardOffset : reverseOffset
  };

  if (start) {
    dom("messages-go-here-btw").innerHTML = "";
    forwardOffset = 0;
    reverseOffset = 0;
  }

  if (c) {
    return;
  }

  c++;

  s_fetch(`/api/messages?username=${params.username}&forward=${params.forward}&offset=${params.offset}`, {
    extraData: {
      start: start
    },
    postFunction: (success: boolean) => {
      --c;
    }
  });
}

dom("your-mom").onkeydown = (event: KeyboardEvent): void => {
  let self: HTMLInputElement = dom("your-mom") as HTMLInputElement;

  if ((event.key === "Enter") && !event.shiftKey) {
    event.preventDefault();

    if (self.value) {
      s_fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          content: self.value,
          username: u_for
        }),
        disable: [dom("your-mom")],
      });
    }
  }
}

setInterval(
  () => {
    if (!document.visibilityState || document.visibilityState == "visible") {
      refreshMessages(false, false);
    }
  }, 10 * 1000
);

refreshMessages(true);

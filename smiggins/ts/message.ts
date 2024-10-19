let forwardOffset: number = 0;
let reverseOffset: number = 0;
let username: string = document.body.dataset.username;
c = 0;

home = true;

function refreshMessages(start=false, forward=true): void {
  c++;

  let params: {
    username: string,
    forward: boolean,
    offset: number
  } = {
    username: username,
    forward: start || forward,
    offset: start ? -1 : forward ? forwardOffset : reverseOffset
  };

  if (start) {
    dom("messages-go-here-btw").innerHTML = "";
    forwardOffset = 0;
    reverseOffset = 0;
  }

  fetch(`/api/messages?username=${params.username}&forward=${params.forward}&offset=${params.offset}`)
    .then((response: Response) => response.json())
    .then((json: {
      messages?: {
        content: string,
        from_self: boolean,
        id: number,
        timestamp: number
      }[],
      more: boolean,
      success: boolean
    }) => {
      --c;

      if (!c && json.success) {
        let x: DocumentFragment = document.createDocumentFragment();
        for (const message of json.messages) {
          let y: HTMLElement = document.createElement("div");
          y.setAttribute("class", `message ${message.from_self ? "send" : "receive"}`);
          y.innerHTML = `<div>${linkifyHtml(escapeHTML(message.content), {
            formatHref: {
              mention: (href: string): string => "/u" + href,
              hashtag: (href: string): string => "/hashtag/" + href.slice(1)
            },
          })}</div><span class="timestamp">${timeSince(message.timestamp)}</span>`;

          x.append(y);

          if (forward || start) {
            if (message.id < forwardOffset || forwardOffset == 0) {
              forwardOffset = message.id;
            }
          }
          if (!forward || start) {
            if (message.id > reverseOffset || reverseOffset == 0) {
              reverseOffset = message.id;
            }
          }
        }

        if (forward) {
          if (dom("more")) {
            dom("more").remove();
          }

          if (json.more) {
            let y: HTMLButtonElement = document.createElement("button");
            y.innerText = lang.generic.load_more;
            y.id = "more";
            y.setAttribute("onclick", "refreshMessages();");

            x.append(y);
          }

          dom("messages-go-here-btw").append(x);
        } else {
          dom("messages-go-here-btw").prepend(x);
        }
      }
    })
    .catch((err: Error) => {
      --c;
    });
}

dom("your-mom").onkeydown = (event: KeyboardEvent): void => {
  let self: HTMLInputElement = dom("your-mom") as HTMLInputElement;

  if ((event.key === "Enter" || event.keyCode === 18)) {
    event.preventDefault();

    if (self.value) {
      self.setAttribute("disabled", "");

      fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          content: self.value,
          username: username
        })
      }).then((response: Response) => response.json())
        .then((json: {
          success: boolean
        }) => {
          if (json.success) {
            if (dom("messages-go-here-btw").innerText == "") {
              refreshMessages(true);
            } else {
              refreshMessages(false, false);
            }
            self.value = "";
          }

          self.removeAttribute("disabled");
          self.focus();
        }).catch((err: Error) => {
          self.removeAttribute("disabled");
          self.focus();
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

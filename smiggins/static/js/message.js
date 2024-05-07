// Handle:
// - Sending
// - Refreshing
// - Load more button
// - Displaying

let forwardOffset = 0, reverseOffset = 0;
let home = true;
let username = document.body.dataset.username;

function refresh(start=false, forward=true) {
  let params = {
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
    .then((response) => response.json())
    .then((json) => {
      if (json.success) {
        x = document.createDocumentFragment();
        for (const message of json.messages) {
          y = document.createElement("div");
          y.setAttribute("class", `message ${message.from_self ? "send" : "receive"}`);
          y.innerHTML = `<div>${linkifyHtml(escapeHTML(message.content), {
            formatHref: { mention: (href) => fakeMentions ? "#" : "/u" + href }
          })}</div><span class="timestamp">${timeSince(message.timestamp)} ago</span>`;

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
            y = document.createElement("button");
            y.innerText = "Load more...";
            y.id = "more";
            y.setAttribute("onclick", "refresh();");

            x.append(y);
          }

          dom("messages-go-here-btw").append(x);
        } else {
          dom("messages-go-here-btw").prepend(x);
        }
      }
    });
}

dom("your-mom").setAttribute("maxlength", MAX_POST_LENGTH);

dom("your-mom").onkeydown = (event) => {
  let self = dom("your-mom");

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
      }).then((response) => response.json())
        .then((json) => {
          if (json.success) {
            if (dom("messages-go-here-btw").innerText == "") {
              refresh(true);
            } else {
              refresh(false, false);
            }
            self.value = "";
          }

          self.removeAttribute("disabled");
          self.focus();
        }).catch((err) => {
          self.removeAttribute("disabled");
          self.focus();
        });
    }
  }
}

setInterval(
  () => {
    if (!document.visibilityState || document.visibilityState == "visible") {
      refresh(false, false);
    }
  }, 15 * 1000
);

refresh(true);

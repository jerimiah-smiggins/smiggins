home = true;
offset = -1;

function refreshMessageList(fromStart=false): void {
  dom("refresh").setAttribute("disabled", "");
  dom("more").setAttribute("disabled", "");

  if (fromStart) {
    offset = -1;
    dom("recent-list").innerHTML = "";
  } else {
    offset++;
    if (!offset) {
      offset++;
    }
  }

  fetch(`/api/messages/list?offset=${offset}`)
    .then((response: Response) => response.json())
    .then((json: {
      messages: {
        badges: string[],
        color_one: string,
        content: string,
        display_name: string,
        gradient_banner: boolean,
        timestamp: number,
        unread: boolean,
        username: string,
      }[],
      more: boolean,
      success: boolean
    }) => {
      if (json.success) {
        let x: DocumentFragment = document.createDocumentFragment();
        for (const message of json.messages) {
          let y: HTMLElement = document.createElement("div");
          y.innerHTML += `
            <div class="post" data-color="${message.unread ? "" : "gray"}">
              <div class="upper-content">
                <a href="/u/${message.username}" class="no-underline text">
                  <div class="displ-name">
                    <div style="--color-one: ${message.color_one}; --color-two: ${message[ENABLE_GRADIENT_BANNERS && message.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></div>
                    ${escapeHTML(message.display_name)}
                    ${message.badges.length && !NO_CSS_MODE ? `<span aria-hidden="true" class="user-badge">${message.badges.map((icon) => (badges[icon])).join("</span> <span aria-hidden=\"true\" class=\"user-badge\">")}</span>` : ""}<br>
                    <span class="upper-lower-opacity">
                      <div class="username">@${message.username}</div>
                      ${message.timestamp || message.content ? `- <div class="username">${timeSince(message.timestamp)}</div>` : ""}
                    </span>
                  </div>
                </a>
              </div>

              <div class="main-content">
                <a href="/m/${message.username}" class="no-underline text">
                  ${message.timestamp || message.content ? escapeHTML(message.content) : `<i>${lang.messages.no_messages}</i>`}
                </a>
              </div>
            </div><br>`;
          x.append(y);
        }

        dom("recent-list").append(x);
        dom("refresh").removeAttribute("disabled");
        dom("more").removeAttribute("disabled");

        if (json.more) {
          dom("more").removeAttribute("hidden");
        } else {
          dom("more").setAttribute("hidden", "");
        }
      }
    })
    .catch((err: Error) => {
      showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.messages.error));
      dom("refresh").removeAttribute("disabled");
      dom("more").removeAttribute("disabled");
    });
}

refreshMessageList(true);

let home = true;
let offset = -1;
let count = 0;

showlog = (string, timer=3000) => {
  dom("error").innerText = string;
  count++;

  setTimeout(() => {
    --count;
    if (!count) {
      dom("error").innerHTML = "";
    }
  }, timer);
};

function refresh(from_start=false) {
  dom("refresh").setAttribute("disabled", "");
  dom("more").setAttribute("disabled", "");

  if (from_start) {
    offset = -1;
    dom("recent-list").innerHTML = "";
  } else {
    offset++;
    if (!offset) {
      offset++;
    }
  }

  fetch(`/api/messages/list?offset=${offset}`)
    .then((response) => response.json())
    .then((json) => {
      if (json.success) {
        x = document.createDocumentFragment();
        for (const message of json.messages) {
          console.log(message);
          y = document.createElement("div");
          y.innerHTML += `
            <div class="post" data-color="${message.unread ? "" : "gray"}">
              <div class="upper-content">
                <a href="/u/${message.username}" class="no-underline text">
                  <div class="displ-name">
                    <div style="--color-one: ${message.color_one}; --color-two: ${message[ENABLE_GRADIENT_BANNERS && message.gradient_banner ? "color_two" : "color_one"]}" class="user-badge banner-pfp"></div>
                    ${escapeHTML(message.display_name)}
                    ${message.private ? `<span class="user-badge">${icons.lock}</span>` : ""}
                    ${message.badges.length ? `<span class="user-badge">${message.badges.map((icon) => (badges[icon])).join("</span> <span class=\"user-badge\">")}</span>` : ""}<br>
                    <span class="upper-lower-opacity">
                      <div class="username">@${message.username}</div>
                      ${message.timestamp || message.content ? `- <div class="username">${timeSince(message.timestamp)} ago</div>` : ""}
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
    .catch((err) => {
      showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.messages.error));
      dom("refresh").removeAttribute("disabled");
      dom("more").removeAttribute("disabled");
    });
}

refresh(true);

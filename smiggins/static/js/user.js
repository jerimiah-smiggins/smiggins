let inc = 0, req = 0, end = false;
let offset = null;
let username = document.querySelector("body").getAttribute("data-username");
let first = true;

if (!logged_in) {
  dom("icons").setAttribute("hidden", "");
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
}

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/post/user/${document.querySelector("body").getAttribute("data-username")}${force_offset === true && !end ? `?offset=${offset}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then((response) => (response.json()))
    .then((json) => {
      document.querySelectorAll(".priv").forEach((val, index) => {
        val.innerHTML = icons.lock;
      });

      if (json.private && true) {
        document.querySelectorAll("[data-toggle-on-priv]").forEach((val, index) => {
          if (val.hasAttribute("hidden")) { val.removeAttribute("hidden"); }
          else { val.setAttribute("hidden", ""); }
        });

        if (json.can_view) {
          document.querySelectorAll("[data-toggle-on-view]").forEach((val, index) => {
            if (val.hasAttribute("hidden")) { val.removeAttribute("hidden"); }
            else { val.setAttribute("hidden", ""); }
          });
        }

        first = false;
      }

      dom("follow").innerText = `Followers: ${json.followers} - Following: ${json.following}`;

      end = json.end;
      dom("banner").style.backgroundColor = json.color;

      for (const post in json.posts) {
        dom("posts").innerHTML += `
        <div class="post-container" data-post-id="${json.posts[post].post_id}">
          <div class="post">
            <div class="upper-content">
              <div class="displ-name">${escapeHTML(json.posts[post].display_name)}</div>
              <span class="upper-lower-opacity"> -
                <div class="username">@${json.posts[post].creator_username}</div> -
                <div class="timestamp">${timeSince(json.posts[post].timestamp)} ago</div>
              </span>
            </div>
            <div class="main-content">
            <a href=/p/${json.posts[post].post_id} class="text no-underline">
              ${
                linkifyHtml(
                  json.posts[post].content, {
                    formatHref: {
                      mention: (href) => "/u" + href,
                    }
                  }
                )
                .replaceAll("\n", "</br>")
                .replaceAll("<a", "  \n")
                .replaceAll("</a>", `</a><a href=/p/${json.posts[post].post_id} class="text no-underline">`)
                .replaceAll(`<a href=/p/${json.posts[post].post_id} class="text no-underline"></a>`, "")
                .replaceAll("  \n", "</a><a")
              }
          </a>
            </div>
            <div class="bottom-content">
              <a href="/p/${json.posts[post].post_id}" class="text no-underline">
                <div class="comment">${icons.comment}</div><span class="comment-number">${json.posts[post].comments}</span>
              </a>
              <div class="bottom-spacing"></div>
              <div class="like" data-liked="${json.posts[post].liked}"${logged_in ? ` onclick="toggleLike(${json.posts[post].post_id})"` : ""}>
                ${json.posts[post].liked ? icons.like : icons.unlike}
              </div>
              <span class="like-number">${json.posts[post].likes}</span>
            </div>
          </div>
        </div>`;
        offset = json.posts[post].post_id;
      }

      if (force_offset !== true && logged_in) { dom("more").removeAttribute("hidden"); }
      if (json.end && logged_in) { dom("more").setAttribute("hidden", ""); } else if (logged_in) { dom("more").removeAttribute("hidden"); }
    })
    .catch((err) => {
      inc++;
      dom("error").innerText = "Something went wrong loading the posts! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 5000);
      throw(err);
    });
}

function toggle_follow() {
  let x = dom("toggle").getAttribute("data-followed") === "1";
  fetch(`/api/user/follower`, {
    method: x ? "DELETE" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "username": document.querySelector("body").getAttribute("data-username")
    })
  })
    .then((response) => (response.json()))
    .then((json) => {
      dom("toggle").setAttribute("data-followed", x ? "0" : "1");
      dom("toggle").innerText = x ? "Follow" : "Unfollow";
    })
    .catch((err) => {
      inc++;
      dom("error").innerText = "Something went wrong loading the posts! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 5000);
      throw(err);
    });
}

function toggleLike(post_id) {
  let q = document.querySelector(`div[data-post-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-post-id="${post_id}"] div.like`);
  if (h.dataset["liked"] == "true") {
    fetch("/api/post/like", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    h.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/post/like", {
      "method": "POST",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "true");
    h.innerHTML = icons.like;
    q.innerHTML = +q.innerHTML + 1;
  }
}

refresh();

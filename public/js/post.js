dom("timestamp").innerHTML = timeSince(
  Number(dom("timestamp").getAttribute("data-timestamp"))
);

let inc = 0, req = 0, end = false;
let offset = null;
let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") { page = "following"; }

if (!logged_in) {
  dom("icons").setAttribute("hidden", "");
  dom("more-container").innerHTML = "<a href=\"/signup\">Sign up</a> to see more!";
  dom("post-text").setAttribute("hidden", "");
  dom("post").setAttribute("hidden", "");
  dom("hide-me").setAttribute("hidden", "");
}

dom("post-text").addEventListener("input", function() {
  while (this.value.indexOf("  ") !== -1) { this.value = this.value.replaceAll("  ", " "); }
})

dom("post").addEventListener("click", function() {
  if (dom("post-text").value) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");
    fetch("/api/comment/create", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: comment ? JSON.stringify({
        "content": dom("post-text").value,
        "id": post_id,
        "comment": 1
      }):  JSON.stringify({
        "content": dom("post-text").value,
        "id": post_id
      })
    })
      .then((response) => {
        if (response.status == 429) {
          dom("post").removeAttribute("disabled");
          dom("post-text").removeAttribute("disabled");
          inc++;
          dom("error").innerText = "You are being ratelimited! Try again in a few moments...";
          setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        } else {
          response.json().then((json) => {
            if (json.success) {
              dom("post-text").value = "";
              refresh();
            } else {
              dom("post").removeAttribute("disabled");
              dom("post-text").removeAttribute("disabled");
              inc++;
              dom("error").innerText = "Something went wrong! Try again in a few moments...";
              setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
            }
          })
        }
      })
      .catch((err) => {
        dom("post").removeAttribute("disabled");
        dom("post-text").removeAttribute("disabled");
        inc++;
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
        setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        throw(err);
      });
  }
});

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/comments?id=${post_id}${comment ? "&comment=1" : ""}${force_offset === true && !end ? `&offset=${offset}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then((response) => (response.json()))
    .then((json) => {
      end = json.end;
      for (const post in json.posts) {
        dom("posts").innerHTML += `
        <div class="post-container" data-comment-id="${json.posts[post].post_id}">
          <div class="post">
            <div class="upper-content">
              <a href="/u/${json.posts[post].creator_username}" class="text no-underline">
                <div class="displ-name">${escapeHTML(json.posts[post].display_name)}${json.posts[post].private_acc ? ` <div class="priv">${icons.lock}</div>` : ""}</div>
                <span class="upper-lower-opacity"> -
                  <div class="username">@${json.posts[post].creator_username}</div> -
                  <div class="timestamp">${timeSince(json.posts[post].timestamp)} ago</div>
                </span>
              </a>
            </div>
            <div class="main-content">
              ${linkifyText(json.posts[post].content, json.posts[post].post_id, true).replaceAll("\n", "<br>")}
            </div>
            <div class="bottom-content">
              <a href="/c/${json.posts[post].post_id}" class="text no-underline">
                <div class="comment">${icons.comment}</div><span class="comment-number">${json.posts[post].comments}</span>
              </a>
              <div class="bottom-spacing"></div>
              <div class="like" data-liked="${json.posts[post].liked}" onclick="toggleLike(${json.posts[post].post_id})">
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

      dom("post").removeAttribute("disabled")
      dom("post-text").removeAttribute("disabled")
    })
    .catch((err) => {
      dom("post").removeAttribute("disabled")
      dom("post-text").removeAttribute("disabled")
      inc++;
      dom("error").innerText = "Something went wrong loading the posts! Try again in a few moments...";
      setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 5000);
      throw(err);
    });
}

function toggleLike(post_id) {
  let q = document.querySelector(`div[data-comment-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-comment-id="${post_id}"] div.like`);
  if (h.dataset["liked"] == "true") {
    fetch("/api/comment/like/remove", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    h.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/comment/like/add", {
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


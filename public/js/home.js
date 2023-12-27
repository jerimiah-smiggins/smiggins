let inc = 0, req = 0, end = false;
let offset = null;
let page = localStorage.getItem("home-page");
if (page !== "following" && page !== "recent") { page = "following"; }

dom("switch").innerText = "Switch to " + (page == "recent" ? "following" : "recent") + "...";

dom("post-text").addEventListener("input", function() {
  while (this.value.indexOf("  ") !== -1) { this.value = this.value.replaceAll("  ", " "); }
  if (this.value.length > 280) { this.value = this.value.slice(0, 280); }
})

dom("post").addEventListener("click", function() {
  if (dom("post-text").value) {
    this.setAttribute("disabled", "");
    dom("post-text").setAttribute("disabled", "");
    fetch("/api/post/create", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "content": dom("post-text").value
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

dom("add").addEventListener("click", function() {
  if (dom("add-follower").value) {
    dom("add-follower").setAttribute("disabled", "");
    dom("add").setAttribute("disabled", "");
    fetch("/api/user/follower/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "username": dom("add-follower").value
      })
    })
      .then((response) => (response.json()))
      .then((json) => {
        if (!json.success) {
          inc++;
          dom("error").innerText = "Something went wrong! Try again in a few moments...";
          setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        } else {
          dom("add-follower").value = "";
          refresh();
        }
        dom("add-follower").removeAttribute("disabled");
        dom("add").removeAttribute("disabled");
      })
      .catch((err) => {
        dom("add-follower").removeAttribute("disabled");
        dom("add").removeAttribute("disabled");
        inc++;
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
        setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        throw(err);
      });
  }
})

dom("remove").addEventListener("click", function() {
  if (dom("add-follower").value) {
    dom("add-follower").setAttribute("disabled", "");
    dom("remove").setAttribute("disabled", "");
    fetch("/api/user/follower/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "username": dom("add-follower").value
      })
    })
      .then((response) => (response.json()))
      .then((json) => {
        if (!json.success) {
          inc++;
          dom("error").innerText = "Something went wrong! Try again in a few moments...";
          setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        } else {
          dom("add-follower").value = "";
          refresh();
        }
        dom("add-follower").removeAttribute("disabled");
        dom("remove").removeAttribute("disabled");
      })
      .catch((err) => {
        dom("add-follower").removeAttribute("disabled");
        dom("remove").removeAttribute("disabled");
        inc++;
        dom("error").innerText = "Something went wrong! Try again in a few moments...";
        setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
        throw(err);
      });
  }
})

dom("switch").addEventListener("click", function() {
  page = page == "following" ? "recent" : "following"
  localStorage.setItem("home-page", page);
  dom("switch").innerHTML = "Switch to " + (page == "recent" ? "following" : "recent") + "...";
  refresh();
})

function refresh(force_offset=false) {
  if (force_offset !== true) { dom("posts").innerHTML = ""; }

  fetch(`/api/post/${page == "following" ? "following" : "recent"}${force_offset === true && !end ? `?offset=${offset}` : ""}`, {
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
        <div class="post-container" data-post-id="${json.posts[post].post_id}">
          <div class="post">
            <div class="upper-content">
              <a href="/u/${json.posts[post].creator_username}" class="no-underline text">
                <div class="displ-name">${escapeHTML(json.posts[post].display_name)}</div>
                <span class="upper-lower-opacity"> -
                  <div class="username">@${json.posts[post].creator_username}</div> -
                  <div class="timestamp">${timeSince(json.posts[post].timestamp)} ago</div>
                </span>
              </a>
            </div>
            <div class="main-content">
              ${linkifyText(json.posts[post].content, json.posts[post].post_id).replaceAll("\n", "<br>")}
            </div>
            <div class="bottom-content">
              <div class="like" data-liked="${json.posts[post].liked}" onclick="toggleLike(${json.posts[post].post_id})">
                ${json.posts[post].liked ? icons.like : icons.unlike}
              </div>
              <span class="like-number">${json.posts[post].likes}</span>
            </div>
          </div>
        </div>`;
        offset = json.posts[post].post_id;
      }

      if (force_offset !== true) { dom("more").removeAttribute("hidden"); }
      if (json.end) { dom("more").setAttribute("hidden", ""); } else { dom("more").removeAttribute("hidden"); }

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
  let q = document.querySelector(`div[data-post-id="${post_id}"] span.like-number`);
  let h = document.querySelector(`div[data-post-id="${post_id}"] div.like`);
  if (h.dataset["liked"] == "true") {
    fetch("/api/post/like/remove", {
      "method": "DELETE",
      "body": JSON.stringify({
        "id": post_id
      })
    });
    h.setAttribute("data-liked", "false");
    h.innerHTML = icons.unlike;
    q.innerHTML = +q.innerHTML - 1;
  } else {
    fetch("/api/post/like/add", {
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

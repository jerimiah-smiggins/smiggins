let inc = 0, req = 0, end = false;
let offset = null;
let username = document.querySelector("body").getAttribute("data-username");
let home = true;

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
      end = json.end;
      dom("banner").style.backgroundColor = json.color;
      for (const post in json.posts) {
        dom("posts").innerHTML += `
        <div class="post-container">
          <div class="post">
            <div class="upper-content">
              <div class="displ-name">${escapeHTML(json.posts[post].display_name)}</div>
              <span class="upper-lower-opacity"> -
                <div class="username">@${json.posts[post].creator_username}</div> -
                <div class="timestamp">${timeSince(json.posts[post].timestamp)} ago</div>
              </span>
            </div>
            <div class="main-content">
              ${linkifyText(escapeHTML(json.posts[post].content).replaceAll("\n", "<br>"), json.posts[post].post_id)}
            </div>
          </div>
        </div>`;
        offset = json.posts[post].post_id;
      }

      if (force_offset !== true) { dom("more").removeAttribute("hidden"); }
      if (json.end) { dom("more").setAttribute("hidden", ""); }
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
  fetch(`/api/user/follower/${x ? "remove" : "add"}`, {
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

refresh();

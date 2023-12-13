let inc = 0, req = 0, end = false;

dom("post-text").addEventListener("input", function() {
  if (this.value.length > 280) {
    this.value = this.value.slice(0, 280);
  }
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
      .then((response) => (response.json()))
      .then((json) => {
        if (json.success) {
          dom("post-text").value = "";
          refresh();
        } else {
          dom("post").removeAttribute("disabled");
          dom("post-text").removeAttribute("disabled");
          inc++;
          dom("error").innerText = "Something went wrong! Try again in a few moments...";
          setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, 3000);
          throw(err);
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
  dom("add-follower").setAttribute("disabled", "");
  dom("add").setAttribute("disabled", "");
  if (dom("add-follower").value) {
    fetch("/api/user/follower/add", {
      method: "PUT",
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

function refresh() {
  dom("posts").innerHTML = "";

  fetch("/api/post/following", {
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
        <div class="post-container">
          <div class="post">
            <div class="upper-content">
              <div class="username">@${json.posts[post].creator_username}</div> -
              <div class="timestamp">${timeSince(json.posts[post].timestamp)} ago</div>
            </div>
            <div class="main-content">${json.posts[post].content}</div>
          </div>
        </div>`;
      }
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

refresh();
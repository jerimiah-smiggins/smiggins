let inc = 0, req = 0;
let home = true;

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

// Level 1
level >= 1 && dom("post-delete").addEventListener("click", function() {
  fetch(`/api/${dom("comment-toggle").checked ? "comment" : "post"}`, {
    method: "DELETE",
    body: JSON.stringify({
      "id": Number(dom("post-id").value)
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong deleting the specified post/comment! Maybe it doesn't exist?", 5000);
      }
    });
});

// Level 2
level >= 2 && dom("account-delete").addEventListener("click", function() {
  fetch("/api/admin/user", {
    method: "DELETE",
    body: JSON.stringify({
      identifier: dom("account-del-identifier").value,
      use_id: dom("delete-id-toggle").checked
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong deleting the specified account! Maybe it doesn't exist?", 5000);
      }
    });
});

// Level 3
level >= 3 && dom("badge-add").addEventListener("click", function() {
  fetch("/api/admin/badge", {
    method: "POST",
    body: JSON.stringify({
      identifier: dom("badge-identifier").value,
      use_id: dom("badge-use-id").checked,
      badge_name: dom("badge-name").value
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong! Maybe the user doesn't exist?");
      }
    });
});

level >= 3 && dom("badge-remove").addEventListener("click", function() {
  fetch("/api/admin/badge", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: dom("badge-identifier").value,
      use_id: dom("badge-use-id").checked,
      badge_name: dom("badge-name").value
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong! Maybe the user doesn't exist?");
      }
    });
});

level >= 3 && dom("badge-create").addEventListener("click", function() {
  fetch("/api/admin/badge", {
    method: "PUT",
    body: JSON.stringify({
      badge_name: dom("badge-create-name").value,
      badge_data: dom("badge-create-data").value
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success! Reload for your changes to apply!");
      } else {
        showlog("Something went wrong! Reason: " + json.reason);
      }
    });
});

level >= 3 && dom("badge-delete").addEventListener("click", function() {
  fetch("/api/admin/badge", {
    method: "DELETE",
    body: JSON.stringify({
      badge_name: dom("badge-delete-name").value
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong! Reason: " + json.reason);
      }
    });
});

// Level 4
level >= 4 && dom("data-get").addEventListener("click", function() {
  fetch(`/api/admin/info?identifier=${dom("data-identifier").value}&use_id=${dom("data-use-id").checked}`)
    .then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        dom("data-section").innerHTML = `
          Current account: <a href="/u/${json.username}"><code>@${json.username}</code></a> (id: ${json.user_id})<br>
          <input maxlength="300" id="data-display-name" placeholder="Display name..." value="${escapeHTML(json.displ_name || "")}"><br>
          <textarea maxlength="65536" id="data-bio" placeholder="User bio...">${escapeHTML(json.bio || "")}</textarea><br>
          <button id="data-save" data-user-id="${json.user_id}">Save info</button><br>
          <button id="data-switcher" data-token="${json.token}" data-username="${json.username}">Add to account switcher</button>
        `;

        dom("data-display-name").addEventListener("input", postTextInputEvent);
        dom("data-bio").addEventListener("input", postTextInputEvent);

        dom("data-switcher").addEventListener("click", function() {
          let username = this.dataset.username;
          let token = this.dataset.token;
          let accounts = JSON.parse(localStorage.getItem("acc-switcher") || "[]");

          if (!accounts.includes([username, token])) {
            accounts.push([username, token]);
            localStorage.setItem("acc-switcher", JSON.stringify(accounts));
          }

          showlog("Success!");
        });

        dom("data-save").addEventListener("click", function() {
          fetch("/api/admin/save-acc", {
            method: "PATCH",
            body: JSON.stringify({
              id: this.dataset.userId,
              bio: dom("data-bio").value,
              displ_name: dom("data-display-name").value
            })
          }).then((response) => (response.json()))
            .then((json) => {
              if (json.success) {
                showlog("Saved!");
              } else {
                showlog(`Something went wrong! ${json.reason}`);
              }
            });
        });
      } else {
        showlog(`Something went wrong! ${json.reason}`);
      }
    })
});

level >= 4 && dom("debug-button").addEventListener("click", function() {
  this.setAttribute("disabled", "");

  fetch("/api/admin/logs")
    .then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        let lines = json.content.split("\n");

        output = "<table class=\"bordered\"><tr><th>Timestanp</th><th>Action</th><th>Who</th><th>More Info</th></tr>"
        for (const line of lines) {
          try {
            output += `<tr><td>${timeSince(line.split(" ", 2)[0])}</td><td>${line.split(",", 2)[0]}</td><td>${line.split(",", 2)[1].split(") - ", 2)[0]})</td><td>${escapeHTML(line.split(",", 2)[1].split(") - ", 2)[1])}</td></tr>`;
          } catch(err) {
            //
          }
        }

        dom("debug").innerHTML = output + "</table>";
      } else {
        showlog("Something went wrong loading the logs!");
        this.removeAttribute("disabled");
      }
    }).catch((err) => {
      showlog("Something went wrong loading the logs!");
      this.removeAttribute("disabled")
    });
});

// Level 5
level >= 5 && dom("level-set").addEventListener("click", function() {
  fetch("/api/admin/level", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: dom("level-identifier").value,
      use_id: dom("level-use-id").checked,
      level: dom("level-selection").value
    })
  }).then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        showlog("Success!");
      } else {
        showlog("Something went wrong setting that account's level! Maybe it doesn't exist?", 5000);
      }
    });
});

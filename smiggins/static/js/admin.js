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
// ...

// Level 4
level >= 4 && dom("data-get").addEventListener("click", function() {
  fetch(`/api/admin/info?identifier=${dom("data-identifier").value}&use_id=${dom("data-use-id").checked}`)
    .then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        dom("data-section").innerHTML = `
          Current account: <code>${json.username}</code> (id: ${json.user_id})<br>
          <input id="data-display-name" placeholder="Display name..." value="${escapeHTML(json.displ_name || "")}"><br>
          <textarea id="data-bio" placeholder="User bio...">${escapeHTML(json.bio || "")}</textarea><br>
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
        showlog("Something went wrong deleting the specified account! Maybe it doesn't exist?", 5000);
      }
    });
});

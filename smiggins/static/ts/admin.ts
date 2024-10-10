declare const adminLevel: number;

inc = 0;
home = true;

enum Mask {
  DeletePost,
  DeleteUser,
  CreateBadge,
  DeleteBadge,
  GiveBadges,
  ModifyAccount,
  AccSwitcher,
  AdminLevel,
  ReadLogs
};

function testMask(identifier: number, level: number=adminLevel): boolean {
  return !!(level >> identifier & 1);
}

ENABLE_POST_DELETION && testMask(Mask.DeletePost) && dom("post-delete").addEventListener("click", function(): void {
  fetch(`/api/${(dom("comment-toggle") as HTMLInputElement).checked ? "comment" : "post"}`, {
    method: "DELETE",
    body: JSON.stringify({
      id: Number((dom("post-id") as HTMLInputElement).value)
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.post_deletion.error), 5000);
      }
    });
});

testMask(Mask.DeleteUser) && dom("account-delete").addEventListener("click", function(): void {
  fetch("/api/admin/user", {
    method: "DELETE",
    body: JSON.stringify({
      identifier: (dom("account-del-identifier") as HTMLInputElement).value,
      use_id: (dom("delete-id-toggle") as HTMLInputElement).checked
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.account_deletion.error), 5000);
      }
    });
});

ENABLE_BADGES && testMask(Mask.GiveBadges) && adminLevel >= 3 && dom("badge-add").addEventListener("click", function(): void {
  fetch("/api/admin/badge", {
    method: "POST",
    body: JSON.stringify({
      identifier: (dom("badge-identifier") as HTMLInputElement).value,
      use_id: (dom("badge-use-id") as HTMLInputElement).checked,
      badge_name: (dom("badge-name") as HTMLInputElement).value
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.badge.manage_add_error));
      }
    });
});

ENABLE_BADGES && testMask(Mask.GiveBadges) && adminLevel >= 3 && dom("badge-remove").addEventListener("click", function(): void {
  fetch("/api/admin/badge", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: (dom("badge-identifier") as HTMLInputElement).value,
      use_id: (dom("badge-use-id") as HTMLInputElement).checked,
      badge_name: (dom("badge-name") as HTMLInputElement).value
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.badge.manage_remove_error));
      }
    });
});

ENABLE_BADGES && testMask(Mask.CreateBadge) && dom("badge-create").addEventListener("click", function(): void {
  fetch("/api/admin/badge", {
    method: "PUT",
    body: JSON.stringify({
      badge_name: (dom("badge-create-name") as HTMLInputElement).value,
      badge_data: (dom("badge-create-data") as HTMLInputElement).value
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      reason?: string,
      success: boolean
    }) => {
      if (json.success) {
        showlog(`${lang.generic.success} ${lang.admin.badge.create_success}`);
      } else {
        showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
      }
    });
});

ENABLE_BADGES && testMask(Mask.DeleteBadge) && dom("badge-delete").addEventListener("click", function(): void {
  fetch("/api/admin/badge", {
    method: "DELETE",
    body: JSON.stringify({
      badge_name: (dom("badge-delete-name") as HTMLInputElement).value
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      reason?: string,
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
      }
    });
});

testMask(Mask.ModifyAccount) && dom("data-get").addEventListener("click", function(): void {
  fetch(`/api/admin/info?identifier=${(dom("data-identifier") as HTMLInputElement).value}&use_id=${(dom("data-use-id") as HTMLInputElement).checked}`)
    .then((response: Response) => (response.json()))
    .then((json: {
      bio?: string,
      displ_name?: string,
      reason?: string,
      success: boolean,
      token?: string,
      user_id?: number,
      username?: string
    }) => {
      if (json.success) {
        dom("data-section").innerHTML = `
          ${lang.admin.modify.current} <a href="/u/${json.username}"><code>@${json.username}</code></a> (${lang.admin.modify.id.replaceAll("%s", json.user_id)})<br>
          <input maxlength="300" id="data-display-name" placeholder="${lang.settings.profile_display_name_placeholder}" value="${escapeHTML(json.displ_name || "")}"><br>
          <textarea maxlength="65536" id="data-bio" placeholder="${lang.settings.profile_bio_placeholder}">${escapeHTML(json.bio || "")}</textarea><br>
          <button id="data-save" data-user-id="${json.user_id}">${lang.admin.modify.save}</button><br>
          ${ENABLE_ACCOUNT_SWITCHER && json.token ? `<button id="data-switcher" data-token="${json.token}" data-username="${json.username}">${lang.admin.modify.switcher}</button>` : ""}
        `;

        dom("data-display-name").addEventListener("input", postTextInputEvent);
        dom("data-bio").addEventListener("input", postTextInputEvent);

        ENABLE_ACCOUNT_SWITCHER && dom("data-switcher").addEventListener("click", function(): void {
          let username: string = this.dataset.username;
          let token: string = this.dataset.token;
          let accounts: string[][] = JSON.parse(localStorage.getItem("acc-switcher") || "[]");

          if (!accounts.includes([username, token])) {
            accounts.push([username, token]);
            localStorage.setItem("acc-switcher", JSON.stringify(accounts));
          }

          showlog(lang.generic.success);
        });

        dom("data-save").addEventListener("click", function(): void {
          fetch("/api/admin/save-acc", {
            method: "PATCH",
            body: JSON.stringify({
              id: this.dataset.userId,
              bio: (dom("data-bio") as HTMLInputElement).value,
              displ_name: (dom("data-display-name") as HTMLInputElement).value
            })
          }).then((response: Response) => (response.json()))
            .then((json: {
              success: boolean,
              reason: string
            }) => {
              if (json.success) {
                showlog("Saved!");
              } else {
                showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
              }
            });
        });
      } else {
        showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
      }
    })
});

testMask(Mask.ReadLogs) && dom("debug-button").addEventListener("click", function(): void {
  this.setAttribute("disabled", "");

  fetch("/api/admin/logs")
    .then((response: Response) => (response.json()))
    .then((json: {
      success: boolean,
      content?: {
        type: string,
        by: string,
        target: string,
        info: string,
        timestamp: number
      }[]
    }) => {
      if (json.success) {
        let output: string = `<table class="admin-logs bordered">
          <tr>
            <th>${lang.admin.logs.timestamp}</th>
            <th>${lang.admin.logs.action}</th>
            <th>${lang.admin.logs.who}</th>
            <th class="nowrap">${lang.admin.logs.more_info}</th>
          </tr>
        `;

        for (const line of json.content) {
          try {
            output += `<tr>
              <td class="nowrap">${timeSince(+line.timestamp)}</td>
              <td class="nowrap">${line.type}</td>
              <td>${(lang.admin.logs[line.target ? "who_format" : "who_format_single"].replaceAll("%1", line.by).replaceAll("%2", line.target)).replaceAll(" ", "&nbsp;").replaceAll(",&nbsp;", ", ")}</td>
              <td>${escapeHTML(line.info)}</td>
            </tr>`;
          } catch(err) {
            console.error(err);
          }
        }

        dom("debug").innerHTML = output + "</table>";
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.logs.error));
        this.removeAttribute("disabled");
      }
    }).catch((err: Error) => {
      showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.logs.error));
      this.removeAttribute("disabled")
    });
});

testMask(Mask.AdminLevel) && dom("level-set").addEventListener("click", function(): void {
  fetch("/api/admin/level", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: (dom("level-identifier") as HTMLInputElement).value,
      use_id: (dom("level-use-id") as HTMLInputElement).checked,
      level: parseInt(forEach(
        document.querySelectorAll("#level-selection input[type='checkbox']"),
        (val: HTMLInputElement, index: number) => (+val.checked)
      ).reverse().join(""), 2)
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      success: boolean
    }) => {
      if (json.success) {
        showlog(lang.generic.success);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.admin.permissions.error));
      }
    });
});

testMask(Mask.AdminLevel) && dom("level-load").addEventListener("click", function(): void {
  fetch(`/api/admin/level?identifier=${(dom("level-identifier") as HTMLInputElement).value}&use_id=${(dom("level-use-id") as HTMLInputElement).checked}`)
    .then((response: Response) => (response.json()))
    .then((json: {
      level?: number,
      reason?: string,
      success: boolean
    }) => {
      if (json.success) {
        console.log(json.level);
        forEach(
          document.querySelectorAll("#level-selection input[type='checkbox']"),
          (val: HTMLInputElement, index: number) => {
            val.checked = testMask(index, json.level);
          }
        )
      } else {
        showlog(lang.generic.something_went_wrong);
      }
    });
});

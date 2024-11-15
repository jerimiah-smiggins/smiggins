declare let user_pronouns: string;
declare let hasEmail: boolean;

let unload: boolean = false;

inc = 0;
home = true;

let output: string = "<select id=\"color\">";
for (const color of validColors) {
  output += `<option ${((localStorage.getItem("color") == color || (!localStorage.getItem("color") && color == "mauve")) ? "selected" : "")} value="${color}">${lang.generic.colors[color]}</option>`;
}
output += "</select><br><br>";

if (ENABLE_PRONOUNS && user_pronouns.includes("_")) {
  dom("pronouns-secondary-container").setAttribute("hidden", "");
  document.querySelector(`#pronouns-primary option[value="${user_pronouns}"]`).setAttribute("selected", "");
} else if (ENABLE_PRONOUNS) {
  dom("pronouns-secondary-container").removeAttribute("hidden");
  document.querySelector(`#pronouns-primary option[value="${user_pronouns[0]}"]`).setAttribute("selected", "");
  document.querySelector(`#pronouns-secondary option[value="${user_pronouns[1]}"]`).setAttribute("selected", "");
}

if (localStorage.getItem("checkboxes")) {
  dom("disable-checkboxes").setAttribute("checked", "");
}

let currentAccount: string;
let accounts: string[][];
let hasCurrent: boolean;

if (ENABLE_ACCOUNT_SWITCHER) {
  currentAccount = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
  accounts = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[localStorage.getItem("username"), currentAccount]]));
  if (!localStorage.getItem("username")) {
    dom("switcher").setAttribute("hidden", "");
  }

  hasCurrent = false;
  for (const acc of accounts) {
    if (currentAccount == acc[1]) {
      hasCurrent = true;
    }
  }

  if (!hasCurrent) {
    accounts.push([
      localStorage.getItem("username"),
      document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1]
    ]);
  }

  accounts = accounts.sort(
    (a: string[], b: string[]): number => (a[0].toLowerCase() > b[0].toLowerCase() ? 1 : 0)
  );

  localStorage.setItem("acc-switcher", JSON.stringify(accounts));

  let x: DocumentFragment = new DocumentFragment();
  for (const acc of accounts) {
    let y: HTMLOptionElement = document.createElement("option");
    y.innerText = acc[0];
    y.value = acc[1] + "-" + acc[0];

    if (currentAccount == acc[1]) {
      y.setAttribute("selected", "");
    }

    x.append(y);
  }

  dom("accs").append(x);
}

dom("color-selector").innerHTML = output;
dom("post-example").innerHTML = getPostHTML(
  {
    creator: {
      badges: ["administrator"],
      color_one: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
      color_two: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
      display_name: lang.settings.cosmetic_example_post_display_name,
      gradient_banner: true,
      pronouns: "aa",
      username: lang.settings.cosmetic_example_post_username,
    },
    private: false,
    can_delete: false,
    can_edit: false,
    can_pin: false,
    can_view: true,
    comments: Math.floor(Math.random() * 100),
    content: lang.settings.cosmetic_example_post_content,
    liked: true,
    likes: Math.floor(Math.random() * 99) + 1,
    owner: false,
    parent_is_comment: false,
    parent: -1,
    post_id: 0,
    quotes: Math.floor(Math.random() * 100),
    c_warning: null,
    timestamp: Date.now() / 1000 - Math.random() * 86400,
    poll: null,
    logged_in: true,
    edited: false
  }, false, false, false, true
);

function toggleGradient(setUnloadStatus: boolean | any): void {
  if (typeof setUnloadStatus !== "boolean" || setUnloadStatus) {
    setUnload();
  }

  if (ENABLE_GRADIENT_BANNERS && (dom("banner-is-gradient") as HTMLInputElement).checked) {
    dom("banner-color-two").removeAttribute("hidden");
    dom("banner").classList.add("gradient");
  } else {
    ENABLE_GRADIENT_BANNERS && dom("banner-color-two").setAttribute("hidden", "");
    dom("banner").classList.remove("gradient");
  }
}

function updatePronouns(): void {
  setUnload();
  if (this.id == "pronouns-primary") {
    if (this.value.length != 1) {
      user_pronouns = this.value;
      dom("pronouns-secondary-container").setAttribute("hidden", "");
    } else {
      user_pronouns = this.value + (dom("pronouns-secondary") as HTMLInputElement).value;
      dom("pronouns-secondary-container").removeAttribute("hidden");
    }
  } else {
    user_pronouns = user_pronouns[0] + this.value;
  }
}

function setUnload(): void {
  unload = true;

  if (!onbeforeunload) {
    onbeforeunload = function(event: BeforeUnloadEvent): string {
      return lang.settings.unload;
    };
  }
}

function removeUnload(): void {
  unload = false;
  onbeforeunload = null;
}

if (oldFavicon) {
  dom("old-favi").setAttribute("checked", "");
}

ENABLE_DYNAMIC_FAVICON && dom("old-favi").addEventListener("input", function(): void {
  oldFavicon = (this as HTMLInputElement).checked;
  if (oldFavicon) {
    localStorage.setItem("old-favicon", "1");
    setOldFavicon();
  } else {
    localStorage.removeItem("old-favicon");
    if (autoEnabled) {
      autoSetFavicon();
    } else {
      setGenericFavicon();
    }
  }
});

toggleGradient(false);
dom("color").addEventListener("change", function(): void {
  localStorage.setItem("color", (dom("color") as HTMLInputElement).value);
    document.body.setAttribute('data-color', (dom("color") as HTMLInputElement).value);

    if (!oldFavicon) {
      setGenericFavicon();
    }
});

(dom("bar-pos") as HTMLInputElement).value = localStorage.getItem("bar-pos") || "ul";
dom("bar-pos").addEventListener("change", function(): void {
  localStorage.setItem("bar-pos", (dom("bar-pos") as HTMLInputElement).value);
  document.body.setAttribute("data-bar-pos", (dom("bar-pos") as HTMLInputElement).value);
});

(dom("bar-dir") as HTMLInputElement).value = localStorage.getItem("bar-dir") || "v";
dom("bar-dir").addEventListener("change", function(): void {
  localStorage.setItem("bar-dir", (dom("bar-dir") as HTMLInputElement).value);
  document.body.setAttribute("data-bar-dir", (dom("bar-dir") as HTMLInputElement).value);
});

dom("disable-checkboxes").addEventListener("input", function(): void {
  if (localStorage.getItem("checkboxes")) {
    localStorage.removeItem("checkboxes");
    document.body.removeAttribute("data-disable-checkboxes");
  } else {
    localStorage.setItem("checkboxes", ":3");
    document.body.setAttribute("data-disable-checkboxes", "");
  }
});

ENABLE_USER_BIOS && dom("bio").addEventListener("input", postTextInputEvent);
dom("displ-name").addEventListener("input", setUnload);
dom("default-post").addEventListener("input", setUnload);
dom("followers-approval").addEventListener("input", setUnload);

dom("theme").addEventListener("change", function(): void {
  dom("theme").setAttribute("disabled", "");
  s_fetch("/api/user/settings/theme", {
    method: "PATCH",
    body: JSON.stringify({
      theme: (dom("theme") as HTMLInputElement).value
    }),
    disable: [this]
  });
});

function save(post?: (success: boolean) => void, log?: null | HTMLDivElement): void {
  removeUnload();

  s_fetch("/api/user/settings", {
    method: "PATCH",
    body: JSON.stringify({
      bio: ENABLE_USER_BIOS ? (dom("bio") as HTMLInputElement).value : "",
      lang: (dom("lang") as HTMLInputElement).value,
      color: (dom("banner-color") as HTMLInputElement).value,
      pronouns: ENABLE_PRONOUNS ? user_pronouns : "__",
      color_two: ENABLE_GRADIENT_BANNERS ? (dom("banner-color-two") as HTMLInputElement).value : "",
      displ_name: (dom("displ-name") as HTMLInputElement).value,
      is_gradient: ENABLE_GRADIENT_BANNERS ? (dom("banner-is-gradient") as HTMLInputElement).checked : false,
      approve_followers: (dom("followers-approval") as HTMLInputElement).checked,
      default_post_visibility: (dom("default-post") as HTMLInputElement).value
    }),
    customLog: log,
    disable: [
      this,
      dom("displ-name"),
      ENABLE_USER_BIOS && dom("bio"),
      ENABLE_PRONOUNS && dom("pronouns-primary"),
      ENABLE_PRONOUNS && dom("pronouns-secondary"),
      dom("banner-color"),
      ENABLE_GRADIENT_BANNERS && dom("banner-color-two"),
      ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient"),
      dom("default-post"),
      dom("followers-approval"),
      dom("lang"),
    ],
    postFunction: (success: boolean): void => {
      if (!success) {
        setUnload();
      }

      if (typeof post == "function") {
        post(success);
      }
    }
  });
}

dom("save").addEventListener("click", (): void => (save()));

dom("banner-color").addEventListener("input", function(): void {
  setUnload();
  document.body.style.setProperty("--banner", (this as HTMLInputElement).value);
});

ENABLE_GRADIENT_BANNERS && dom("banner-color-two").addEventListener("input", function(): void {
  setUnload();
  document.body.style.setProperty("--banner-two", (this as HTMLInputElement).value);
});

ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").addEventListener("input", toggleGradient);

ENABLE_ACCOUNT_SWITCHER && dom("acc-switch").addEventListener("click", function(): void {
  if (unload) {
    createModal(lang.settings.unload.title, lang.settings.unload.content, [
      {
        name: lang.settings.unload.leave,
        onclick: (): void => {
          let val: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
          setCookie("token", val[0]);
          localStorage.setItem("username", val[1]);

          removeUnload();
          location.href = location.href;
          closeModal();
        }
      },
      { name: lang.generic.cancel, onclick: closeModal }
    ]);
  } else {
    let val: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
    setCookie("token", val[0]);
    localStorage.setItem("username", val[1]);
    location.href = location.href;
  }
});

ENABLE_ACCOUNT_SWITCHER && dom("acc-remove").addEventListener("click", function(): void {
  let removed: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
  if (removed[0] == currentAccount) {
    showlog(lang.settings.account_switcher_remove_error);
  } else {
    for (let i: number = 0; i < accounts.length; i++) {
      if (accounts[i][1] == removed[0]) {
        accounts.splice(i, 1);
        --i;
      }
    }

    dom("accs").querySelector(`option[value="${(dom("accs") as HTMLInputElement).value}"]`).remove();
    localStorage.setItem("acc-switcher", JSON.stringify(accounts));
  }
});

ENABLE_PRONOUNS && dom("pronouns-primary").addEventListener("input", updatePronouns);
ENABLE_PRONOUNS && dom("pronouns-secondary").addEventListener("input", updatePronouns);

dom("toggle-password").addEventListener("click", function(): void {
  let newType: string = dom("password").getAttribute("type") === "password" ? "text" : "password";

  dom("current").setAttribute("type", newType);
  dom("password").setAttribute("type", newType);
  dom("confirm").setAttribute("type", newType);
});

dom("set-password").addEventListener("click", function(): void {
  let old_password: string = sha256((dom("current") as HTMLInputElement).value);
  let password: string = sha256((dom("password") as HTMLInputElement).value)

  if (password !== sha256((dom("confirm") as HTMLInputElement).value)) {
    showlog(lang.account.password_match_failure);
    return;
  }

  s_fetch("/api/user/password", {
    method: "PATCH",
    body: JSON.stringify({
      password: old_password,
      new_password: password
    }),
    disable: [this],
    postFunction: (success: boolean) => {
      if (success && ENABLE_ACCOUNT_SWITCHER) {
        let switcher: string[][] = JSON.parse(localStorage.getItem("acc-switcher"));
        let newToken: string = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];

        for (let i: number = 0; i < switcher.length; i++) {
          if (switcher[i][1] == currentAccount) {
            switcher[i][1] = newToken;
          }
        }

        currentAccount = newToken;
        localStorage.setItem("acc-switcher", JSON.stringify(switcher));
      }
    }
  });
});

dom("current").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("password").focus();
  }
});

dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("confirm").focus();
  }
});

dom("confirm").addEventListener("keydown", function(event: KeyboardEvent): void {
  if (event.key == "Enter" || event.keyCode == 18) {
    dom("set-password").focus();
    dom("set-password").click();
  }
});

ENABLE_EMAIL && dom("email-submit").addEventListener("click", function(): void {
  s_fetch("/api/email/save", {
    method: "POST",
    body: JSON.stringify({
      email: (dom("email") as HTMLInputElement).value
    }),
    disable: [dom("email"), dom("email-submit")]
  });
});

dom("delete-account").addEventListener("click", function(): void {
  createModal(escapeHTML(lang.admin.account_deletion.title), escapeHTML(lang.settings.account_deletion_warning), [
    { name: lang.generic.cancel, onclick: closeModal },
    { name: lang.settings.account_deletion_confirm, onclick: (): void => {
      createModal(
        escapeHTML(lang.admin.account_deletion.title),
        `${escapeHTML(lang.settings.account_deletion_password)}<br><input type="password" id="account-deletion-password" placeholder="${escapeHTML(lang.account.password_placeholder)}">`,
        [
          { name: lang.generic.cancel, onclick: closeModal },
          { name: lang.admin.account_deletion.button, onclick: (): void => {
            s_fetch("/api/user", {
              method: "DELETE",
              body: JSON.stringify({
                password: sha256((dom("account-deletion-password") as HTMLInputElement).value)
              }),
              customLog: dom("modal-log") as HTMLDivElement,
              postFunction: (success: boolean): void => {
                if (success) {
                  closeModal();
                }
              }
            })
          }}
        ]
      );
    }}
  ]);
});

onLoad = function(): void {
  document.querySelectorAll("a").forEach((val: HTMLAnchorElement, index: number): void => {
    if (!val.href || val.href[0] === "#" || val.href.startsWith("javascript:") || val.target === "_blank") {
      return;
    }

    val.addEventListener("click", (event: MouseEvent): void => {
      if (unload) {
        let url: string = val.href;
        event.preventDefault();
        createModal(lang.settings.unload.title, lang.settings.unload.content, [
          {
            name: lang.settings.unload.leave,
            onclick: (): void => {
              removeUnload();
              location.href = url;
              closeModal();
            }
          }, {
            name: lang.settings.unload.save,
            onclick: (): void => {
              save(
                (success: boolean) => {
                  if (success) {
                    location.href = url;
                  }
                },
                dom("modal-log") as HTMLDivElement
              );
            }
          },
          { name: lang.generic.cancel, onclick: closeModal }
        ]);
      }
    });
  });
}

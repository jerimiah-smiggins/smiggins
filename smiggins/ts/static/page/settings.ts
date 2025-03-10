let unload: boolean;

function toggleGradient(setUnloadStatus: boolean | any): void {
  if (typeof setUnloadStatus !== "boolean" || setUnloadStatus) {
    setUnload();
  }

  if (conf.gradient_banners && (dom("banner-is-gradient") as HTMLInputElement).checked) {
    dom("banner-color-two").removeAttribute("hidden");
    dom("banner").classList.add("gradient");
  } else {
    conf.gradient_banners && dom("banner-color-two").setAttribute("hidden", "");
    dom("banner").classList.remove("gradient");
  }
}

function updatePronouns(): void {
  setUnload();
  if (this.id == "pronouns-primary") {
    if (lang.generic.pronouns.enable_secondary) {
      if ((document.querySelector(`#pronouns-primary > option[value="${this.value}"]`) as HTMLObjectElement).dataset.special == "no-secondary") {
        dom("pronouns-secondary-container").setAttribute("hidden", "");
        context.pronouns.secondary = null;
      } else {
        dom("pronouns-secondary-container").removeAttribute("hidden");
        context.pronouns.secondary = (dom("pronouns-secondary") as HTMLOptionElement).value
      }
    }

    context.pronouns.primary = this.value;
  } else {
    if ((document.querySelector(`#pronouns-secondary > option[value="${this.value}"]`) as HTMLObjectElement).dataset.special == "inherit") {
      context.pronouns.secondary = context.pronouns.primary;
    } else {
      context.pronouns.secondary = this.value;
    }
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

function save(post?: (success: boolean) => void): void {
  removeUnload();

  s_fetch("/api/user/settings", {
    method: "PATCH",
    body: JSON.stringify({
      bio: conf.user_bios ? (dom("bio") as HTMLInputElement).value : "",
      lang: (dom("lang") as HTMLInputElement).value,
      color: (dom("banner-color") as HTMLInputElement).value,
      pronouns: Boolean(Object.keys(context.pronouns).length) ? context.pronouns : { primary: "", secondary: null },
      color_two: conf.gradient_banners ? (dom("banner-color-two") as HTMLInputElement).value : "",
      displ_name: (dom("displ-name") as HTMLInputElement).value,
      is_gradient: conf.gradient_banners ? (dom("banner-is-gradient") as HTMLInputElement).checked : false,
      approve_followers: (dom("followers-approval") as HTMLInputElement).checked,
      default_post_visibility: (dom("default-post") as HTMLInputElement).value
    }),
    disable: [
      this,
      dom("displ-name"),
      conf.user_bios && dom("bio"),
      conf.pronouns && dom("pronouns-primary"),
      conf.pronouns && dom("pronouns-secondary"),
      dom("banner-color"),
      conf.gradient_banners && dom("banner-color-two"),
      conf.gradient_banners && dom("banner-is-gradient"),
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

function settingsInit(): void {
  document.body.style.setProperty("--banner", context.banner_color_one);
  document.body.style.setProperty("--banner-two", context.banner_color_two);

  unload = false;
  inc = 0;

  if (conf.pronouns && lang.generic.pronouns.enable_pronouns && lang.generic.pronouns.enable_secondary) {
    let primary: HTMLOptionElement = document.querySelector(`#pronouns-primary > option[value="${context.pronouns.primary}"]`);
    if (!primary || primary.dataset.special == "no-secondary") {
      dom("pronouns-secondary-container").setAttribute("hidden", "");
    }
  }

  if (localStorage.getItem("checkboxes")) {
    dom("disable-checkboxes").setAttribute("checked", "");
  }

  let currentAccount: string;
  let accounts: string[][];
  let hasCurrent: boolean;

  if (conf.account_switcher) {
    currentAccount = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
    accounts = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[username, currentAccount]]));
    if (!username) {
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
        username,
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

  if (oldFavicon) {
    dom("old-favi").setAttribute("checked", "");
  }

  conf.dynamic_favicon && dom("old-favi").addEventListener("input", function(): void {
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

  (dom("expand-cws") as HTMLInputElement).checked = !!localStorage.getItem("expand-cws");
  dom("expand-cws").addEventListener("change", function(): void {
    if ((this as HTMLInputElement).checked) {
      localStorage.setItem("expand-cws", "1");
    } else {
      localStorage.removeItem("expand-cws");
    }
  });

  (dom("compact") as HTMLInputElement).checked = !!localStorage.getItem("compact");
  dom("compact").addEventListener("change", function(): void {
    if ((this as HTMLInputElement).checked) {
      localStorage.setItem("compact", "1");
      document.body.dataset.compact = "";
    } else {
      localStorage.removeItem("compact");
      document.body.removeAttribute("data-compact");
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

  dom("displ-name").addEventListener("input", setUnload);
  dom("default-post").addEventListener("input", setUnload);
  dom("followers-approval").addEventListener("input", setUnload);
  dom("lang").addEventListener("input", setUnload);
  dom("lang").addEventListener("change", setUnload);

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

  dom("save").addEventListener("click", (): void => (save()));

  dom("banner-color").addEventListener("input", function(): void {
    setUnload();
    document.body.style.setProperty("--banner", (this as HTMLInputElement).value);
  });

  conf.gradient_banners && dom("banner-color-two").addEventListener("input", function(): void {
    setUnload();
    document.body.style.setProperty("--banner-two", (this as HTMLInputElement).value);
  });

  conf.gradient_banners && dom("banner-is-gradient").addEventListener("input", toggleGradient);

  conf.account_switcher && dom("acc-switch").addEventListener("click", function(): void {
    if (unload) {
      createModal(lang.settings.unload.title, lang.settings.unload.content, [
        {
          name: lang.settings.unload.leave,
          onclick: (): void => {
            let val: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
            setCookie("token", val[0]);

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
      location.href = location.href;
    }
  });

  conf.account_switcher && dom("acc-remove").addEventListener("click", function(): void {
    let removed: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
    if (removed[0] == currentAccount) {
      toast(lang.settings.account_switcher_remove_error, true);
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

  conf.pronouns && lang.generic.pronouns.enable_pronouns && dom("pronouns-primary").addEventListener("input", updatePronouns);
  conf.pronouns && lang.generic.pronouns.enable_pronouns && lang.generic.pronouns.enable_secondary && dom("pronouns-secondary").addEventListener("input", updatePronouns);

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
      toast(lang.account.password_match_failure, true);
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
        if (success && conf.account_switcher) {
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
    if (event.key == "Enter") {
      dom("password").focus();
    }
  });

  dom("password").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      dom("confirm").focus();
    }
  });

  dom("confirm").addEventListener("keydown", function(event: KeyboardEvent): void {
    if (event.key == "Enter") {
      dom("set-password").focus();
      dom("set-password").click();
    }
  });

  dom("save-muted").addEventListener("click", function(): void {
    s_fetch("/api/user/muted", {
      method: "POST",
      body: JSON.stringify({
        soft: (dom("soft-mute") as HTMLTextAreaElement).value,
        hard: (dom("hard-mute") as HTMLTextAreaElement).value
      }),
      disable: [this, dom("muted")]
    });
  });

  conf.email && dom("email-submit").addEventListener("click", function(): void {
    s_fetch("/api/email/save", {
      method: "POST",
      body: JSON.stringify({
        email: (dom("email") as HTMLInputElement).value,
        password: sha256((dom("email-password") as HTMLInputElement).value)
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
                postFunction: (success: boolean): void => {
                  if (success) {
                    closeModal();
                  }
                }
              });
            }}
          ]
        );
      }}
    ]);
  });

  redirectConfirmation = (url: string): boolean => {
    if (!unload) { return true; }

    createModal(lang.settings.unload.title, lang.settings.unload.content, [
      {
        name: lang.settings.unload.leave,
        onclick: (): void => {
          removeUnload();
          closeModal();
          redirect(url, true);
        }
      }, {
        name: lang.settings.unload.save,
        class: "primary",
        onclick: (): void => {
          save(
            (success: boolean): void => {
              if (success) {
                removeUnload();
                closeModal();
                redirect(url, true);
              }
            }
          );
        }
      },
      { name: lang.generic.cancel, onclick: closeModal }
    ]);

    return false;
  }
}

declare let user_pronouns: string;

inc = 0;
home = true;

// @ts-ignore
function showlog(str: string, time: number = 3000): void {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => {
    --inc;
    if (!inc) {
      dom("error").innerText = "";
    }
  }, time);
};

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

let currentAccount: string = document.cookie.match(/token=([a-f0-9]{64})/)[0].split("=")[1];
let accounts: string[][] = JSON.parse(localStorage.getItem("acc-switcher") || JSON.stringify([[localStorage.getItem("username"), currentAccount]]));
if (!localStorage.getItem("username")) {
  dom("switcher").setAttribute("hidden", "");
}

let hasCurrent: boolean = false;
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

dom("color-selector").innerHTML = output;
dom("post-example").innerHTML = getPostHTML(
  {
    "creator": {
      "badges": ["administrator"],
      "color_one": "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
      "color_two": "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
      "display_name": lang.settings.cosmetic_example_post_display_name,
      "gradient_banner": true,
      "private": false,
      "pronouns": "aa",
      "username": lang.settings.cosmetic_example_post_username,
    },
    "can_delete": false,
    "can_view": true,
    "comments": Math.floor(Math.random() * 100),
    "content": lang.settings.cosmetic_example_post_content,
    "liked": true,
    "likes": Math.floor(Math.random() * 99) + 1,
    "owner": false,
    "parent_is_comment": false,
    "parent": -1,
    "post_id": 0,
    "quotes": Math.floor(Math.random() * 100),
    "timestamp": Date.now() / 1000 - Math.random() * 86400
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

function setUnload(): void {
  if (!window.onbeforeunload) {
    window.onbeforeunload = function(): string {
      return lang.settings.unload;
    };
  }
}

dom("accs").append(x);

toggleGradient(false);
dom("color").addEventListener("change", function(): void {
  localStorage.setItem('color', (dom("color") as HTMLInputElement).value);
  document.body.setAttribute('data-color', (dom("color") as HTMLInputElement).value);
});

ENABLE_USER_BIOS && dom("bio").addEventListener("input", postTextInputEvent);
dom("displ-name").addEventListener("input", setUnload);
dom("priv").addEventListener("input", setUnload);

dom("theme").addEventListener("change", function(): void {
  dom("theme").setAttribute("disabled", "");
  fetch("/api/user/settings/theme", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "theme": (dom("theme") as HTMLInputElement).value
    })
  })
  .then((response: Response) => (response.json()))
  .then((json: {
    success: boolean
  }) => {
    if (!json.success) {
      showlog(lang.generic.something_went_wrong);
    }
      dom("theme").removeAttribute("disabled");
      document.querySelector("body").setAttribute("data-theme", (dom("theme") as HTMLInputElement).value);
    })
    .catch((err: Error) => {
      dom("theme").removeAttribute("disabled");
      showlog(lang.generic.something_went_wrong);
    });
});

dom("save").addEventListener("click", function(): void {
  ENABLE_USER_BIOS && dom("bio").setAttribute("disabled", "");
  dom("priv").setAttribute("disabled", "");
  dom("save").setAttribute("disabled", "");
  dom("displ-name").setAttribute("disabled", "");
  dom("banner-color").setAttribute("disabled", "");
  dom("lang").setAttribute("disabled", "");
  ENABLE_GRADIENT_BANNERS && dom("banner-color-two").setAttribute("disabled", "");
  ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").setAttribute("disabled", "");

  fetch("/api/user/settings", {
    method: "PATCH",
    body: JSON.stringify({
      bio: ENABLE_USER_BIOS ? (dom("bio") as HTMLInputElement).value : "",
      lang: (dom("lang") as HTMLInputElement).value,
      priv: (dom("priv") as HTMLInputElement).checked,
      color: (dom("banner-color") as HTMLInputElement).value,
      pronouns: ENABLE_PRONOUNS ? user_pronouns : "__",
      color_two: ENABLE_GRADIENT_BANNERS ? (dom("banner-color-two") as HTMLInputElement).value : "",
      displ_name: (dom("displ-name") as HTMLInputElement).value,
      is_gradient: ENABLE_GRADIENT_BANNERS ? (dom("banner-is-gradient") as HTMLInputElement).checked : false
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      reason: string,
      success: boolean
    }) => {
      if (json.success) {
        window.onbeforeunload = null;
        showlog(lang.generic.success);
      } else {
        showlog(`${lang.generic.something_went_wrong} ${lang.generic.reason.replaceAll("%s", json.reason)}`);
      }

      throw "erm what the flip";
    })
    .catch((err: Error) => {
      ENABLE_USER_BIOS && dom("bio").removeAttribute("disabled");
      dom("priv").removeAttribute("disabled");
      dom("save").removeAttribute("disabled");
      dom("displ-name").removeAttribute("disabled");
      dom("banner-color").removeAttribute("disabled");
      dom("lang").removeAttribute("disabled");
      ENABLE_GRADIENT_BANNERS && dom("banner-color-two").removeAttribute("disabled");
      ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").removeAttribute("disabled");
    });
});

dom("banner-color").addEventListener("input", function(): void {
  setUnload();
  document.body.style.setProperty("--banner", (this as HTMLInputElement).value);
});

ENABLE_GRADIENT_BANNERS && dom("banner-color-two").addEventListener("input", function(): void {
  setUnload();
  document.body.style.setProperty("--banner-two", (this as HTMLInputElement).value);
});

ENABLE_GRADIENT_BANNERS && dom("banner-is-gradient").addEventListener("input", toggleGradient);

dom("acc-switch").addEventListener("click", function(): void {
  let val: string[] = (dom("accs") as HTMLInputElement).value.split("-", 2);
  setCookie("token", val[0]);
  localStorage.setItem("username", val[1]);
  window.location.reload();
});

dom("acc-remove").addEventListener("click", function(): void {
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
})

dom("set-password").addEventListener("click", function(): void {
  let old_password: string = sha256((dom("current") as HTMLInputElement).value);
  let password: string = sha256((dom("password") as HTMLInputElement).value)

  if (password !== sha256((dom("confirm") as HTMLInputElement).value)) {
    showlog(lang.account.password_match_failure);
    return;
  }

  this.setAttribute("disabled", "");
  fetch("/api/user/password", {
    method: "PATCH",
    body: JSON.stringify({
      password: old_password,
      new_password: password
    })
  }).then((response: Response) => (response.json()))
    .then((json: {
      reason: string,
      success: boolean,
      token: string
    }) => {
      if (json.success) {
        setCookie("token", json.token);

        let switcher: string[][] = JSON.parse(localStorage.getItem("acc-switcher"));
        for (let i: number = 0; i < switcher.length; i++) {
          if (switcher[i][1] == currentAccount) {
            switcher[i][1] = json.token;
          }
        }
        localStorage.setItem("acc-switcher", JSON.stringify(switcher));

        showlog(lang.settings.account_password_success, 5000);
      } else {
        showlog(lang.settings.account_password_failure.replaceAll("%s", json.reason));
      }

      this.removeAttribute("disabled");
    }).catch((err: Error) => {
      this.removeAttribute("disabled");
      showlog(lang.generic.something_went_wrong);
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

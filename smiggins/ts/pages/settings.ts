function updateBannerColors(): void {
  let bannerDisplayElement: HTMLElement | null = document.getElementById("banner-example");
  let gradientCheckElement: HTMLInputElement | null = document.getElementById("banner-gradient") as HTMLInputElement | null;
  let c1Element: HTMLInputElement | null = document.getElementById("banner-one") as HTMLInputElement | null;
  let c2Element: HTMLInputElement | null = document.getElementById("banner-two") as HTMLInputElement | null;

  if (!bannerDisplayElement) { return; }

  if (c1Element) {
    bannerDisplayElement.style.setProperty("--color-one", c1Element.value);

    if (gradientCheckElement && !gradientCheckElement.checked) {
      bannerDisplayElement.style.setProperty("--color-two", c1Element.value);
    }
  }

  if (c2Element && (!gradientCheckElement || gradientCheckElement.checked)) {
    bannerDisplayElement.style.setProperty("--color-two", c2Element.value);
  }
}

function saveProfile(e: Event): void {
  let displayNameElement: HTMLInputElement | null = document.getElementById("display-name") as HTMLInputElement | null;
  let bioElement: HTMLTextAreaElement | null = document.getElementById("bio") as HTMLTextAreaElement | null;
  let gradientCheckElement: HTMLInputElement | null = document.getElementById("banner-gradient") as HTMLInputElement | null;
  let c1Element: HTMLInputElement | null = document.getElementById("banner-one") as HTMLInputElement | null;
  let c2Element: HTMLInputElement | null = document.getElementById("banner-two") as HTMLInputElement | null;
  let c: userData | undefined = userCache[username];

  if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element) { return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user", {
    method: "PATCH",
    body: JSON.stringify({
      display_name: displayNameElement.value,
      bio: bioElement.value,
      gradient: gradientCheckElement.checked,
      color_one: c1Element.value,
      color_two: c2Element.value
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<GENERIC_API_RESPONSE> => (response.json()))
    .then((json: GENERIC_API_RESPONSE): void => {
      if (json.success) {
        createToast("Success!", "Your profile has been saved.");

        if (c) {
          c.color_one = c1Element.value;
          c.color_two = gradientCheckElement.checked ? c1Element.value : c2Element.value;
          c.display_name = displayNameElement.value;
          c.bio = bioElement.value;
        }
      } else {
        createToast(...errorCodeStrings(json.reason));
      }

      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
    })
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function saveDefaultVisibility(): void {
  defaultPostPrivate = (document.getElementById("default-private") as HTMLSelectElement | null)?.value === "true";
  snippetVariables.selected_if_default_private = defaultPostPrivate ? "selected" : "";
  snippetVariables.checked_if_default_private = defaultPostPrivate ? "checked" : "";

  fetch("/api/user/default_post", {
    method: "PATCH",
    body: JSON.stringify({
      "private": defaultPostPrivate
    }),
    headers: { Accept: "application/json" }
  });
}

function saveVerifyFollowers(): void {
  fetch("/api/user/verify_followers", {
    method: "PATCH",
    body: JSON.stringify({
      verify: (document.getElementById("verify-followers") as HTMLInputElement | null)?.checked
    }),
    headers: { Accept: "application/json" }
  });
}

function settingsThemeSelection(): void {
  let themeElement: HTMLSelectElement | null = document.getElementById("theme") as HTMLSelectElement | null;

  if (themeElement) {
    let th = themeElement.value;

    if (th === "light" || th === "dark" || th === "system") {
      setTheme(th);
    }
  }
}

function changePassword(e: Event): void {
  let currentPwElement: HTMLElement | null = document.getElementById("password-current");
  let newPwElement: HTMLElement | null = document.getElementById("password-new");
  let confirmPwElement: HTMLElement | null = document.getElementById("password-confirm");

  if (!currentPwElement || !newPwElement || !confirmPwElement) { return; }

  let currentPw: string = (currentPwElement as HTMLInputElement).value;
  let newPw: string = (newPwElement as HTMLInputElement).value;
  let confirmPw: string = (confirmPwElement as HTMLInputElement).value;

  if (!currentPw) { currentPwElement.focus(); return; }
  if (!newPw) { newPwElement.focus(); return; }
  if (confirmPw !== newPw) { confirmPwElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user/password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: sha256(currentPw),
      new_password: sha256(newPw)
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_token> => (response.json()))
    .then((json: api_token): void => {
      if (json.success) {
        setTokenCookie(json.token);
        createToast("Success!", "Your password has been changed.");

        (currentPwElement as HTMLInputElement).value = "";
        (newPwElement as HTMLInputElement).value = "";
        (confirmPwElement as HTMLInputElement).value = "";
      } else {
        createToast(...errorCodeStrings(json.reason));
      }

      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
    })
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function deleteAccount(e: Event): void {
  let pwElement: HTMLElement | null = document.getElementById("delete-acc-password");
  let confirmElement: HTMLElement | null = document.getElementById("delete-acc-confirm");

  if (!pwElement || !confirmElement) { return; }

  let password: string = (pwElement as HTMLInputElement).value;
  let confirmed: boolean = (confirmElement as HTMLInputElement).checked;

  if (!password) { pwElement.focus(); return; }
  if (!confirmed) { confirmElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user", {
    method: "DELETE",
    body: JSON.stringify({ password: sha256(password) }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<GENERIC_API_RESPONSE> => (response.json()))
    .then((json: GENERIC_API_RESPONSE): void => {
      if (json.success) {
        renderPage("logout");
      } else {
        createToast(...errorCodeStrings(json.reason));
        (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      }
    })
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_settingsProfile(element: HTMLDivElement): void {
  fetch("/api/user")
    .then((response: Response): Promise<api_profile> => (response.json()))
    .then((json: api_profile): void => {
      if (json.success) {
        let displayNameElement: HTMLInputElement | null = element.querySelector("#display-name");
        let bioElement: HTMLTextAreaElement | null = element.querySelector("#bio");
        let gradientCheckElement: HTMLInputElement | null = element.querySelector("#banner-gradient");
        let c1Element: HTMLInputElement | null = element.querySelector("#banner-one");
        let c2Element: HTMLInputElement | null = element.querySelector("#banner-two");
        let verifyElement: HTMLInputElement | null = element.querySelector("#verify-followers");

        if (displayNameElement)   { displayNameElement.value = json.display_name; }
        if (bioElement)           { bioElement.value = json.bio;                  }
        if (gradientCheckElement) { gradientCheckElement.checked = json.gradient; }
        if (c1Element)            { c1Element.value = json.color_one; c1Element.addEventListener("input", updateBannerColors); }
        if (c2Element)            { c2Element.value = json.color_two; c2Element.addEventListener("input", updateBannerColors); }
        if (verifyElement)        { verifyElement.checked = json.verify_followers; verifyElement.addEventListener("input", saveVerifyFollowers); }

        element.querySelector("#profile-save")?.addEventListener("click", saveProfile);
        element.querySelector("#default-private")?.addEventListener("input", saveDefaultVisibility);
        element.querySelector("#banner-gradient")?.addEventListener("input", updateBannerColors);

        let c: userData | undefined = userCache[username];

        if (c) {
          c.color_one = json.color_one;
          c.color_two = json.gradient ? json.color_two : json.color_one;
          c.display_name = json.display_name;
          c.bio = json.bio;
        }

        updateBannerColors();

        // TODO: manually approved followers setting

        for (const el of element.querySelectorAll("[data-disabled-while-loading]")) {
          el.removeAttribute("disabled");
        }
      } else {
        createToast(...errorCodeStrings(json.reason));
      }
    })
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_settingsCosmetic(element: HTMLDivElement): void {
  element.querySelector(`#theme > option[value="${theme}"]`)?.setAttribute("selected", "");
  if (localStorage.getItem("smiggins-complex-timestamps")) { element.querySelector("#complex-timestamps")?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-expand-cws"))         { element.querySelector("#expand-cws")        ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-hide-interactions"))  { element.querySelector("#hide-interactions") ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-auto-show-posts"))    { element.querySelector("#auto-show")         ?.setAttribute("checked", ""); }

  element.querySelector("#theme")             ?.addEventListener("change", settingsThemeSelection);
  element.querySelector("#complex-timestamps")?.addEventListener("change", genericCheckbox("smiggins-complex-timestamps"));
  element.querySelector("#expand-cws")        ?.addEventListener("change", genericCheckbox("smiggins-expand-cws"));
  element.querySelector("#hide-interactions") ?.addEventListener("change", genericCheckbox("smiggins-hide-interactions"));
  element.querySelector("#auto-show")         ?.addEventListener("change", genericCheckbox("smiggins-auto-show-posts"));
}

function p_settingsAccount(element: HTMLDivElement): void {
  element.querySelector("#password-set")?.addEventListener("click", changePassword);
  element.querySelector("#delete-acc")?.addEventListener("click", deleteAccount);
}

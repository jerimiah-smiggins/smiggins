function updateBannerColors(): void {
  let bannerDisplayElement: el = document.getElementById("banner-example");
  let gradientCheckElement: Iel = document.getElementById("banner-gradient") as Iel;
  let c1Element: Iel = document.getElementById("banner-one") as Iel;
  let c2Element: Iel = document.getElementById("banner-two") as Iel;

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

function updateUserCacheFromCosmeticSettings(): void {
  let c: userData | undefined = userCache[username];
  let displayNameElement: Iel = document.getElementById("display-name") as Iel;
  let bioElement: HTMLTextAreaElement | null = document.getElementById("bio") as HTMLTextAreaElement | null;
  let gradientCheckElement: Iel = document.getElementById("banner-gradient") as Iel;
  let c1Element: Iel = document.getElementById("banner-one") as Iel;
  let c2Element: Iel = document.getElementById("banner-two") as Iel;

  if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element) { return; }

  if (c) {
    c.color_one = c1Element.value;
    c.color_two = gradientCheckElement.checked ? c2Element.value : c1Element.value;
    c.display_name = displayNameElement.value;
    c.bio = bioElement.value;
  }
}

function setFontSize(e: Event): void {
  let el: el = e.currentTarget as el;
  if (!el) { return; }

  localStorage.setItem("smiggins-font-size", el.id.slice(10));
  document.body.dataset.fontSize = el.id.slice(10);
}

function saveProfile(e: Event): void {
  let displayNameElement: Iel = document.getElementById("display-name") as Iel;
  let bioElement: HTMLTextAreaElement | null = document.getElementById("bio") as HTMLTextAreaElement | null;
  let gradientCheckElement: Iel = document.getElementById("banner-gradient") as Iel;
  let c1Element: Iel = document.getElementById("banner-one") as Iel;
  let c2Element: Iel = document.getElementById("banner-two") as Iel;
  let pronounsElement: HTMLSelectElement | null = document.getElementById("pronouns") as HTMLSelectElement | null;
  let pronounsCustomElement: Iel = document.getElementById("pronouns-custom") as Iel;

  if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element || !pronounsElement || !pronounsCustomElement) { return; }

  (e.target as Bel)?.setAttribute("disabled", "");

  fetch("/api/user", {
    method: "PATCH",
    body: buildRequest([
      gradientCheckElement.checked,
      [displayNameElement.value, 8],
      [bioElement.value, 16],
      [pronounsElement.value === "custom" ? pronounsCustomElement.value : pronounsElement.value, 8],
      hexToBytes(c1Element.value.slice(1)),
      hexToBytes(c2Element.value.slice(1)),
    ])

  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { (e.target as Bel)?.removeAttribute("disabled"); })
    .catch((err: any): void => {
      (e.target as Bel)?.removeAttribute("disabled");
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
    body: buildRequest([[+defaultPostPrivate, 8]])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse);
}

function saveVerifyFollowers(): void {
  fetch("/api/user/verify_followers", {
    method: "PATCH",
    body: buildRequest([[+((document.getElementById("verify-followers") as Iel)?.checked || false), 8]])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse);
}

function settingsThemeSelection(): void {
  let themeElement: HTMLSelectElement | null = document.getElementById("theme") as HTMLSelectElement | null;

  if (themeElement) {
    let th: themes = themeElement.value as themes;
    setTheme(th);
  }
}

function settingsPFPShapeSelection(): void {
  let pfpElement: HTMLSelectElement | null = document.getElementById("pfp-shape") as HTMLSelectElement | null;

  if (pfpElement) {
    let shape: string = pfpElement.value;
    localStorage.setItem("smiggins-pfp-shape", shape);
    document.body.dataset.pfpShape = shape;
  }
}

function settingsCWCascadingSelection(): void {
  let cwElement: HTMLSelectElement | null = document.getElementById("cw-cascading") as HTMLSelectElement | null;

  if (cwElement) {
    let type: string = cwElement.value;
    localStorage.setItem("smiggins-cw-cascading", type);
  }
}

function changePasswordSuccess(token: string): void {
  setTokenCookie(token);
  createToast("Success!", "Your password has been changed.");

  let currentPwElement: el = document.getElementById("password-current");
  let newPwElement: el = document.getElementById("password-new");
  let confirmPwElement: el = document.getElementById("password-confirm");

  if (!currentPwElement || !newPwElement || !confirmPwElement) { return; }

  (currentPwElement as I).value = "";
  (newPwElement as I).value = "";
  (confirmPwElement as I).value = "";
}

function changePassword(e: Event): void {
  let currentPwElement: el = document.getElementById("password-current");
  let newPwElement: el = document.getElementById("password-new");
  let confirmPwElement: el = document.getElementById("password-confirm");

  if (!currentPwElement || !newPwElement || !confirmPwElement) { return; }

  let currentPw: string = (currentPwElement as I).value;
  let newPw: string = (newPwElement as I).value;
  let confirmPw: string = (confirmPwElement as I).value;

  if (!currentPw) { currentPwElement.focus(); return; }
  if (!newPw) { newPwElement.focus(); return; }
  if (confirmPw !== newPw) { confirmPwElement.focus(); return; }

  (e.target as Bel)?.setAttribute("disabled", "");

  fetch("/api/user/password", {
    method: "PATCH",
    body: buildRequest([
      hexToBytes(sha256(currentPw)),
      hexToBytes(sha256(newPw))
    ])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { (e.target as Bel)?.removeAttribute("disabled"); })
    .catch((err: any): void => {
      (e.target as Bel)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function deleteAccount(e: Event): void {
  let pwElement: el = document.getElementById("delete-acc-password");
  let confirmElement: el = document.getElementById("delete-acc-confirm");

  if (!pwElement || !confirmElement) { return; }

  let password: string = (pwElement as I).value;
  let confirmed: boolean = (confirmElement as I).checked;

  if (!password) { pwElement.focus(); return; }
  if (!confirmed) { confirmElement.focus(); return; }

  (e.target as Bel)?.setAttribute("disabled", "");

  fetch("/api/user", {
    method: "DELETE",
    body: buildRequest([
      hexToBytes(sha256(password)),
      [username, 8]
    ])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => { (e.target as Bel)?.removeAttribute("disabled"); })
    .catch((err: any): void => {
      (e.target as Bel)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function profileSettingsSetUserData(
  displayName: string,
  bio: string,
  pronouns: string,
  colorOne: string,
  colorTwo: string,
  gradient: boolean,
  verifyFollowers: boolean
) {
  let displayNameElement: Iel = document.getElementById("display-name") as Iel;
  let bioElement: HTMLTextAreaElement | null = document.getElementById("bio") as HTMLTextAreaElement | null;
  let gradientCheckElement: Iel = document.getElementById("banner-gradient") as Iel;
  let c1Element: Iel = document.getElementById("banner-one") as Iel;
  let c2Element: Iel = document.getElementById("banner-two") as Iel;
  let verifyElement: Iel = document.getElementById("verify-followers") as Iel;
  let pronounsElement: HTMLSelectElement | null = document.getElementById("pronouns") as HTMLSelectElement | null;
  let pronounsCustomElement: Iel = document.getElementById("pronouns-custom") as Iel;

  if (displayNameElement)   { displayNameElement.value = displayName; }
  if (bioElement)           { bioElement.value = bio;                  }
  if (gradientCheckElement) { gradientCheckElement.checked = gradient; }
  if (c1Element)            { c1Element.value = colorOne; c1Element.addEventListener("input", updateBannerColors); }
  if (c2Element)            { c2Element.value = colorTwo; c2Element.addEventListener("input", updateBannerColors); }
  if (verifyElement)        { verifyElement.checked = verifyFollowers; verifyElement.addEventListener("input", saveVerifyFollowers); }

  if (pronounsElement && pronounsCustomElement) {
    pronounsElement.addEventListener("input", function(): void {
      if (pronounsElement.value === "custom") {
        pronounsCustomElement.removeAttribute("hidden");
      } else {
        pronounsCustomElement.setAttribute("hidden", "");
      }
    });

    if (pronouns === "") {
      // do nothing, pronouns unset
    } else if (["he/him", "she/her", "they/them", "it/its"].includes(pronouns)) {
      pronounsElement.value = pronouns;
      pronounsCustomElement.setAttribute("hidden", "");
    } else {
      pronounsElement.value = "custom";
      pronounsCustomElement.value = pronouns;
      pronounsCustomElement.removeAttribute("hidden");
    }
  }

  document.getElementById("profile-save")?.addEventListener("click", saveProfile);
  document.getElementById("default-private")?.addEventListener("input", saveDefaultVisibility);
  document.getElementById("banner-gradient")?.addEventListener("input", updateBannerColors);

  let c: userData | undefined = userCache[username];

  if (c) {
    c.color_one = colorOne;
    c.color_two = gradient ? colorTwo : colorOne;
    c.display_name = displayName;
    c.bio = bio;
  }

  updateBannerColors();

  for (const el of document.querySelectorAll("[data-disabled-while-loading]")) {
    el.removeAttribute("disabled");
  }
}

function setKeybindElementData(kbId: string, el: D): void {
  let kbData = keybinds[kbId];

  let keyData: string = _kbGetKey(kbId);
  let key: string = keyData[0] + keyData.slice(1).split(":")[0];
  let modifiers: string = (keyData.slice(1).split(":")[1].split(",") as keybindModifiers[]).map((mod: keybindModifiers): string => ({
    alt: "Alt + ",
    ctrl: "Ctrl + ",
    nav: _kbGetKey("navModifier")[0] + _kbGetKey("navModifier").slice(1).split(":")[0] + " + ",
    shift: "Shift + "
  }[mod])).join("");

  let output: string = `<div class="generic-margin-top">${escapeHTML(kbData.name)}: <code class="kb-key">${escapeHTML(key == KB_DISABLED ? KB_DISABLED : modifiers + key)}</code> <button data-kb-id="${kbId}">Change</button></div>`;

  if (kbData.description) {
    output += `<small><div>${escapeHTML(kbData.description)}</div></small>`;
  }

  el.innerHTML = output;
  el.querySelector("button")?.addEventListener("click", (): void => { modifyKeybindModal(kbId); });
}

function p_settingsProfile(element: D): void {
  fetch("/api/user")
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_settingsCosmetic(element: D): void {
  element.querySelector(`#theme > option[value="${theme}"]`)?.setAttribute("selected", "");
  element.querySelector(`#pfp-shape > option[value="${localStorage.getItem("smiggins-pfp-shape") || "round"}"]`)?.setAttribute("selected", "");
  element.querySelector(`#cw-cascading > option[value="${localStorage.getItem("smiggins-cw-cascading") || "email"}"]`)?.setAttribute("selected", "");
  if (localStorage.getItem("smiggins-complex-timestamps")) { element.querySelector("#complex-timestamps")?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-expand-cws"))         { element.querySelector("#expand-cws")        ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-hide-interactions"))  { element.querySelector("#hide-interactions") ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-auto-show-posts"))    { element.querySelector("#auto-show")         ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-hide-changelog"))     { element.querySelector("#hide-changelog")    ?.setAttribute("checked", ""); }

  element.querySelector("#theme")             ?.addEventListener("change", settingsThemeSelection);
  element.querySelector("#pfp-shape")         ?.addEventListener("change", settingsPFPShapeSelection);
  element.querySelector("#cw-cascading")      ?.addEventListener("change", settingsCWCascadingSelection);
  element.querySelector("#complex-timestamps")?.addEventListener("change", genericCheckbox("smiggins-complex-timestamps"));
  element.querySelector("#expand-cws")        ?.addEventListener("change", genericCheckbox("smiggins-expand-cws"));
  element.querySelector("#hide-interactions") ?.addEventListener("change", genericCheckbox("smiggins-hide-interactions"));
  element.querySelector("#auto-show")         ?.addEventListener("change", genericCheckbox("smiggins-auto-show-posts"));
  element.querySelector("#hide-changelog")    ?.addEventListener("change", genericCheckbox("smiggins-hide-changelog"));

  for (const el of element.querySelectorAll("#font-size-selection > div")) {
    el.addEventListener("click", setFontSize);
  }
}

function p_settingsAccount(element: D): void {
  element.querySelector("#password-set")?.addEventListener("click", changePassword);
  element.querySelector("#delete-acc")?.addEventListener("click", deleteAccount);
}

function p_settingsKeybinds(element: D): void {
  for (const kb of element.querySelectorAll(".kb-input") as NodeListOf<D>) {
    let kbId: string = kb.dataset.kbId || "";

    if (kbId in keybinds) {
      setKeybindElementData(kbId, kb);
    }
  }
}

document.body.dataset.fontSize = localStorage.getItem("smiggins-font-size") || "normal";
document.body.dataset.pfpShape = localStorage.getItem("smiggins-pfp-shape") || "round";

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
  let c: UserData | undefined = userCache[username];
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

  if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element) { return; }

  new api_SaveProfile(
    gradientCheckElement.checked,
    displayNameElement.value,
    bioElement.value,
    pronounsElement && pronounsCustomElement ? (pronounsElement.value === "custom" ? pronounsCustomElement.value : pronounsElement.value) : "",
    c1Element.value.slice(1),
    c2Element.value.slice(1),
    e.target as Bel
  ).fetch();
}

function saveDefaultVisibility(): void {
  defaultPostPrivate = (document.getElementById("default-private") as HTMLSelectElement | null)?.value === "true";
  snippetVariables.selected_if_default_private = defaultPostPrivate ? "selected" : "";
  snippetVariables.checked_if_default_private = defaultPostPrivate ? "checked" : "";
  new api_DefaultVisibility(defaultPostPrivate).fetch();
}

function saveVerifyFollowers(): void {
  new api_VerifyFollowers((document.getElementById("verify-followers") as Iel)?.checked || false).fetch();
}

function settingsThemeSelection(): void {
  let themeElement: HTMLSelectElement | null = document.getElementById("theme") as HTMLSelectElement | null;

  if (themeElement) {
    let th: Themes = themeElement.value as Themes;
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
  createToast(L.generic.success, L.settings.account.password_changed);

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

  new api_ChangePassword(currentPw, newPw, e.target as Bel).fetch();
}

function deleteAccount(e: Event): void {
  let pwElement: el = document.getElementById("delete-acc-password");
  let confirmElement: el = document.getElementById("delete-acc-confirm");

  if (!pwElement || !confirmElement) { return; }

  let password: string = (pwElement as I).value;
  let confirmed: boolean = (confirmElement as I).checked;

  if (!password) { pwElement.focus(); return; }
  if (!confirmed) { confirmElement.focus(); return; }

  new api_DeleteAccount(username, password, e.target as Bel).fetch();
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
    } else if (L.settings.profile.pronouns_presets.includes(pronouns)) {
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

  let c: UserData | undefined = userCache[username];

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
  setKeybindStrings();

  let kbData = keybinds[kbId];

  let keyData: string = _kbGetKey(kbId);
  let key: string = keyData[0] + keyData.slice(1).split(":")[0];
  let modifiers: string = (keyData.slice(1).split(":")[1].split(",") as KeybindModifiers[]).map((mod: KeybindModifiers): string => ({
    alt: L.keybinds.modifiers.alt + " + ",
    ctrl: L.keybinds.modifiers.ctrl + " + ",
    nav: _kbGetKey("navModifier")[0] + _kbGetKey("navModifier").slice(1).split(":")[0] + " + ",
    shift: L.keybinds.modifiers.shift + " + "
  }[mod])).join("");

  if (key === KB_DISABLED) {
    key = L.keybinds.modifiers.disabled;
  }

  let output: string = `<div class="generic-margin-top">${escapeHTML(kbData.name || "")}: <code class="kb-key">${escapeHTML(key == KB_DISABLED ? KB_DISABLED : modifiers + key)}</code> <button data-kb-id="${kbId}">${L.keybinds.button_change}</button></div>`;

  if (kbData.description) {
    output += `<small><div>${escapeHTML(kbData.description)}</div></small>`;
  }

  el.innerHTML = output;
  el.querySelector("button")?.addEventListener("click", (): void => { modifyKeybindModal(kbId); });
}

function exportSettings(): void {
  let settings: SettingsExport = {
    autoShowPosts: Boolean(localStorage.getItem("smiggins-auto-show-posts")),
    complexTimestamps: Boolean(localStorage.getItem("smiggins-complex-timestamps")),
    cwCascading: localStorage.getItem("smiggins-cw-cascading") || "email",
    expandCws: Boolean(localStorage.getItem("smiggins-expand-cws")),
    fontSize: localStorage.getItem("smiggins-font-size") || "normal",
    hideChangelog: Boolean(localStorage.getItem("smiggins-hide-changelog")),
    hideInteractions: Boolean(localStorage.getItem("smiggins-hide-interactions")),
    language: localStorage.getItem("smiggins-language") as languages | null || L.meta.id,
    noLikeGrouping: Boolean(localStorage.getItem("smiggins-no-like-grouping")),
    pfpShape: localStorage.getItem("smiggins-php-shape") || "round",
    theme: (localStorage.getItem("smiggins-theme") as Themes | null) || "system",

    homeTimeline: {
      comments: Boolean(localStorage.getItem("smiggins-home-comments")),
      default: localStorage.getItem("smiggins-home") || "global"
    },

    keybinds: {
      hamburgerDelete: _kbGetKey("hamburgerDelete"),
      hamburgerEdit: _kbGetKey("hamburgerEdit"),
      hamburgerEmbed: _kbGetKey("hamburgerEmbed"),
      hamburgerPin: _kbGetKey("hamburgerPin"),
      hamburgerShare: _kbGetKey("hamburgerShare"),
      loadNewPosts: _kbGetKey("loadNewPosts"),
      navAdmin: _kbGetKey("navAdmin"),
      navHome: _kbGetKey("navHome"),
      navModifier: _kbGetKey("navModifier"),
      navNotifications: _kbGetKey("navNotifications"),
      navProfile: _kbGetKey("navProfile"),
      navSettings: _kbGetKey("navSettings"),
      newPost: _kbGetKey("newPost"),
      topOfTimeline: _kbGetKey("topOfTimeline")
    }
  };

  let element: HTMLAnchorElement = document.createElement("a");

  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(settings)));
  element.setAttribute("download", `${pageTitle}.json`);
  element.style.display = "none";

  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function _lsBoolean(data: boolean, key: string): void {
  if (data) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
}

function importSettings(data: SettingsExport): void {
  _lsBoolean(data.autoShowPosts, "smiggins-auto-show-posts");
  _lsBoolean(data.complexTimestamps, "smiggins-complex-timestamps");
  localStorage.setItem("smiggins-cw-cascading", data.cwCascading || "email");
  _lsBoolean(data.expandCws, "smiggins-expand-cws");
  localStorage.setItem("smiggins-font-size", data.fontSize || "normal");
  _lsBoolean(data.hideChangelog, "smiggins-hide-changelog");
  _lsBoolean(data.hideInteractions, "smiggins-hide-interactions");
  _lsBoolean(data.noLikeGrouping, "smiggins-no-like-grouping");
  localStorage.setItem("smiggins-pfp-shape", data.pfpShape || "round");
  localStorage.setItem("smiggins-theme", data.theme || "system");
  localStorage.setItem("smiggins-language", data.theme || DEFAULT_LANGUAGE);

  _lsBoolean(data.homeTimeline.comments, "smiggins-home-comments");
  localStorage.setItem("smiggins-home", data.homeTimeline.default || "global");

  localStorage.setItem("smiggins-keybind-hamburgerDelete",  data.keybinds.hamburgerDelete  || _kbGetKey("hamburgerDelete"));
  localStorage.setItem("smiggins-keybind-hamburgerEdit",    data.keybinds.hamburgerEdit    || _kbGetKey("hamburgerEdit"));
  localStorage.setItem("smiggins-keybind-hamburgerEmbed",   data.keybinds.hamburgerEmbed   || _kbGetKey("hamburgerEmbed"));
  localStorage.setItem("smiggins-keybind-hamburgerPin",     data.keybinds.hamburgerPin     || _kbGetKey("hamburgerPin"));
  localStorage.setItem("smiggins-keybind-hamburgerShare",   data.keybinds.hamburgerShare   || _kbGetKey("hamburgerShare"));
  localStorage.setItem("smiggins-keybind-loadNewPosts",     data.keybinds.loadNewPosts     || _kbGetKey("loadNewPosts"));
  localStorage.setItem("smiggins-keybind-navAdmin",         data.keybinds.navAdmin         || _kbGetKey("navAdmin"));
  localStorage.setItem("smiggins-keybind-navHome",          data.keybinds.navHome          || _kbGetKey("navHome"));
  localStorage.setItem("smiggins-keybind-navModifier",      data.keybinds.navModifier      || _kbGetKey("navModifier"));
  localStorage.setItem("smiggins-keybind-navNotifications", data.keybinds.navNotifications || _kbGetKey("navNotifications"));
  localStorage.setItem("smiggins-keybind-navProfile",       data.keybinds.navProfile       || _kbGetKey("navProfile"));
  localStorage.setItem("smiggins-keybind-navSettings",      data.keybinds.navSettings      || _kbGetKey("navSettings"));
  localStorage.setItem("smiggins-keybind-newPost",          data.keybinds.newPost          || _kbGetKey("newPost"));
  localStorage.setItem("smiggins-keybind-topOfTimeline",    data.keybinds.topOfTimeline    || _kbGetKey("topOfTimeline"));

  location.href = location.origin + location.pathname + location.search;
}

function p_settingsProfile(element: D): void {
  new api_GetProfile().fetch();
}

function p_settingsCosmetic(element: D): void {
  element.querySelector(`#theme > option[value="${theme}"]`)?.setAttribute("selected", "");
  element.querySelector(`#pfp-shape > option[value="${localStorage.getItem("smiggins-pfp-shape") || "round"}"]`)?.setAttribute("selected", "");
  element.querySelector(`#cw-cascading > option[value="${localStorage.getItem("smiggins-cw-cascading") || "email"}"]`)?.setAttribute("selected", "");
  element.querySelector(`#language > option[value="${localStorage.getItem("smiggins-language") || L.meta.id}"]`)?.setAttribute("selected", "");
  if (localStorage.getItem("smiggins-complex-timestamps")) { element.querySelector("#complex-timestamps")?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-hide-interactions"))  { element.querySelector("#hide-interactions") ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-expand-cws"))         { element.querySelector("#expand-cws")        ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-hide-changelog"))     { element.querySelector("#hide-changelog")    ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-no-like-grouping"))   { element.querySelector("#no-like-grouping")  ?.setAttribute("checked", ""); }
  if (localStorage.getItem("smiggins-auto-show-posts"))    { element.querySelector("#auto-show")         ?.setAttribute("checked", ""); }

  element.querySelector("#theme")             ?.addEventListener("change", settingsThemeSelection);
  element.querySelector("#pfp-shape")         ?.addEventListener("change", settingsPFPShapeSelection);
  element.querySelector("#cw-cascading")      ?.addEventListener("change", settingsCWCascadingSelection);
  element.querySelector("#complex-timestamps")?.addEventListener("change", genericCheckbox("smiggins-complex-timestamps"));
  element.querySelector("#hide-interactions") ?.addEventListener("change", genericCheckbox("smiggins-hide-interactions"));
  element.querySelector("#expand-cws")        ?.addEventListener("change", genericCheckbox("smiggins-expand-cws"));
  element.querySelector("#hide-changelog")    ?.addEventListener("change", genericCheckbox("smiggins-hide-changelog"));
  element.querySelector("#no-like-grouping")  ?.addEventListener("change", genericCheckbox("smiggins-no-like-grouping"));
  element.querySelector("#auto-show")         ?.addEventListener("change", genericCheckbox("smiggins-auto-show-posts"));

  element.querySelector("#language")?.addEventListener("change", (): void => {
    let newLang: string | undefined = (document.getElementById("language") as Iel)?.value;

    if (newLang && Object.keys(LANGS).includes(newLang)) {
      localStorage.setItem("smiggins-language", newLang);
      L = LANGS[newLang as languages];
      renderPage("settings/cosmetic");
    }
  })

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

function p_settingsIndex(element: D): void {
  element.querySelector("#export")?.addEventListener("click", exportSettings);

  let importEl: Iel = element.querySelector("#import") as Iel;
  importEl?.addEventListener("input", function(e: Event): void {
    let files: FileList | null = importEl.files;

    if (files && files.length) {
      let file: File = files[0];
      let reader: FileReader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>): void => {
        const file: string | ArrayBuffer | null | undefined = e.target?.result;

        if (typeof file === "string") {
          importSettings(JSON.parse(file));
        }
      }

      reader.readAsText(file);
    }
  });
}

document.body.dataset.fontSize = localStorage.getItem("smiggins-font-size") || "normal";
document.body.dataset.pfpShape = localStorage.getItem("smiggins-pfp-shape") || "round";

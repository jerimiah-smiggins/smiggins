function settingsThemeSelection(e: Event) {
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
  //
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

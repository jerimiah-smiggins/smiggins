function loginSubmitEvent(e: MouseEvent): void {
  let usernameElement: HTMLElement | null = document.getElementById("username");
  let passwordElement: HTMLElement | null = document.getElementById("password");

  if (!usernameElement || !passwordElement) { return; }

  let username: string = (usernameElement as HTMLInputElement).value;
  let password: string = (passwordElement as HTMLInputElement).value;

  if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }

  (e.target as HTMLButtonElement | null)?.setAttribute("disabled", "");

  fetch("/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: sha256(password)
    }),
    headers: { Accept: "application/json" }
  }).then((response: Response): Promise<api_login> => (response.json()))
    .then((json: api_login): void => {
      if (json.success) {
        document.cookie = `token=${json.token};Path=/;SameSite=Lax;Expires=${new Date(Date.now() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
        location.href = "/";
      } else {
        (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
        createToast(...errorCodeStrings(json.reason, "login"));
      }
    })
    .catch((err: any): void => {
      (e.target as HTMLButtonElement | null)?.removeAttribute("disabled");
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function p_login(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement).addEventListener("click", loginSubmitEvent);
}

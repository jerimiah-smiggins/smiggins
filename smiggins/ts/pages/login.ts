function loginSubmitEvent(e: MouseEvent) {
  let usernameElement: HTMLElement | null = document.getElementById("username");
  let passwordElement: HTMLElement | null = document.getElementById("password");

  if (!usernameElement || !passwordElement) { return; }

  let username: string = (usernameElement as HTMLInputElement).value;
  let password: string = (passwordElement as HTMLInputElement).value;

  if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }

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
        document.cookie = `token=${json.token};Path=/;SameSite=Lax;Expires=${new Date(new Date().getTime() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
        location.href = "/";
      } else {
        switch (json.reason) {
          case "BAD_USERNAME": createToast("Incorrect username.", `User '${escapeHTML(username)}' does not exist.`); usernameElement.focus(); break;
          case "BAD_PASSWORD": createToast("Incorrect password."); passwordElement.focus(); break;
          case "RATELIMIT": createToast("Ratelimited.", "Try again in a few seconds."); break;
          default: createToast("Something went wrong!");
        }
      }
    })
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function processLogin(element: HTMLDivElement): void {
  (element.querySelector("#submit") as HTMLButtonElement).addEventListener("click", loginSubmitEvent);
}

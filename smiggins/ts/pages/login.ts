function loginSubmitEvent(e: MouseEvent): void {
  let usernameElement: el = document.getElementById("username");
  let passwordElement: el = document.getElementById("password");

  if (!usernameElement || !passwordElement) { return; }

  let username: string = (usernameElement as I).value;
  let password: string = (passwordElement as I).value;

  if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }

  new api_LogIn(username, password, e.target as Bel).fetch();
}

function signupSubmitEvent(e: MouseEvent): void {
  let usernameElement: el = document.getElementById("username");
  let passwordElement: el = document.getElementById("password");
  let confirmElement: el = document.getElementById("confirm");
  let otpElement: el = document.getElementById("otp");

  if (!usernameElement || !passwordElement || !confirmElement) { return; }

  let username: string = (usernameElement as I).value;
  let password: string = (passwordElement as I).value;
  let confirm: string = (confirmElement as I).value;

  let otp: string | null = null;
  if (otpElement) { otp = (otpElement as I).value }

  if (otpElement && !otp) { otpElement.focus(); return; }
  else if (!username) { usernameElement.focus(); return; }
  else if (!password) { passwordElement.focus(); return; }
  else if (password !== confirm) {
    confirmElement.focus();
    createToast("Passwords don't match.");
    return;
  }

  new api_SignUp(username, password, e.target as Bel).fetch();
}

function p_login(element: D): void {
  (element.querySelector("#submit") as B).addEventListener("click", loginSubmitEvent);
}

function p_signup(element: D): void {
  (element.querySelector("#submit") as Bel)?.addEventListener("click", signupSubmitEvent);
}

declare let formURL: string;

dom("save").addEventListener("click", function() {
  if (!(dom("confirm") as HTMLInputElement).value || !(dom("password") as HTMLInputElement).value) {
    return;
  }

  if ((dom("password") as HTMLInputElement).value !== (dom("confirm") as HTMLInputElement).value) {
    showlog(lang.account.password_match_failure);
    return;
  }

  s_fetch(formURL, {
    body: JSON.stringify({
      passhash: sha256((dom("password") as HTMLInputElement).value)
    }),
    method: "POST"
  });
});

dom("toggle-password").addEventListener("click", function(): void {
  let newType: string = dom("password").getAttribute("type") === "password" ? "text" : "password";

  dom("password").setAttribute("type", newType);
  dom("confirm").setAttribute("type", newType);
});

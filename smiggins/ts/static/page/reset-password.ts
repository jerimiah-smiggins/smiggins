function resetPasswordInit(): void {
  dom("submit").addEventListener("click", function(): void {
    s_fetch("/api/email/password", {
      method: "POST",
      body: JSON.stringify({
        username: (dom("username") as HTMLInputElement).value
      }),
      disable: [dom("username"), dom("submit")]
    });
  });
}

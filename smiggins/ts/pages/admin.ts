function adminDeletePost(): void {
  let pidElement: Iel = document.getElementById("delete-post-id") as Iel;
  if (!pidElement) { return; }

  if (!pidElement.value) {
    pidElement.focus();
    return;
  }

  let postId: number = +pidElement.value;

  fetch("/api/post", {
    method: "DELETE",
    body: buildRequest([[postId, 32]])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .then((): void => createToast("Success!", "This post has been deleted."))
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminDeleteUser(): void {
  let usernameElement: Iel = document.getElementById("delete-user-username") as Iel;
  let confElement: Iel = document.getElementById("delete-user-confirm") as Iel;

  if (!usernameElement || !confElement) { return; }

  if (!usernameElement.value) {
    usernameElement.focus();
    return;
  }

  if (!confElement.checked) {
    confElement.focus();
    return;
  }

  fetch("/api/admin/user", {
    method: "DELETE",
    body: usernameElement.value
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminCreateOTP(): void {
  fetch("/api/admin/invite", {
    method: "POST"
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminDeleteOTP(e: Event): void {
  let el: Bel = e.target as Bel;
  if (!el) { return; }

  let otp: string = el.dataset.otp || "";

  for (const item of document.querySelectorAll(`[data-otp-container="${otp}"]`)) {
    item.remove();
  }

  fetch("/api/admin/invite", {
    method: "DELETE",
    body: buildRequest([hexToBytes(otp)])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminListOTPs(): void {
  let el: el = document.getElementById("otp-list");
  if (el) { el.removeAttribute("hidden"); el.innerHTML = "<i>Loading...</i>"; }

  fetch("/api/admin/invite")
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminLoadPermissions(): void {
  let userElement: Iel = document.getElementById("permissions-username") as Iel;
  if (!userElement) { return; }

  if (!userElement.value) {
    userElement.focus();
    return;
  }

  fetch(`/api/admin/permissions/${userElement.value}`)
    .then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminSavePermissions(): void {
  let userElement: Iel = document.getElementById("permissions-username") as Iel;
  if (!userElement) { return; }

  if (!userElement.value) {
    userElement.focus();
    return;
  }

  let val: number = 0;

  for (const el of document.querySelectorAll("[data-admin-permissions]") as NodeListOf<I>) {
    if (el.checked && el.dataset.adminPermissions) {
      val |= 1 << +el.dataset.adminPermissions;
    }
  }

  fetch("/api/admin/permissions", {
    method: "POST",
    body: buildRequest([[val, 16], [userElement.value, 8]])
  }).then((response: Response): Promise<ArrayBuffer> => (response.arrayBuffer()))
    .then(parseResponse)
    .catch((err: any): void => {
      createToast("Something went wrong!", String(err));
      throw err;
    });
}

function adminSetPermissionCheckboxes(lvl: number): void {
  for (const el of document.querySelectorAll("[data-admin-permissions]") as NodeListOf<I>) {
    el.checked = Boolean(lvl & (1 << +(el.dataset.adminPermissions || 0)));
  }
}

function p_admin(element: D): void {
  element.querySelector("#delete-post")?.addEventListener("click", adminDeletePost);
  element.querySelector("#delete-user")?.addEventListener("click", adminDeleteUser);
  element.querySelector("#generate-otp")?.addEventListener("click", adminCreateOTP);
  element.querySelector("#list-otps")?.addEventListener("click", adminListOTPs);
  element.querySelector("#permissions-load")?.addEventListener("click", adminLoadPermissions);
  element.querySelector("#permissions-save")?.addEventListener("click", adminSavePermissions);
}

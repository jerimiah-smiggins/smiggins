function adminDeletePost(): void {
  let pidElement: Iel = document.getElementById("delete-post-id") as Iel;
  if (!pidElement) { return; }

  if (!pidElement.value) {
    pidElement.focus();
    return;
  }

  new api_DeletePost(+pidElement.value).fetch();
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

  new api_AdminDeleteUser(usernameElement.value).fetch();
}

function adminCreateOTP(): void {
  new api_GenerateOTP().fetch();
}

function adminDeleteOTP(e: Event): void {
  let el: Bel = e.target as Bel;
  if (!el) { return; }

  let otp: string = el.dataset.otp || "";

  for (const item of document.querySelectorAll(`[data-otp-container="${otp}"]`)) {
    item.remove();
  }

  new api_DeleteOTP(otp).fetch()
}

function adminListOTPs(): void {
  let el: el = document.getElementById("otp-list");

  if (el) {
    el.removeAttribute("hidden");
    el.innerHTML = `<i>${L.generic.loading}</i>`;
  }

  new api_ListOTP().fetch();
}

function adminLoadPermissions(): void {
  let userElement: Iel = document.getElementById("permissions-username") as Iel;
  if (!userElement) { return; }

  if (!userElement.value) {
    userElement.focus();
    return;
  }

  new api_GetAdminPermissions(userElement.value).fetch();
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

  new api_SetAdminPermissions(userElement.value, val).fetch();
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

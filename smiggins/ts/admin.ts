declare const adminLevel: number;

inc = 0;
home = true;

enum Mask {
  DeletePost,
  DeleteUser,
  CreateBadge,
  DeleteBadge,
  GiveBadges,
  ModifyAccount,
  AccSwitcher,
  AdminLevel,
  ReadLogs,
  GenerateOTP
};

function testMask(identifier: number, level: number=adminLevel): boolean {
  return !!(level >> identifier & 1);
}

ENABLE_POST_DELETION && testMask(Mask.DeletePost) && dom("post-delete").addEventListener("click", function(): void {
  s_fetch(`/api/${(dom("comment-toggle") as HTMLInputElement).checked ? "comment" : "post"}`, {
    method: "DELETE",
    body: JSON.stringify({
      id: Number((dom("post-id") as HTMLInputElement).value)
    }),
    disable: [this, dom("post-id")],
    postFunction: (success: boolean) => {
      if (success) {
        toast(lang.generic.success);
      }
    }
  });
});

testMask(Mask.DeleteUser) && dom("account-delete").addEventListener("click", function(): void {
  s_fetch("/api/admin/user", {
    method: "DELETE",
    body: JSON.stringify({
      identifier: (dom("account-del-identifier") as HTMLInputElement).value,
      use_id: (dom("delete-id-toggle") as HTMLInputElement).checked
    }),
    disable: [this, dom("account-del-identifier")]
  });
});

ENABLE_BADGES && testMask(Mask.GiveBadges) && adminLevel >= 3 && dom("badge-add").addEventListener("click", function(): void {
  s_fetch("/api/admin/badge", {
    method: "POST",
    body: JSON.stringify({
      identifier: (dom("badge-identifier") as HTMLInputElement).value,
      use_id: (dom("badge-use-id") as HTMLInputElement).checked,
      badge_name: (dom("badge-name") as HTMLInputElement).value
    }),
    disable: [this, dom("badge-identifier"), dom("badge-use-id"), dom("badge-name")]
  });
});

ENABLE_BADGES && testMask(Mask.GiveBadges) && adminLevel >= 3 && dom("badge-remove").addEventListener("click", function(): void {
  s_fetch("/api/admin/badge", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: (dom("badge-identifier") as HTMLInputElement).value,
      use_id: (dom("badge-use-id") as HTMLInputElement).checked,
      badge_name: (dom("badge-name") as HTMLInputElement).value
    }),
    disable: [this, dom("badge-identifier"), dom("badge-use-id"), dom("badge-name")]
  });
});

ENABLE_BADGES && testMask(Mask.CreateBadge) && dom("badge-create").addEventListener("click", function(): void {
  s_fetch("/api/admin/badge", {
    method: "PUT",
    body: JSON.stringify({
      badge_name: (dom("badge-create-name") as HTMLInputElement).value,
      badge_data: (dom("badge-create-data") as HTMLInputElement).value
    }),
    disable: [this, dom("badge-create-name"), dom("badge-create-data")]
  });
});

ENABLE_BADGES && testMask(Mask.DeleteBadge) && dom("badge-delete").addEventListener("click", function(): void {
  s_fetch("/api/admin/badge", {
    method: "DELETE",
    body: JSON.stringify({
      badge_name: (dom("badge-delete-name") as HTMLInputElement).value
    }),
    disable: [this, dom("badge-delete-name")]
  });
});

testMask(Mask.ModifyAccount) && dom("data-get").addEventListener("click", function(): void {
  s_fetch(`/api/admin/info?identifier=${(dom("data-identifier") as HTMLInputElement).value}&use_id=${(dom("data-use-id") as HTMLInputElement).checked}`, {
    disable: [this, dom("data-identifier")]
  });
});

testMask(Mask.ReadLogs) && dom("load-logs").addEventListener("click", function(): void {
  s_fetch("/api/admin/logs", {
    disable: [this]
  })
});

testMask(Mask.AdminLevel) && dom("level-set").addEventListener("click", function(): void {
  s_fetch("/api/admin/level", {
    method: "PATCH",
    body: JSON.stringify({
      identifier: (dom("level-identifier") as HTMLInputElement).value,
      use_id: (dom("level-use-id") as HTMLInputElement).checked,
      level: parseInt(forEach(
        document.querySelectorAll("#level-selection input[type='checkbox']"),
        (val: HTMLInputElement, index: number) => (+val.checked)
      ).reverse().join(""), 2)
    }),
    disable: [this, dom("level-identifier")]
  });
});

testMask(Mask.AdminLevel) && dom("level-load").addEventListener("click", function(): void {
  s_fetch(`/api/admin/level?identifier=${(dom("level-identifier") as HTMLInputElement).value}&use_id=${(dom("level-use-id") as HTMLInputElement).checked}`, {
    disable: [this, dom("level-identifier")]
  });
});

testMask(Mask.GenerateOTP) && dom("otp-create").addEventListener("click", function(): void {
  s_fetch("/api/admin/otp", {
    method: "POST",
    disable: [this]
  });
});

testMask(Mask.GenerateOTP) && dom("otp-load").addEventListener("click", function(): void {
  s_fetch("/api/admin/otp", {
    disable: [this]
  });
});

if (testMask(Mask.GenerateOTP)) {
  function deleteOTP (code: string): void {
    s_fetch("/api/admin/otp", {
      method: "DELETE",
      body: JSON.stringify({
        otp: code
      }),
      disable: [this]
    });
  }
}
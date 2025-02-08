function refreshNotifications(): void {
  dom("notif-container").innerHTML = "";
  s_fetch("/api/user/notifications", {
    disable: [dom("refresh")]
  });
}

function notificationsInit(): void {
  timelineConfig.disableTimeline = true;

  dom("read").addEventListener("click", function(): void {
    s_fetch("/api/user/notifications", {
      method: "PATCH",
      disable: [this]
    });
  });

  dom("delete-unread").addEventListener("click", function(): void {
    s_fetch("/api/user/notifications", {
      method: "DELETE",
      disable: [this]
    });
  });

  dom("refresh").addEventListener("click", refreshNotifications);
  refreshNotifications();
}

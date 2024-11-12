home = true;
disableTimeline = true;

function refreshNotifications(): void {
  dom("notif-container").innerHTML = "";
  s_fetch("/api/user/notifications", {
    disable: [dom("refresh")]
  });
}

dom("read").addEventListener("click", function(): void {
  s_fetch("/api/user/notifications", {
    method: "DELETE",
    disable: [dom("read")]
  });
});

dom("refresh").addEventListener("click", refreshNotifications);
refreshNotifications();

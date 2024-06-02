home = true;
disableTimeline = true;

function refreshNotifications(): void {
  dom("notif-container").innerHTML = "";

  fetch("/api/user/notifications")
    .then((response: Response) => (response.json()))
    .then((json: {
      notifications: {
        data: _postJSON,
        read: boolean,
        event_type: string
      }[],
      success: boolean
    }) => {
      if (json.success) {
        let x: DocumentFragment = document.createDocumentFragment();
        let yourMother: boolean = false;
        let first: boolean = true;

        for (const notif of json.notifications) {
          if (notif.data.can_view) {
            let y: HTMLElement = document.createElement("div");

            if (!yourMother && notif.read) {
              if (!first) {
                y.innerHTML = "<hr>";
              }

              yourMother = true;
            }

            y.innerHTML += escapeHTML(lang.notifications[notif.event_type].replaceAll("%s", notif.data.creator.display_name)) + "<br>";
            y.innerHTML += getPostHTML(
              notif.data, // postJSON
              ["comment", "ping_c"].includes(notif.event_type),
            ).replace("\"post\"", yourMother ? "\"post\" data-color='gray'" : "\"post\"");

            x.append(y);
            x.append(document.createElement("br"));

            first = false;
          }
        }

        dom("notif-container").append(x);
      } else {
        showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.notifications.error));
      }
  }).catch((err: Error) => {
    showlog(lang.generic.something_went_wrong_x.replaceAll("%s", lang.notifications.error));
  });
}

dom("read").addEventListener("click", function(): void {
  fetch("/api/user/notifications", {
    "method": "DELETE"
  }).then((): void => {
    refreshNotifications();
    forEach(
      document.querySelectorAll("[data-add-notification-dot]"),
      (val: HTMLElement, index: number): void => {
        val.classList.remove("dot");
      }
    );
  });
});

dom("refresh").addEventListener("click", refreshNotifications);
refreshNotifications();

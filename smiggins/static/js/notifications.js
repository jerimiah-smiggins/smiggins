let home = true;
let req = 0, inc = 0;

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

const stringMap = {
  comment: (display_name) => (`${display_name} commented on your post:`),
  quote: (display_name) => (`${display_name} quoted your post:`),
  ping_p: (display_name) => (`${display_name} mentioned you in a post:`),
  ping_c: (display_name) => (`${display_name} mentioned you in a comment:`)
}

function refresh() {
  dom("notif-container").innerHTML = "";

  fetch("/api/user/notifications")
    .then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        let x = document.createDocumentFragment();
        let yourMother = false;
        let first = true;

        for (const notif of json.notifications) {
          if (notif.data.can_view) {
            let y = document.createElement("div");

            if (!yourMother && notif.read) {
              if (!first) {
                y.innerHTML = "<hr>";
              }

              yourMother = true;
            }

            notif.data.can_delete = false;
            notif.data.can_pin = false;

            y.innerHTML += escapeHTML(stringMap[notif.event_type](notif.data.creator.display_name)) + "<br>";
            y.innerHTML += getPostHTML(
              notif.data, // postJSON
              ["comment", "ping_c"].includes(notif.event_type), // isComment
              true,      // includeUserLink
              true,      // includePostLink
              false      // isOwner
            ).replaceAll("<button", "<button disabled")
            .replace("\"post\"", yourMother ? "\"post\" data-color='gray'" : "\"post\"");

            x.append(y);
            x.append(document.createElement("br"));

            first = false;
          }
        }

        dom("notif-container").append(x);
      } else {
        showlog("Something went wrong loading the notifications list!");
      }
  }).catch((err) => {
    showlog("Something went wrong loading the notification list!");
    throw err;
  });
}

function addQuote()   {}
function toggleLike() {}

dom("read").addEventListener("click", function() {
  fetch("/api/user/notifications", {
    "method": "DELETE"
  }).then(() => {
    refresh();
    [...document.querySelectorAll("[data-add-notification-dot]")].forEach((val, index) => {
      val.classList.remove("dot");
    });
  });
});

dom("refresh").addEventListener("click", refresh);
refresh();

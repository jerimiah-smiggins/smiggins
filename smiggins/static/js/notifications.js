let home = true;
let req = 0, inc = 0;

showlog = (str, time=3000) => {
  inc++;
  dom("error").innerText = str;
  setTimeout(() => { req++; if (req == inc) { dom("error").innerText = ""; }}, time);
};

function refresh() {
  dom("notif-container").innerHTML = "";

  fetch("/api/user/notifications")
    .then((response) => (response.json()))
    .then((json) => {
      if (json.success) {
        x = document.createDocumentFragment();
        let yourMother = false;
        let first = true;

        for (const notif of json.notifications) {
          y = document.createElement("div");

          if (!yourMother && notif.read) {
            if (!first) {
              y.innerHTML = "<hr>";
            }

            yourMother = true;
          }

          first = false;

          y.innerHTML += getPostHTML(
            notif.data.content,          // content
            notif.data.post_id,          // postID
            notif.data.creator.username, // username
            notif.data.creator.display_name, // displayName
            notif.data.creator.pronouns, // userPronouns
            notif.data.timestamp,        // timestamp
            notif.data.comments,         // commentCount
            notif.data.likes,            // likeCount
            notif.data.quotes,           // quoteCount
            notif.data.quote,            // quote
            notif.data.liked,            // isLiked
            notif.data.creator.private,  // isPrivate
            ["comment", "ping_c"].includes(notif.event_type), // isComment
            true,                        // includeUserLink
            true,                        // includePostLink
            false,                       // isOwner
            notif.data.creator.badges    // badgeData
          ).replace("\"post\"", yourMother ? "\"post\" data-color='gray'" : "\"post\"");

          x.append(y);
          x.append(document.createElement("br"));
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

dom("read").addEventListener("click", function() {
  fetch("/api/user/notifications", {
    "method": "DELETE"
  }).then(() => { refresh(); });
});

dom("refresh").addEventListener("click", refresh);
refresh();

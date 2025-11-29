// ex. a value of 4 would show:
// a, b, c, and d liked your post
// a, b, c, d, and n other(s) liked your post
const NUM_USERS_LIKE_NOTIF: number = 4;

enum NotificationCodes {
  Comment = 1,
  Quote,
  Ping,
  Like
};

function p_notifications(element: D): void {
  pendingNotifications.notifications = false;
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    "notifications": { url: "/api/timeline/notifications", disableCaching: true, prependPosts: false, customRender: renderNotificationTimeline, customForward: handleNotificationForward }
  }, "notifications", element);
}

function _getLikeNotification(posts: post[]): D {
  let recentTimestamp: number = 0;
  let users: string[] = posts.map((a: post, index: number): [string | null, string] | null => {
    if (!offset.lower || a.timestamp < offset.lower) { offset.lower = a.timestamp; }
    if (!offset.upper || a.timestamp > offset.upper) { offset.upper = a.timestamp; }

    if (a.timestamp > recentTimestamp) { recentTimestamp = a.timestamp; }

    if (index > NUM_USERS_LIKE_NOTIF) { return null; }
    return [a.user.username, a.user.display_name];
  }).map((a: [username: string | null, displayName: string] | null): string => {
    if (a === null) {
      return "";
    }

    let htmlStart: string = "<b>";
    let htmlEnd: string = "</b>";

    if (a[0]) {
      htmlStart += `<a class="plain-link" data-internal-link="user" href="/u/${a[0]}/">`;
      htmlEnd = "</a>" + htmlEnd;
    }

    return htmlStart + escapeHTML(a[1]) + htmlEnd;
  });

  let lengthDifference: number = posts.length - users.length
  let userFull: string;
  if (lengthDifference === 0) {
    if (users.length === 1) {
      userFull = users[0];
    } else if (users.length === 2) {
      userFull = users.join(" and ");
    } else {
      users[users.length - 1] = "and " + users[users.length - 1];
      userFull = users.join(", ");
    }
  } else if (lengthDifference === 1) {
    userFull = users.join(", ") + ", and <b>1 other</b>";
  } else {
    userFull = users.join(", ") + `, and <b>${lengthDifference} others</b>`;
  }

  return getSnippet("notification-like", {
    pid: String(posts[0].id),
    timestamp: getTimestamp(recentTimestamp),
    content: [simplePostContent(posts[0]), 1],
    names: [userFull, 1],
  });
}

function renderNotificationTimeline(
  posts: [post, notificationType: number][],
  end: boolean,
  updateCache: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  if (offset.lower === null && posts.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = "None";

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();

  let pendingLikes: { [key: number]: post[] } = {};
  let pendingLikeOrder: number[] = [];
  let previousRead: boolean = false;
  for (const post of posts) {
    let nc: NotificationCodes = post[1] & 0b01111111;
    let read: boolean = !(post[1] & 0x80);

    // add any new likes to the timeline when switching from unread to read notifications
    if (!previousRead && read) {
      previousRead = true;

      if (pendingLikeOrder.length) {
        for (const l of pendingLikeOrder) {
          frag.append(_getLikeNotification(pendingLikes[l]));
        }

        pendingLikes = {};
        pendingLikeOrder = [];
      }
    }

    if (nc === NotificationCodes.Like) {
      if (pendingLikes[post[0].id]) {
        pendingLikes[post[0].id].push(post[0]);
      } else {
        pendingLikeOrder.push(post[0].id);
        pendingLikes[post[0].id] = [post[0]];
      }
    } else {
      // append grouped likes
      if (pendingLikeOrder.length) {
        for (const l of pendingLikeOrder) {
          let el: D = _getLikeNotification(pendingLikes[l]);
          if (read) { el.dataset.notificationRead = ""; }
          frag.append(el);
        }

        pendingLikes = {};
        pendingLikeOrder = [];
      }

      let el: D = getPost(insertIntoPostCache([post[0]])[0]);
      if (read) { el.dataset.notificationRead = ""; }
      frag.append(el);
    }
  }

  // append leftover grouped likes
  if (pendingLikeOrder.length) {
    for (const l of pendingLikeOrder) {
      let el: D = _getLikeNotification(pendingLikes[l]);
      if (previousRead) { el.dataset.notificationRead = ""; }
      frag.append(el);
    }

    pendingLikes = {};
    pendingLikeOrder = [];
  }

  if (prepend) {
    tlElement.prepend(frag);
  } else {
    tlElement.append(frag);

    let more: el = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
      if (end) { more.hidden = true; }
      else { more.hidden = false; }
    }
  }
}

function handleNotificationForward(
  posts: [post, notificationType: number][],
  end: boolean,
  expectedTlID: string="notifications",
  forceEvent: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (posts.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderNotificationTimeline(posts.reverse(), false, false, null, true)
}

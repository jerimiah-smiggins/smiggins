// ex. a value of 4 would show:
// a, b, c, and d liked your post
// a, b, c, d, and n other(s) liked your post
const NUM_USERS_LIKE_NOTIF: number = 4;

// TODO: notification cache
// let notificationCache: {
//   posts: [post, notificationType: number][],
//   pendingForward: [post, notificationType: number][],
//   upperBound: number | null,
//   lowerBound: number | null,
//   end: boolean
// } = {
//   posts: [],
//   pendingForward: [],
//   upperBound: null,
//   lowerBound: null,
//   end: false
// };

enum NotificationCodes {
  Comment = 1,
  Quote,
  Ping,
  Like
};

function p_notifications(element: HTMLDivElement): void {
  pendingNotifications.notifications = false;
  let timelineElement: HTMLDivElement | null = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, {
    "notifications": { url: "/api/timeline/notifications", disableCaching: true, prependPosts: false, customRender: renderNotificationTimeline, customForward: handleNotificationForward }
  }, "notifications", element);
}

function _getLikeNotification(posts: post[]): HTMLDivElement {
  console.log(posts);

  let users: string[] = posts.map((a: post, index: number): [string | null, string] | null => {
    if (index > NUM_USERS_LIKE_NOTIF) {
      return null;
    }

    return [a.user.username, a.user.display_name];
  }).filter(Boolean).map((a: [username: string | null, displayName: string] | null): string => {
    let htmlStart: string = "<b>";
    let htmlEnd: string = "</b>";

    if (a === null) {
      return "";
    }

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
    content: [escapeHTML(posts[0].content_warning ? "CW: " + posts[0].content_warning : posts[0].content), 1],
    names: [userFull, 1]
  });
}

function renderNotificationTimeline(
  posts: [post, notificationType: number][],
  end: boolean,
  updateCache: boolean,
  moreElementOverride?: HTMLElement | null
): void {
  console.log(posts);
  clearTimelineStatuses();

  if (offset.lower === null && posts.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = "None";

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();
  let more: HTMLElement | null = moreElementOverride || document.getElementById("timeline-more");

  if (more) {
    if (end) { more.hidden = true; }
    else { more.hidden = false; }
  }

  let pendingLikes: post[] = [];
  let previousRead: boolean = false;
  for (const post of posts) {
    let nc: NotificationCodes = post[1] & 0b01111111;
    let read: boolean = !(post[1] & 0x80);

    // add any new likes to the timeline when switching from unread to read notifications
    if (!previousRead && read) {
      previousRead = true;

      if (pendingLikes.length) {
        frag.append(_getLikeNotification(pendingLikes));
        pendingLikes = [];
      }
    }

    if (nc === NotificationCodes.Like) {
      // check if targetted liked post has changed
      if (pendingLikes.length && pendingLikes[0].id !== post[0].id) {
        let el: HTMLDivElement = _getLikeNotification(pendingLikes);
        if (read) { el.dataset.notificationRead = ""; }
        frag.append(el);
        pendingLikes = [];
      }

      pendingLikes.push(post[0]);
    } else {
      if (pendingLikes.length) {
        let el: HTMLDivElement = _getLikeNotification(pendingLikes);
        if (read) { el.dataset.notificationRead = ""; }
        frag.append(el);

        pendingLikes = [];
      }

      let el: HTMLDivElement = getPost(insertIntoPostCache([post[0]])[0]);
      if (read) { el.dataset.notificationRead = ""; }
      frag.append(el);
    }
  }

  if (pendingLikes.length) {
    frag.append(_getLikeNotification(pendingLikes));
  }

  tlElement.append(frag);

  // if (updateCache && !currentTl.disableCaching) {
  //   notificationCache.posts.push(...posts);
  //   notificationCache.lowerBound = offset.lower;
  //   notificationCache.upperBound = offset.upper;
  //   notificationCache.end = end;
  // }
}

function handleNotificationForward(
  posts: any[],
  end: boolean,
  expectedTlID: string = "notifications",
  forceEvent: boolean = false
): void {
  if (currentTlID !== expectedTlID) {
    return;
  }

  // TODO: forward notifications
}

enum NotificationCodes {
  Comment = 1,
  Quote,
  Ping,
  Like,
  Follow
};

function p_notifications(element: D): void {
  pendingNotifications.notifications = false;
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    notifications: { api: api_TimelineNotifications, disableCaching: true, prependPosts: false, customRender: renderNotificationTimeline, customForward: handleNotificationForward }
  }, "notifications", element);
}

function _getLikeNotification(likes: NotificationLikeData[]): D {
  let recentTimestamp: number = 0;
  let users: string[] = likes.map((a: NotificationLikeData): [string | null, string] | null => {
    if (a.timestamp > recentTimestamp) { recentTimestamp = a.timestamp; }
    return [a.username, a.display_name];
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

  let userFull: string = lr(n(L.notifications.like, likes.length), {
    a: users[0],
    b: users[1],
    c: users[2],
    n: String(likes.length - 3)
  });

  return getSnippet("notification-like", {
    pid: String(likes[0].post_id),
    timestamp: getTimestamp(recentTimestamp),
    content: [simplePostContent(likes[0].content, likes[0].content_warning, false), 1],
    names: [userFull, 1],
  });
}

function _getFollowNotification(follows: NotificationFollowData[]): D {
  let recentTimestamp: number = 0;
  let users: string[] = follows.map((a: NotificationFollowData): [string | null, string] | null => {
    if (a.timestamp > recentTimestamp) { recentTimestamp = a.timestamp; }
    return [a.username, a.display_name];
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

  let userFull: string = lr(n(L.notifications.follow, follows.length), {
    a: users[0],
    b: users[1],
    c: users[2],
    n: String(follows.length - 3)
  });

  return getSnippet("notification-follow", {
    timestamp: getTimestamp(recentTimestamp),
    names: [userFull, 1],
  });
}

function renderNotificationTimeline(
  notifs: NotificationData[],
  end: boolean,
  _: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  if (offset.lower === null && notifs.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = L.generic.none;

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();

  let pendingLikes: { [key: number]: NotificationLikeData[] } = {};
  let pendingLikeOrder: number[] = [];
  let pendingFollows: NotificationFollowData[] = [];

  let previousRead: boolean = false;
  for (const notif of notifs) {
    let ts: number = notif.code === NotificationCodes.Like || notif.code === NotificationCodes.Follow ? notif.timestamp : notif.post.timestamp;
    if (!offset.lower || ts < offset.lower) { offset.lower = ts; }
    if (!offset.upper || ts > offset.upper) { offset.upper = ts; }

    // add any new likes to the timeline when switching from unread to read notifications
    if (!previousRead && !notif.unread) {
      previousRead = true;

      pushPending(frag, pendingLikes, pendingLikeOrder, pendingFollows);
      pendingLikes = {};
      pendingLikeOrder = [];
      pendingFollows = [];
    }

    if (notif.code === NotificationCodes.Like) {
      pushPending(frag, {}, [], pendingFollows);
      pendingFollows = [];

      if (localStorage.getItem("smiggins-no-like-grouping")) {
        // force push notification when grouping disabled
        let el: D = _getLikeNotification([notif]);
        if (!notif.unread) { el.dataset.notificationRead = ""; }
        frag.append(el);
      } else if (pendingLikes[notif.post_id]) {
        // append to pending
        pendingLikes[notif.post_id].push(notif);
      } else {
        // add to pending
        pendingLikeOrder.push(notif.post_id);
        pendingLikes[notif.post_id] = [notif];
      }
    } else if (notif.code === NotificationCodes.Follow) {
      pushPending(frag, pendingLikes, pendingLikeOrder, []);
      pendingLikes = {};
      pendingLikeOrder = [];

      if (localStorage.getItem("smiggins-no-like-grouping")) {
        // force push notification when grouping disabled
        let el: D = _getFollowNotification([notif]);
        if (!notif.unread) { el.dataset.notificationRead = ""; }
        frag.append(el);
      } else {
        pendingFollows.push(notif);
      }
    } else {
      // append grouped likes
      pushPending(frag, pendingLikes, pendingLikeOrder, pendingFollows);
      pendingLikes = {};
      pendingLikeOrder = [];
      pendingFollows = [];

      let el: D = getPost(insertIntoPostCache([notif.post])[0], false);
      if (!notif.unread) { el.dataset.notificationRead = ""; }
      frag.append(el);
    }
  }

  // append leftover grouped likes
  pushPending(frag, pendingLikes, pendingLikeOrder, pendingFollows);

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

function pushPending(
  frag: DocumentFragment,
  pendingLikes: { [key: number]: NotificationLikeData[] },
  pendingLikeOrder: number[],
  pendingFollows: NotificationFollowData[]
): void {
  if (pendingLikeOrder.length) {
    for (const l of pendingLikeOrder) {
      let el: D = _getLikeNotification(pendingLikes[l]);

      if (!pendingLikes[l][0].unread) {
        el.dataset.notificationRead = "";
      }

      frag.append(el);
    }
  } else if (pendingFollows.length) {
    let el: D = _getFollowNotification(pendingFollows);

    if (!pendingFollows[0].unread) {
      el.dataset.notificationRead = "";
    }

    frag.append(el);
  }
}

function handleNotificationForward(
  notifs: NotificationData[],
  end: boolean,
  expectedTlID: string="notifications",
  _: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (notifs.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderNotificationTimeline(notifs.reverse(), false, false, null, true)
}

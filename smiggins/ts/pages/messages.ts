const MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD: number = 600; // 10 minutes
const MESSAGE_PREPEND_SCROLL_DOWN_THRESHOLD: number = 16;

let previousMessageLabel: [Message, D] | null = null;
let firstMessage: Message | null = null;

function getMessageGroupIDFromPath(path?: string): number {
  return +(path || location.pathname).split("/").filter(Boolean)[1];
}

function p_messageList(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    message_list: { api: api_MessageGroupTimeline, disableCaching: true, prependPosts: false, customRender: renderMessageListTimeline, customForward: handleMessageListForward }
  }, "message_list", element);

  element.querySelector("#message-new")?.addEventListener("click", newMessageModal);
}

function p_message(element: D): void {
  let timelineElement: Del = element.querySelector("#timeline-posts");

  previousMessageLabel = null;
  firstMessage = null;
  if (!timelineElement) { return; }

  hookTimeline(timelineElement, null, {
    message: { api: api_MessageTimeline, args: [getMessageGroupIDFromPath()], disableCaching: true, prependPosts: false, customRender: renderMessageTimeline, customForward: handleMessageForward }
  }, "message", element);

  (element.querySelector("#messages-compose") as Iel)?.addEventListener("keydown", messageComposeHandler);
}

function messageComposeHandler(e: KeyboardEvent): void {
  if (e.key === "Enter" && !e.shiftKey) {
    let compose: Iel = document.getElementById("messages-compose") as Iel;

    if (compose && compose.value) {
      new api_MessageSend(getMessageGroupIDFromPath(), compose.value, compose).fetch()
      e.preventDefault();
    }
  }
}

function renderMessageListTimeline(
  groups: MessageList[],
  end: boolean,
  _: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  if (offset.lower === null && groups.length === 0) {
    let none: HTMLElement = document.createElement("i");
    none.classList.add("timeline-status");
    none.innerText = L.generic.none;

    tlElement.append(none);

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();

  for (const group of groups) {
    if (!offset.lower || group.timestamp < offset.lower) { offset.lower = group.timestamp; }
    if (!offset.upper || group.timestamp > offset.upper) { offset.upper = group.timestamp; }

    let el: D = getSnippet("message-list-item", {
      gid: String(group.group_id),
      timestamp: getTimestamp(group.timestamp),
      content: [group.recent_content ? escapeHTML(group.recent_content) : `<i>${L.messages.none}</i>`, 1],
      names: [getMessageTitle(group.members.names, group.members.count), 1],
    });

    if (!group.unread) {
      el.dataset.notificationRead = "";
    }

    let existing: el = document.querySelector(`[data-message-group-id="${group.group_id}"]`) || frag.querySelector(`[data-message-group-id="${group.group_id}"]`);
    if (prepend) {
      existing?.remove();
    }

    if (!existing || prepend) {
      el.dataset.messageGroupId = String(group.group_id);
      frag.append(el);
    }
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

function handleMessageListForward(
  groups: MessageList[],
  end: boolean,
  expectedTlID: string="message_list",
  _: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (groups.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderMessageListTimeline(groups.reverse(), false, false, null, true)
}

function getMessageTitle(members: string[], count: number): string {
  members = members.map((a: string): string => (`<b>${escapeHTML(a)}</b>`));
  return lr(n(L.messages.title, count - 1), {
    a: members[0],
    b: members[1],
    c: members[2],
    n: String(count)
  });
}

function _getMessageSeparator(message: Message): D {
  let separator: D = document.createElement("div");
  separator.dataset.messageSeparator = "";

  if (message.username === username) {
    separator.dataset.messageSelf = "";
  }

  separator.innerHTML = `<a data-internal-link="user" href="/u/${message.username}/" class="plain-link">${escapeHTML(message.display_name)} - ${getTimestamp(message.timestamp)}</a>`;
  generateInternalLinks(separator);

  return separator;
}

function renderMessageTimeline(
  messages: Message[],
  end: boolean,
  _: boolean,
  moreElementOverride?: el,
  prepend: boolean=false
): void {
  clearTimelineStatuses();

  let scrollToBottom: boolean = offset.lower === null;
  let scrollElement: el = document.getElementById("messages-timeline-container");
  let oldScrollTop: number | undefined = scrollElement?.scrollTop;
  let oldScrollTopMax: number | null = scrollElement && (scrollElement.scrollHeight - scrollElement.getBoundingClientRect().height);
  let oldScrollHeight: number | undefined = scrollElement?.scrollHeight;

  if (offset.lower === null) {
    fetchNotifications();
    firstMessage = messages[0];
  }

  if (messages.length === 0) {
    if (offset.lower === null) {
      let none: HTMLElement = document.createElement("i");
      none.classList.add("timeline-status");
      none.innerText = L.generic.none;

      tlElement.append(none);
    }

    return;
  }

  let frag: DocumentFragment = document.createDocumentFragment();
  let previous: Message = messages[0];
  if (!prepend && previousMessageLabel) {
    previous = previousMessageLabel[0];
    previousMessageLabel[1].remove();
    previousMessageLabel = null;
  }

  for (const message of messages) {
    if (!offset.lower || message.timestamp < offset.lower) { offset.lower = message.timestamp; }
    if (!offset.upper || message.timestamp > offset.upper) { offset.upper = message.timestamp; }

    if (previous.username !== message.username || previous.timestamp - MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD > message.timestamp) {
      frag.append(_getMessageSeparator(previous));
    }

    previous = message;

    let el: D = document.createElement("div");
    el.innerHTML = linkify(escapeHTML(message.content));
    generateInternalLinks(el);

    if (message.username === username) {
      el.dataset.messageSelf = "";
    }

    frag.append(el);
  }

  if (!prepend || firstMessage && (previous.username !== firstMessage.username || previous.timestamp - MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD > firstMessage.timestamp)) {
    let previousElement: D = _getMessageSeparator(previous);
    previousMessageLabel = [previous, previousElement];
    frag.append(previousElement);
  }

  if (prepend) {
    tlElement.prepend(frag);
    firstMessage = messages[0];

    if (scrollElement && oldScrollTop && oldScrollTopMax && oldScrollTopMax - oldScrollTop < MESSAGE_PREPEND_SCROLL_DOWN_THRESHOLD) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  } else {
    tlElement.append(frag);

    let more: el = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
      if (end) { more.hidden = true; }
      else { more.hidden = false; }
    }

    if (scrollElement && scrollToBottom) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    } else if (scrollElement && oldScrollTop !== undefined && oldScrollHeight !== undefined) {
      scrollElement.scrollTop = oldScrollTop + scrollElement.scrollHeight - oldScrollHeight;
    }
  }
}

function handleMessageForward(
  messages: Message[],
  end: boolean,
  expectedTlID: string="message",
  _: boolean=false
): void {
  tlPollingPendingResponse = false;

  if (expectedTlID !== currentTlID) {
    console.log("timeline switched, discarding request");
    return;
  }

  if (messages.length === 0) { return; }

  if (!end) {
    reloadTimeline(true);
    return;
  }

  renderMessageTimeline(messages, false, false, null, true)
}

home = true;
offset = -1;

function refreshPendingList(fromStart=false): void {
  if (fromStart) {
    offset = -1;
    dom("pending-list").innerHTML = "";
  } else {
    offset++;
    if (!offset) {
      offset++;
    }
  }

  s_fetch(`/api/user/pending?offset=${offset}`, {
    disable: [dom("refresh"), dom("more")]
  });
}

function _followAction(username: string, method: "POST" | "DELETE"): void {
  s_fetch("/api/user/pending", {
    method: method,
    body: JSON.stringify({
      username: username
    })
  })
}

function block(username: string): void {
  s_fetch(`/api/user/block`, {
    method: "POST",
    body: JSON.stringify({
      username: username
    }),
    postFunction: (success: boolean): void => {
      refreshPendingList(true);
    }
  });
}

refreshPendingList(true);

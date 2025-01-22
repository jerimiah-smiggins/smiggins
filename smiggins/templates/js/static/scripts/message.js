function refreshMessageList(fromStart = false) {
    if (fromStart) {
        timelineConfig.vars.offset = -1;
        dom("user-list").innerHTML = "";
    }
    else {
        timelineConfig.vars.offset++;
        if (!timelineConfig.vars.offset) {
            timelineConfig.vars.offset++;
        }
    }
    s_fetch(`/api/messages/list?offset=${timelineConfig.vars.offset}`, {
        disable: [dom("refresh"), dom("more")]
    });
}
function refreshMessages(start = false, forward = true) {
    let params = {
        username: u_for,
        forward: start || forward,
        offset: start ? -1 : forward ? forwardOffset : reverseOffset
    };
    if (start) {
        dom("messages-go-here-btw").innerHTML = "";
        forwardOffset = 0;
        reverseOffset = 0;
    }
    if (c > 0) {
        return;
    }
    c++;
    s_fetch(`/api/messages?username=${params.username}&forward=${params.forward}&offset=${params.offset}`, {
        extraData: {
            start: start
        },
        postFunction: (success) => {
            --c;
        }
    });
}
let forwardOffset;
let reverseOffset;
function messageInit() {
    u_for = document.querySelector(".messages-container").dataset.username;
    c = 0;
    forwardOffset = 0;
    reverseOffset = 0;
    dom("your-mom").onkeydown = (event) => {
        if ((event.key === "Enter") && !event.shiftKey) {
            event.preventDefault();
            if (dom("your-mom").value) {
                s_fetch("/api/messages", {
                    method: "POST",
                    body: JSON.stringify({
                        content: dom("your-mom").value,
                        username: u_for
                    }),
                    disable: [dom("your-mom")],
                });
            }
        }
    };
    killIntervals.push(setInterval(() => {
        if (!document.visibilityState || document.visibilityState == "visible") {
            refreshMessages(false, false);
        }
    }, 10 * 1000));
    refreshMessages(true);
}
function messageListInit() {
    timelineConfig.vars.offset = -1;
    refreshMessageList(true);
}

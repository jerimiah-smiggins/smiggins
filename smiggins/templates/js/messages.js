home = true;
timelineConfig.vars.offset = -1;
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
refreshMessageList(true);

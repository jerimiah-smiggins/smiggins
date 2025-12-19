"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function _intToBytes(num, length = 1) {
    let arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = (num >> (8 * (length - i - 1))) & 0xff;
    }
    return arr;
}
function hexToBytes(hex) {
    let length = Math.floor(hex.length / 2);
    let arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = Number("0x" + hex.slice(i * 2, i * 2 + 2));
    }
    return arr;
}
function buildRequest(...data) {
    let response = [];
    let boolPendingData = 0;
    let numBools = 0;
    for (const i of data) {
        if (numBools && typeof i !== "boolean") {
            response.push(boolPendingData << (8 - numBools));
            boolPendingData = 0;
            numBools = 0;
        }
        if (typeof i === "boolean") {
            boolPendingData <<= 1;
            boolPendingData |= Number(i);
            numBools++;
        }
        else if (typeof i === "object") {
            if (i.push) {
                if (typeof i[0] === "string") {
                    let buf = new TextEncoder().encode(i[0]);
                    response = response.concat(Array.from(_intToBytes(buf.length, Math.floor(i[1] / 8))), Array.from(buf));
                }
                else {
                    response = response.concat(Array.from(_intToBytes(i[0], Math.floor(i[1] / 8))));
                }
            }
            else {
                response = response.concat(Array.from(i));
            }
        }
        else {
            console.log("invalid type for buildRequest", i);
        }
        if (numBools == 8) {
            response.push(boolPendingData);
            boolPendingData = 0;
            numBools = 0;
        }
    }
    if (numBools) {
        response.push(boolPendingData << (8 - numBools));
    }
    return new Uint8Array(response).buffer;
}
const changes = {
    "1.1.0": {
        description: "Changelog page and bug fixes",
        major_changes: [{
                info: "Added a page that shows changes from previous versions. You're looking at it now!",
                icon: "quote"
            }],
        changes: [
            "Added the changelogs page",
            "Fixed a bug that occasionally caused the username on user pages to temporairily show the username along with \"null\"",
            "Fixed escaping the backtick (<code>`</code>) character in certain circumstances",
            "Fixed a bug that caused some numbers (ex. 12.3) to be treated as links",
            "Added indicators for quotes that are quoting a post with a poll or another quote",
            "The timeline selection (global/following) on the home timeline is saved across sessions",
            "Added backend configuration for the frequency of frontend polling requests (timelines, notifications)"
        ]
    },
    "1.1.1": {
        description: "Banner PFPs and bug fixes",
        changes: [
            "User sections on posts now have a little \"profile picture\" using banner colors",
            "Fixed line wrapping for long words in most places",
            "Fixed a bug with links in numbers",
            "Fixed a bug that caused the \"Includes a quote\" text to show up when it shouldn't"
        ]
    },
    "1.1.2": {
        description: "Bug fixes and small improvements",
        changes: [
            "The changelog page loads properly again",
            "Added an option that lets you change the shape of the banner icons, or disable them all together",
            "Added an option that configures how content warnings are cascaded",
            "Added a versioning system to APIs to prevent an outdated client from interpreting data as garbage",
            "Added a post counter to profiles",
            "Added a share button on posts",
            "Clicking the \"<i>Includes a poll/quote</i>\" on quotes brings you to the quote"
        ]
    },
    "1.2.0": {
        description: "Logged out content and embeds",
        major_changes: [{
                info: "People who aren't logged in can view users and posts! This helps with ease of use for people who aren't sure if they want to make an account.",
                icon: "user"
            }],
        changes: [
            "People who aren't logged in can view users and post pages",
            "Data is now embedded into the base document for embeds on other platforms, ex. discord",
            "Like notifications now have a timestamp attached to them"
        ]
    },
    "1.3.0": {
        description: "Searching",
        major_changes: [{
                info: "You can now search for posts! There are seveal search filters that can be used, like whether or not it has a poll, or who created it.",
                icon: "search"
            }],
        changes: [
            "Added a search page",
            "The navbar on mobile has been rearranged to be less cluttered",
            "Fixed pagination for the \"oldest\" timeline on hashtags and comments"
        ]
    },
    "1.3.1": {
        description: "More secure password storage and IFrame support",
        major_changes: [{
                info: "You can now embed posts on other websites! By using an IFrame, you can make any post be visible on any of your websites.",
                icon: "embed"
            }],
        changes: [
            "Added IFrame support",
            "Password storage is more secure. This however does require everyone to log in again",
            "Added a backend setting to disable the <a href=\"/settings/about/\" data-internal-link=\"settings/about\">about page</a>",
            "Added a configuration to disable changelog popups",
            "Like notifications get grouped more often"
        ]
    },
    "1.3.2": {
        description: "Post interaction keybinds",
        changes: [
            "Added configurable keybinds for the options in hamburger menus on posts",
            "Added an import/export function for settings",
            "Added simple ratelimiting to api requests"
        ]
    },
    "1.4.0": {
        description: "Messages",
        major_changes: [{
                info: "You can send people private messages! You can also create group messages with several people at once.",
                icon: "messages"
            }, {
                info: "You can now see who follows someone and who that person follows! This can be found by clicking the \"following\" or \"followed by\" text on the user's page.",
                icon: "user_plus"
            }],
        changes: [
            "Added messages",
            "Rewrote how the API is handled on the frontend",
            "Fixed a bug that caused the default visibility setting to not populate on comments",
            "Comments are now always followers-only by default if the original post is followers-only",
            "Added following/followers pages"
        ]
    },
    "1.4.1": {
        description: "Misc. changes and fixes",
        changes: [
            "Fixed a bug that caused people who aren't logged in to not be able to view the following/followers popups",
            "Added a setting that disables notification grouping for likes"
        ]
    }
};
var ResponseCodes;
(function (ResponseCodes) {
    ResponseCodes[ResponseCodes["NOOP"] = -1] = "NOOP";
    ResponseCodes[ResponseCodes["LogIn"] = 1] = "LogIn";
    ResponseCodes[ResponseCodes["SignUp"] = 2] = "SignUp";
    ResponseCodes[ResponseCodes["Follow"] = 16] = "Follow";
    ResponseCodes[ResponseCodes["Unfollow"] = 17] = "Unfollow";
    ResponseCodes[ResponseCodes["Block"] = 18] = "Block";
    ResponseCodes[ResponseCodes["Unblock"] = 19] = "Unblock";
    ResponseCodes[ResponseCodes["AcceptFolreq"] = 20] = "AcceptFolreq";
    ResponseCodes[ResponseCodes["DenyFolreq"] = 21] = "DenyFolreq";
    ResponseCodes[ResponseCodes["GetProfile"] = 32] = "GetProfile";
    ResponseCodes[ResponseCodes["SaveProfile"] = 33] = "SaveProfile";
    ResponseCodes[ResponseCodes["DeleteAccount"] = 34] = "DeleteAccount";
    ResponseCodes[ResponseCodes["ChangePassword"] = 35] = "ChangePassword";
    ResponseCodes[ResponseCodes["DefaultVisibility"] = 36] = "DefaultVisibility";
    ResponseCodes[ResponseCodes["VerifyFollowers"] = 37] = "VerifyFollowers";
    ResponseCodes[ResponseCodes["CreatePost"] = 48] = "CreatePost";
    ResponseCodes[ResponseCodes["Like"] = 49] = "Like";
    ResponseCodes[ResponseCodes["Unlike"] = 50] = "Unlike";
    ResponseCodes[ResponseCodes["Pin"] = 51] = "Pin";
    ResponseCodes[ResponseCodes["Unpin"] = 52] = "Unpin";
    ResponseCodes[ResponseCodes["PollVote"] = 53] = "PollVote";
    ResponseCodes[ResponseCodes["PollRefresh"] = 54] = "PollRefresh";
    ResponseCodes[ResponseCodes["EditPost"] = 62] = "EditPost";
    ResponseCodes[ResponseCodes["DeletePost"] = 63] = "DeletePost";
    ResponseCodes[ResponseCodes["AdminDeleteUser"] = 64] = "AdminDeleteUser";
    ResponseCodes[ResponseCodes["GenerateOTP"] = 65] = "GenerateOTP";
    ResponseCodes[ResponseCodes["DeleteOTP"] = 66] = "DeleteOTP";
    ResponseCodes[ResponseCodes["ListOTP"] = 67] = "ListOTP";
    ResponseCodes[ResponseCodes["GetAdminPermissions"] = 68] = "GetAdminPermissions";
    ResponseCodes[ResponseCodes["SetAdminPermissions"] = 69] = "SetAdminPermissions";
    ResponseCodes[ResponseCodes["MessageGroupTimeline"] = 80] = "MessageGroupTimeline";
    ResponseCodes[ResponseCodes["MessageTimeline"] = 81] = "MessageTimeline";
    ResponseCodes[ResponseCodes["MessageSend"] = 82] = "MessageSend";
    ResponseCodes[ResponseCodes["MessageGetGID"] = 83] = "MessageGetGID";
    ResponseCodes[ResponseCodes["TimelineGlobal"] = 96] = "TimelineGlobal";
    ResponseCodes[ResponseCodes["TimelineFollowing"] = 97] = "TimelineFollowing";
    ResponseCodes[ResponseCodes["TimelineUser"] = 98] = "TimelineUser";
    ResponseCodes[ResponseCodes["TimelineComments"] = 99] = "TimelineComments";
    ResponseCodes[ResponseCodes["TimelineNotifications"] = 100] = "TimelineNotifications";
    ResponseCodes[ResponseCodes["TimelineHashtag"] = 101] = "TimelineHashtag";
    ResponseCodes[ResponseCodes["TimelineFolreq"] = 102] = "TimelineFolreq";
    ResponseCodes[ResponseCodes["TimelineSearch"] = 103] = "TimelineSearch";
    ResponseCodes[ResponseCodes["TimelineUserFollowing"] = 104] = "TimelineUserFollowing";
    ResponseCodes[ResponseCodes["TimelineUserFollowers"] = 105] = "TimelineUserFollowers";
    ResponseCodes[ResponseCodes["Notifications"] = 112] = "Notifications";
})(ResponseCodes || (ResponseCodes = {}));
;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["BadRequest"] = 0] = "BadRequest";
    ErrorCodes[ErrorCodes["BadUsername"] = 16] = "BadUsername";
    ErrorCodes[ErrorCodes["UsernameUsed"] = 17] = "UsernameUsed";
    ErrorCodes[ErrorCodes["BadPassword"] = 18] = "BadPassword";
    ErrorCodes[ErrorCodes["InvalidOTP"] = 19] = "InvalidOTP";
    ErrorCodes[ErrorCodes["CantInteract"] = 32] = "CantInteract";
    ErrorCodes[ErrorCodes["Blocking"] = 33] = "Blocking";
    ErrorCodes[ErrorCodes["PostNotFound"] = 48] = "PostNotFound";
    ErrorCodes[ErrorCodes["PollSingleOption"] = 49] = "PollSingleOption";
    ErrorCodes[ErrorCodes["NotAuthenticated"] = 254] = "NotAuthenticated";
    ErrorCodes[ErrorCodes["Ratelimit"] = 255] = "Ratelimit";
})(ErrorCodes || (ErrorCodes = {}));
;
class _api_Base {
    constructor(...params) {
        this.id = ResponseCodes.NOOP;
        this.version = 0;
        this.url = "/api/noop";
        this.method = "GET";
        this.disabled = [];
        this.requestBody = null;
        this.requestParams = null;
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const el of this.disabled) {
                el === null || el === void 0 ? void 0 : el.setAttribute("disabled", "");
            }
            return fetch(this.url + (this.requestParams ? ((this.url.includes("?") ? "&" : "?") + this.requestParams) : ""), {
                method: this.method,
                body: this.requestBody
            }).then((response) => (response.arrayBuffer()))
                .then((ab) => (new Uint8Array(ab)))
                .then((u8arr) => {
                if ((u8arr[0] & 0b01111111) !== this.id) {
                    throw Error(`Bad response code - expected ${this.id}/${this.id | 0x80}, got ${u8arr[0]}`);
                }
                if (u8arr[0] >> 7 & 1) {
                    this.err(u8arr[1]);
                    return false;
                }
                if (u8arr[1] !== this.version) {
                    alert(lr(L.generic.pending_update, {
                        t: pageTitle,
                        c: `r${u8arr[0].toString(16)}v${u8arr[1]}t${Math.round(Date.now() / 1000)}`
                    }));
                    throw Error("Bad version");
                }
                this.handle(u8arr);
                return true;
            })
                .catch((err) => (this.genericError(err)))
                .finally(() => (this.always()));
        });
    }
    always() {
        for (const el of this.disabled) {
            el === null || el === void 0 ? void 0 : el.removeAttribute("disabled");
        }
    }
    handle(u8arr) {
        throw Error("Not Implemented");
    }
    err(code) {
        createToast(..._getErrorStrings(code, this.id));
    }
    genericError(err) {
        createToast(L.errors.something_went_wrong, String(err));
        this.always();
        throw err;
    }
}
class _api_TimelineBase extends _api_Base {
    constructor(offset, forwards) {
        super();
        this.expectedTlID = currentTlID;
        if (offset) {
            this.requestParams = `offset=${offset}`;
            if (forwards) {
                this.requestParams += "&forwards=true";
                if (forwards === "force") {
                    this.expectedTlID = "$" + this.expectedTlID;
                }
            }
        }
    }
    handle(u8arr) {
        let end = _extractBool(u8arr[2], 7);
        let forwards = _extractBool(u8arr[2], 6);
        let numPosts = u8arr[3];
        let posts = [];
        u8arr = u8arr.slice(4);
        for (let i = 0; i < numPosts; i++) {
            let postData = _extractPost(u8arr);
            posts.push(postData[0]);
            u8arr = postData[1];
        }
        if (forwards) {
            if (this.expectedTlID.startsWith("$")) {
                handleForward(posts, end, this.expectedTlID.slice(1), true);
            }
            else {
                handleForward(posts, end, this.expectedTlID);
            }
        }
        else {
            renderTimeline(insertIntoPostCache(posts), end);
        }
    }
}
class api_LogIn extends _api_Base {
    constructor(username, password, button) {
        super();
        this.id = ResponseCodes.LogIn;
        this.version = 0;
        this.url = "/api/user/login";
        this.method = "POST";
        this.requestBody = buildRequest([username, 8], hexToBytes(sha256(password)));
        this.disabled = [button];
    }
    handle(u8arr) {
        setTokenCookie(_toHex(u8arr.slice(2)));
        location.href = "/";
    }
}
class api_SignUp extends api_LogIn {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.SignUp;
        this.version = 0;
        this.url = "/api/user/signup";
    }
}
class api_Follow extends _api_Base {
    constructor(username, button) {
        super();
        this.id = ResponseCodes.Follow;
        this.version = 0;
        this.url = "/api/user/follow";
        this.method = "POST";
        this.requestBody = username;
        this.disabled = [button];
    }
    handle(u8arr) {
        updateFollowButton(true, Boolean(u8arr[2] & (1 << 7)));
    }
}
class api_Unfollow extends api_Follow {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Unfollow;
        this.version = 0;
        this.method = "DELETE";
    }
    handle(u8arr) {
        updateFollowButton(false);
    }
}
class api_Block extends api_Follow {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Block;
        this.version = 0;
        this.url = "/api/user/block";
        this.method = "POST";
    }
    handle(u8arr) {
        updateBlockButton(true);
    }
}
class api_Unblock extends api_Block {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Unblock;
        this.version = 0;
        this.method = "DELETE";
    }
    handle(u8arr) {
        updateBlockButton(false);
    }
}
class api_AcceptFollowRequest extends _api_Base {
    constructor(username) {
        super();
        this.id = ResponseCodes.AcceptFolreq;
        this.version = 0;
        this.url = "/api/user/follow-request";
        this.method = "POST";
        this.requestBody = username;
    }
    handle(u8arr) { }
}
class api_DenyFollowRequest extends api_AcceptFollowRequest {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.DenyFolreq;
        this.version = 0;
        this.method = "DELETE";
    }
}
class api_GetProfile extends _api_Base {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.GetProfile;
        this.version = 0;
        this.url = "/api/user";
        this.method = "GET";
    }
    handle(u8arr) {
        let displayName = _extractString(8, u8arr.slice(2));
        let bio = _extractString(16, displayName[1]);
        let pronouns = _extractString(8, bio[1]);
        profileSettingsSetUserData(displayName[0], bio[0], pronouns[0], "#" + _toHex(pronouns[1].slice(0, 3)), "#" + _toHex(pronouns[1].slice(3, 6)), _extractBool(pronouns[1][6], 7), _extractBool(pronouns[1][6], 6));
    }
}
class api_SaveProfile extends _api_Base {
    constructor(gradient, displayName, bio, pronouns, colorOne, colorTwo, button) {
        super();
        this.id = ResponseCodes.SaveProfile;
        this.version = 0;
        this.url = "/api/user";
        this.method = "PATCH";
        this.disabled = [button];
        this.requestBody = buildRequest(gradient, [displayName, 8], [bio, 16], [pronouns, 8], hexToBytes(colorOne + colorTwo));
    }
    handle(u8arr) {
        createToast(L.generic.success, L.settings.profile.profile_saved);
        updateUserCacheFromCosmeticSettings();
    }
}
class api_DeleteAccount extends _api_Base {
    constructor(username, password, button) {
        super();
        this.id = ResponseCodes.DeleteAccount;
        this.version = 1;
        this.url = "/api/user";
        this.method = "DELETE";
        this.disabled = [button];
        this.requestBody = buildRequest(hexToBytes(sha256(password)), [username, 8]);
    }
    handle(u8arr) {
        renderPage("logout");
    }
}
class api_ChangePassword extends _api_Base {
    constructor(currentPassword, newPassword, button) {
        super();
        this.id = ResponseCodes.ChangePassword;
        this.version = 0;
        this.url = "/api/user/password";
        this.method = "PATCH";
        this.disabled = [button];
        this.requestBody = buildRequest(hexToBytes(sha256(currentPassword) + sha256(newPassword)));
    }
    handle(u8arr) {
        changePasswordSuccess(_toHex(u8arr.slice(2)));
    }
}
class api_DefaultVisibility extends _api_Base {
    constructor(defaultPrivate) {
        super();
        this.id = ResponseCodes.DefaultVisibility;
        this.version = 0;
        this.url = "/api/user/default_post";
        this.method = "PATCH";
        this.requestBody = buildRequest([+defaultPrivate, 8]);
    }
    handle(u8arr) { }
}
class api_VerifyFollowers extends _api_Base {
    constructor(verify) {
        super();
        this.id = ResponseCodes.VerifyFollowers;
        this.version = 0;
        this.url = "/api/user/verify_followers";
        this.method = "PATCH";
        this.requestBody = buildRequest([+verify, 8]);
    }
    handle(u8arr) { }
}
class api_CreatePost extends _api_Base {
    constructor(content, cw, followersOnly, extra) {
        super();
        this.id = ResponseCodes.CreatePost;
        this.version = 0;
        this.url = "/api/post";
        this.method = "POST";
        this.requestBody = buildRequest(followersOnly, Boolean(extra && extra.quote), Boolean(extra && extra.poll && extra.poll.length), Boolean(extra && extra.comment), [content, 16], [cw || "", 8], ...((extra && extra.poll && extra.poll.length) ? [[extra.poll.length, 8], ...extra.poll.map((a) => ([a, 8]))] : []), ...((extra && extra.quote) ? [[extra.quote, 32]] : []), ...((extra && extra.comment) ? [[extra.comment, 32]] : []));
    }
    handle(u8arr) {
        prependPostToTimeline(_extractPost(u8arr.slice(2))[0]);
    }
}
class api_Like extends _api_Base {
    constructor(pid) {
        super();
        this.id = ResponseCodes.Like;
        this.version = 0;
        this.method = "POST";
        this.url = `/api/post/like/${pid}`;
    }
    handle(u8arr) { }
}
class api_Unlike extends api_Like {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Unlike;
        this.version = 0;
        this.method = "DELETE";
    }
    handle(u8arr) { }
}
class api_Pin extends _api_Base {
    constructor(pid) {
        super();
        this.id = ResponseCodes.Pin;
        this.version = 0;
        this.method = "POST";
        this.url = `/api/post/pin/${pid}`;
    }
    handle(u8arr) {
        createToast(L.generic.success, L.post.pinned);
    }
}
class api_Unpin extends _api_Base {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Unpin;
        this.version = 0;
        this.url = "/api/post/pin";
        this.method = "DELETE";
    }
    handle(u8arr) {
        var _a;
        createToast(L.generic.success, L.post.unpinned);
        (_a = document.getElementById("user-pinned-container")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "");
    }
}
class api_PollVote extends _api_Base {
    constructor(pid, option) {
        super();
        this.id = ResponseCodes.PollVote;
        this.version = 0;
        this.url = "/api/post/poll";
        this.method = "POST";
        this.requestBody = buildRequest([pid, 32], [option, 8]);
    }
    handle(u8arr) {
        let pid = _extractInt(32, u8arr.slice(2));
        let pollData = _extractPoll(u8arr.slice(6))[0];
        let c = postCache[pid];
        if (c) {
            c.poll = pollData;
        }
        refreshPollDisplay(pid, true);
    }
}
class api_PollRefresh extends api_PollVote {
    constructor(pid) {
        super(0, 0);
        this.id = ResponseCodes.PollRefresh;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/post/poll/${pid}`;
        this.requestBody = null;
    }
}
class api_EditPost extends _api_Base {
    constructor(id, content, cw, privatePost, button) {
        super();
        this.id = ResponseCodes.EditPost;
        this.version = 0;
        this.url = "/api/post";
        this.method = "PATCH";
        this.disabled = [button];
        this.requestBody = buildRequest([id, 32], privatePost, [content, 16], [cw, 8]);
    }
    handle(u8arr) { }
}
class api_DeletePost extends _api_Base {
    constructor(pid) {
        super();
        this.id = ResponseCodes.DeletePost;
        this.version = 0;
        this.url = "/api/post";
        this.method = "DELETE";
        this.requestBody = buildRequest([pid, 32]);
    }
    handle(u8arr) {
        handlePostDelete(_extractInt(32, u8arr.slice(2)));
    }
}
class api_AdminDeleteUser extends _api_Base {
    constructor(username) {
        super();
        this.id = ResponseCodes.AdminDeleteUser;
        this.version = 0;
        this.url = "/api/admin/user";
        this.method = "DELETE";
        this.requestBody = username;
    }
    handle(u8arr) {
        createToast(L.generic.success, L.admin.delete_user.success);
    }
}
class api_GenerateOTP extends _api_Base {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.GenerateOTP;
        this.version = 0;
        this.url = "/api/admin/invite";
        this.method = "POST";
    }
    handle(u8arr) {
        let otp = _toHex(u8arr.slice(2));
        let el = document.getElementById("generate-otp-output");
        if (el) {
            el.classList.add("otp");
            el.innerText = otp;
        }
        el === null || el === void 0 ? void 0 : el.removeAttribute("hidden");
        navigator.clipboard.writeText(otp)
            .then(() => createToast(L.generic.copied, L.admin.generate_otp.copied));
    }
}
class api_DeleteOTP extends _api_Base {
    constructor(otp) {
        super();
        this.id = ResponseCodes.DeleteOTP;
        this.version = 0;
        this.url = "/api/admin/invite";
        this.method = "DELETE";
        this.requestBody = buildRequest(hexToBytes(otp));
    }
    handle(u8arr) { }
}
class api_ListOTP extends _api_Base {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.ListOTP;
        this.version = 0;
        this.url = "/api/admin/invite";
        this.method = "GET";
    }
    handle(u8arr) {
        let el = document.getElementById("otp-list");
        if (!el) {
            return;
        }
        let otps = [..._toHex(u8arr.slice(2)).matchAll(/.{64}/g)];
        if (!otps.length) {
            el.innerHTML = `<i>${L.generic.none}</i>`;
            return;
        }
        el.innerHTML = otps.map((a) => `<div data-otp-container="${a[0]}"><code class="otp">${a[0]}</code> <button data-otp="${a}">${L.admin.generate_otp.delete}</button></div>`).join("");
        for (const button of el.querySelectorAll("button")) {
            button.addEventListener("click", adminDeleteOTP);
        }
    }
}
class api_GetAdminPermissions extends _api_Base {
    constructor(username) {
        super();
        this.id = ResponseCodes.GetAdminPermissions;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/admin/permissions/${username}`;
    }
    handle(u8arr) {
        adminSetPermissionCheckboxes(_extractInt(16, u8arr.slice(2)));
    }
}
class api_SetAdminPermissions extends _api_Base {
    constructor(username, val) {
        super();
        this.id = ResponseCodes.SetAdminPermissions;
        this.version = 0;
        this.url = "/api/admin/permissions";
        this.method = "POST";
        this.requestBody = buildRequest([val, 16], [username, 8]);
    }
    handle(u8arr) {
        createToast(L.generic.success, L.admin.set_level.success);
    }
}
class api_MessageGroupTimeline extends _api_TimelineBase {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.MessageGroupTimeline;
        this.version = 0;
        this.url = "/api/message/list";
        this.method = "GET";
    }
    handle(u8arr) {
        let end = _extractBool(u8arr[2], 7);
        let forwards = _extractBool(u8arr[2], 6);
        let numGroups = u8arr[3];
        let messageListItems = [];
        u8arr = u8arr.slice(4);
        for (let i = 0; i < numGroups; i++) {
            let gid = _extractInt(32, u8arr);
            let ts = _extractInt(64, u8arr.slice(4));
            let unread = _extractBool(u8arr[12], 7);
            let content = _extractString(16, u8arr.slice(13));
            u8arr = content[1].slice(1);
            let members = [];
            for (let i = 0; i < Math.min(content[1][0] - 1, 3); i++) {
                let name = _extractString(8, u8arr);
                members.push(name[0]);
                u8arr = name[1];
            }
            messageListItems.push({
                group_id: gid,
                timestamp: ts,
                unread: unread,
                recent_content: content[0],
                members: {
                    count: content[1][0],
                    names: members
                }
            });
        }
        if (forwards) {
            handleMessageListForward(messageListItems, end, "message_list", true);
        }
        else {
            renderMessageListTimeline(messageListItems, end, false);
        }
    }
}
class api_MessageTimeline extends _api_TimelineBase {
    constructor(offset, forwards, gid) {
        super(offset, forwards);
        this.id = ResponseCodes.MessageTimeline;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/messages/${gid}`;
    }
    handle(u8arr) {
        let memberCount = u8arr[2];
        let members = [];
        u8arr = u8arr.slice(3);
        for (let i = 0; i < Math.min(memberCount - 1, 3); i++) {
            let name = _extractString(8, u8arr);
            members.push(name[0]);
            u8arr = name[1];
        }
        let el = document.getElementById("message-title");
        if (el) {
            el.innerHTML = getMessageTitle(members, memberCount);
        }
        let end = _extractBool(u8arr[0], 7);
        let forwards = _extractBool(u8arr[0], 6);
        let numMessages = u8arr[1];
        let messages = [];
        u8arr = u8arr.slice(2);
        for (let i = 0; i < numMessages; i++) {
            let ts = _extractInt(64, u8arr);
            let content = _extractString(16, u8arr.slice(8));
            let username = _extractString(8, content[1]);
            let displayName = _extractString(8, username[1]);
            u8arr = displayName[1];
            messages.push({
                timestamp: ts,
                content: content[0],
                username: username[0],
                display_name: displayName[0]
            });
        }
        if (forwards) {
            handleMessageForward(messages, end, "message", true);
        }
        else {
            renderMessageTimeline(messages, end, false);
        }
    }
}
class api_MessageSend extends _api_Base {
    constructor(gid, content, input) {
        super();
        this.id = ResponseCodes.MessageSend;
        this.version = 0;
        this.method = "POST";
        this.disabled = [input];
        this.url = `/api/message/${gid}`;
        this.requestBody = buildRequest([content, 16]);
    }
    handle(u8arr) {
        let compose = document.getElementById("messages-compose");
        if (compose) {
            compose.disabled = false;
            compose.value = "";
            compose.focus();
        }
        if (document.querySelector("#timeline-posts > div")) {
            timelinePolling(true);
        }
        else {
            reloadTimeline(true);
        }
    }
}
class api_MessageGetGID extends _api_Base {
    constructor(usernames, button) {
        super();
        this.id = ResponseCodes.MessageGetGID;
        this.version = 0;
        this.url = "/api/message/group";
        this.method = "GET";
        this.disabled = [button];
        this.requestParams = `usernames=${usernames.join(",")}`;
    }
    handle(u8arr) {
        let gid = _extractInt(32, u8arr.slice(2));
        history.pushState("message", "", `/message/${gid}/`);
        renderPage("message");
        clearModal();
    }
}
class api_TimelineGlobal extends _api_TimelineBase {
    constructor(offset, forwards, comments) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineGlobal;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/global${comments ? "?comments=true" : ""}`;
    }
}
class api_TimelineFollowing extends _api_TimelineBase {
    constructor(offset, forwards, comments) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineFollowing;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/following${comments ? "?comments=true" : ""}`;
    }
}
class api_TimelineUser extends _api_TimelineBase {
    constructor(offset, forwards, username, comments) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineUser;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/user/${username}${comments ? "?include_comments=true" : ""}`;
    }
    handle(u8arr) {
        let displayName = _extractString(8, u8arr.slice(2));
        let pronouns = _extractString(8, displayName[1]);
        let bio = _extractString(16, pronouns[1]);
        let flags = bio[1][12];
        let pinned = null;
        let pinnedPostData;
        if (_extractBool(flags, 2)) {
            pinnedPostData = _extractPost(bio[1].slice(13));
            pinned = insertIntoPostCache([pinnedPostData[0]])[0];
        }
        userUpdateStats(displayName[0], pronouns[0], bio[0], "#" + _toHex(bio[1].slice(0, 3)), "#" + _toHex(bio[1].slice(3, 6)), _extractBool(flags, 3) && "pending" || _extractBool(flags, 5), _extractBool(flags, 4), _extractInt(16, bio[1].slice(8)), _extractInt(16, bio[1].slice(6)), _extractInt(16, bio[1].slice(10)), pinned);
        u8arr = new Uint8Array([0, 0, flags].concat(Array.from(pinnedPostData ? pinnedPostData[1] : bio[1].slice(13))));
        super.handle(u8arr);
    }
}
class api_TimelineComments extends _api_TimelineBase {
    constructor(offset, forwards, pid, sort) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineComments;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/post/${pid}?sort=${sort}`;
    }
    handle(u8arr) {
        let postData = _extractPost(u8arr.slice(2));
        updateFocusedPost(postData[0]);
        u8arr = new Uint8Array([0].concat(Array.from(postData[1])));
        super.handle(u8arr);
    }
}
class api_TimelineNotifications extends _api_TimelineBase {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.TimelineNotifications;
        this.version = 0;
        this.url = "/api/timeline/notifications";
        this.method = "GET";
    }
    handle(u8arr) {
        let end = _extractBool(u8arr[2], 7);
        let forwards = _extractBool(u8arr[2], 6);
        let numPosts = u8arr[3];
        let posts = [];
        u8arr = u8arr.slice(4);
        for (let i = 0; i < numPosts; i++) {
            let postData = _extractPost(u8arr.slice(1));
            posts.push([postData[0], u8arr[0]]);
            u8arr = postData[1];
        }
        if (forwards) {
            handleNotificationForward(posts, end, "notifications");
        }
        else {
            renderNotificationTimeline(posts, end, false);
        }
    }
}
class api_TimelineHashtag extends _api_TimelineBase {
    constructor(offset, forwards, tag, sort) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineHashtag;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/tag/${tag}?sort=${sort}`;
    }
}
class api_TimelineFolreq extends _api_TimelineBase {
    constructor(offset, _) {
        super(offset, false);
        this.id = ResponseCodes.TimelineFolreq;
        this.version = 1;
        this.url = "/api/timeline/follow-requests";
        this.method = "GET";
    }
    handle(u8arr) {
        let end = _extractBool(u8arr[2], 7);
        let numUsers = u8arr[3];
        let users = [];
        u8arr = u8arr.slice(4);
        for (let i = 0; i < numUsers; i++) {
            let id = _extractInt(32, u8arr);
            let username = _extractString(8, u8arr.slice(4));
            let pronouns = _extractString(8, username[1]);
            let displayName = _extractString(8, pronouns[1].slice(6));
            let bio = _extractString(16, displayName[1]);
            u8arr = bio[1];
            users.push({
                username: username[0],
                pronouns: pronouns[0] || null,
                color_one: "#" + _toHex(pronouns[1].slice(0, 3)),
                color_two: "#" + _toHex(pronouns[1].slice(3, 6)),
                display_name: displayName[0],
                bio: bio[0],
                id: id
            });
        }
        renderFolreqTimeline(users, end, false);
    }
}
class api_TimelineSearch extends _api_TimelineBase {
    constructor(offset, forwards, params, sort) {
        super(offset, forwards);
        this.id = ResponseCodes.TimelineSearch;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/search?sort=${sort}&${params}`;
    }
}
class api_TimelineUserFollowing extends _api_TimelineBase {
    constructor(offset, username) {
        super(offset, false);
        this.id = ResponseCodes.TimelineUserFollowing;
        this.version = 0;
        this.method = "GET";
        this.url = `/api/timeline/user/following/${username}`;
    }
    handle(u8arr) {
        let end = _extractBool(u8arr[2], 7);
        let numUsers = u8arr[3];
        let users = [];
        u8arr = u8arr.slice(4);
        for (let i = 0; i < numUsers; i++) {
            let id = _extractInt(32, u8arr);
            let username = _extractString(8, u8arr.slice(4));
            let pronouns = _extractString(8, username[1]);
            let displayName = _extractString(8, pronouns[1].slice(6));
            let bio = _extractString(16, displayName[1]);
            u8arr = bio[1];
            users.push({
                username: username[0],
                pronouns: pronouns[0] || null,
                color_one: "#" + _toHex(pronouns[1].slice(0, 3)),
                color_two: "#" + _toHex(pronouns[1].slice(3, 6)),
                display_name: displayName[0],
                bio: bio[0],
                id: id
            });
        }
        renderFollowingTimeline(users, end);
    }
}
class api_TimelineUserFollowers extends api_TimelineUserFollowing {
    constructor(offset, username) {
        super(offset, username);
        this.id = ResponseCodes.TimelineUserFollowers;
        this.url = `/api/timeline/user/followers/${username}`;
    }
}
class api_Notifications extends _api_Base {
    constructor() {
        super(...arguments);
        this.id = ResponseCodes.Notifications;
        this.version = 0;
        this.url = "/api/notifications";
        this.method = "GET";
    }
    handle(u8arr) {
        pendingNotifications = {
            notifications: _extractBool(u8arr[2], 7),
            messages: _extractBool(u8arr[2], 6),
            follow_requests: _extractBool(u8arr[2], 5)
        };
        resetNotificationIndicators();
    }
    genericError(err) { }
}
let forceDisableKeybinds = false;
let navModKeyPressed = false;
const KB_DISABLED = "DISABLED";
let _kbReverse = {};
const keybinds = {
    newPost: { defaultKey: "n", callback: () => { createPostModal(); } },
    loadNewPosts: { defaultKey: "r", callback: timelineShowNew },
    topOfTimeline: { defaultKey: "/", callback: () => { window.scrollTo(0, 0); } },
    navModifier: { defaultKey: "g", callback: () => { navModKeyPressed = true; }, releaseCallback: () => { navModKeyPressed = false; } },
    navAdmin: { defaultKey: "a", modifiers: ["nav"], callback: () => { if (!isAdmin || currentPage === "admin") {
            return;
        } history.pushState("admin", "", "/admin/"); renderPage("admin"); } },
    navHome: { defaultKey: "h", modifiers: ["nav"], callback: () => { if (currentPage === "home") {
            return;
        } history.pushState("home", "", "/"); renderPage("home"); } },
    navMessages: { defaultKey: "m", modifiers: ["nav"], callback: () => { if (currentPage === "message-list") {
            return;
        } history.pushState("message-list", "", "/messages/"); renderPage("message-list"); } },
    navNotifications: { defaultKey: "n", modifiers: ["nav"], callback: () => { if (currentPage === "notifications") {
            return;
        } history.pushState("notifications", "", "/notifications/"); renderPage("notifications"); } },
    navProfile: { defaultKey: "p", modifiers: ["nav"], callback: () => { if (currentPage === "user" && getUsernameFromPath() === username) {
            return;
        } history.pushState("user", "", `/u/${username}/`); renderPage("user"); } },
    navSettings: { defaultKey: "s", modifiers: ["nav"], callback: () => { if (currentPage === "settings") {
            return;
        } history.pushState("settings", "", "/settings/"); renderPage("settings"); } },
    hamburgerDelete: { defaultKey: "d", modifiers: ["alt"], callback: () => { keybindPostHamburger("data-interaction-delete"); } },
    hamburgerPin: { defaultKey: "f", modifiers: ["alt"], callback: () => { keybindPostHamburger("data-interaction-pin") || keybindPostHamburger("data-interaction-unpin"); } },
    hamburgerEdit: { defaultKey: "e", modifiers: ["alt"], callback: () => { keybindPostHamburger("data-interaction-edit"); } },
    hamburgerShare: { defaultKey: "s", modifiers: ["alt"], callback: () => { keybindPostHamburger("data-interaction-share"); } },
    hamburgerEmbed: { defaultKey: KB_DISABLED, modifiers: [], callback: () => { keybindPostHamburger("data-interaction-embed"); } },
};
function setKeybindStrings() {
    keybinds.newPost = Object.assign(Object.assign({}, keybinds.newPost), L.keybinds.new_post);
    keybinds.loadNewPosts = Object.assign(Object.assign({}, keybinds.loadNewPosts), L.keybinds.load_new_posts);
    keybinds.topOfTimeline = Object.assign(Object.assign({}, keybinds.topOfTimeline), L.keybinds.top_of_timeline);
    keybinds.navModifier = Object.assign(Object.assign({}, keybinds.navModifier), L.keybinds.nav_modifier);
    keybinds.navAdmin.name = L.keybinds.nav_admin;
    keybinds.navHome.name = L.keybinds.nav_home;
    keybinds.navMessages.name = L.keybinds.nav_messages;
    keybinds.navNotifications.name = L.keybinds.nav_notifications;
    keybinds.navProfile.name = L.keybinds.nav_profile;
    keybinds.navSettings.name = L.keybinds.nav_settings;
    keybinds.hamburgerDelete.name = L.keybinds.hamburger_delete;
    keybinds.hamburgerPin.name = L.keybinds.hamburger_pin;
    keybinds.hamburgerEdit.name = L.keybinds.hamburger_edit;
    keybinds.hamburgerShare.name = L.keybinds.hamburger_share;
    keybinds.hamburgerEmbed.name = L.keybinds.hamburger_embed;
}
function setKeybindKey(id, newKey, modifiers) {
    let modString = "";
    if (modifiers) {
        if (modifiers.nav) {
            let navKey = _kbGetKey("navModifier");
            if (navKey[0] + navKey.slice(1).split(":")[0] === newKey.toLowerCase()) {
                return false;
            }
            modString += "nav";
        }
        if (modifiers.alt) {
            if (modString) {
                modString += ",";
            }
            modString += "alt";
        }
        if (modifiers.ctrl) {
            if (modString) {
                modString += ",";
            }
            modString += "ctrl";
        }
        if (modifiers.shift) {
            if (modString) {
                modString += ",";
            }
            modString += "shift";
        }
    }
    if (id === "navModifier") {
        modString = "";
        for (const key of Object.keys(_kbReverse)) {
            if (key.startsWith(newKey + ":nav")) {
                return false;
            }
        }
    }
    newKey = newKey.toLowerCase();
    if (newKey === "escape") {
        newKey = KB_DISABLED;
    }
    let kbData = newKey + ":" + modString;
    if (kbData in _kbReverse) {
        return false;
    }
    localStorage.setItem("smiggins-keybind-" + id, kbData);
    _kbRefreshReverse();
    return true;
}
function _kbGetKey(id) {
    let kbData = keybinds[id];
    let lsData = localStorage.getItem("smiggins-keybind-" + id);
    if (!lsData) {
        return kbData.defaultKey + ":" + (kbData.modifiers || []).join(",");
    }
    return lsData;
}
function _kbRefreshReverse() {
    _kbReverse = {};
    for (const [id, data] of Object.entries(keybinds)) {
        let key = _kbGetKey(id);
        if (key.startsWith(KB_DISABLED)) {
            continue;
        }
        _kbReverse[key] = {
            callback: data.callback,
            modifiers: key.slice(1).split(":")[1].split(",")
        };
    }
}
function keyHandler(e) {
    if (forceDisableKeybinds || !loggedIn || IS_IFRAME) {
        return;
    }
    let el = e.target;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        return;
    }
    let modString = "";
    if (navModKeyPressed) {
        modString += "nav";
    }
    if (e.altKey) {
        if (modString) {
            modString += ",";
        }
        modString += "alt";
    }
    if (e.ctrlKey) {
        if (modString) {
            modString += ",";
        }
        modString += "ctrl";
    }
    if (e.shiftKey) {
        if (modString) {
            modString += ",";
        }
        modString += "shift";
    }
    let kbData = _kbReverse[e.key.toLowerCase() + ":" + modString];
    if (kbData) {
        e.preventDefault();
        kbData.callback(e);
    }
}
function keyUpHandler(e) {
    if (e.key.toLowerCase() + ":" === _kbGetKey("navModifier")) {
        navModKeyPressed = false;
    }
}
function keybindPostHamburger(interaction) {
    let el = document.querySelector(`.hamburger:focus .post-hamburger [${interaction}]:not([hidden])`)
        || document.querySelector(`.hamburger .post-hamburger:focus [${interaction}]:not([hidden])`)
        || document.querySelector(`.hamburger .post-hamburger:focus-within [${interaction}]:not([hidden])`);
    console.log(el);
    if (el) {
        el.click();
        return true;
    }
    return false;
}
onkeydown = keyHandler;
onkeyup = keyUpHandler;
_kbRefreshReverse();
const LANGS = {
    "en": { "meta": { "id": "en", "name": "English", "fallbacks": [] }, "version": "v%n", "generic": { "username": "Username", "success": "Success!", "copied": "Copied!", "none": "None", "pending_update": "It seems that %t has been updated. Please reload the page for updates to take effect.\n\nIf this popup continues to show up after you reload, please contact your instance administrator.\nCode: %c", "loading": "Loading...", "load_more": "Load More", "sign_up_for_more": "Sign up to view more!", "toggle_password": "Toggle Password", "back": "Back" }, "errors": { "something_went_wrong": "Something went wrong!", "bad_username": "Invalid username.", "username_no_user": "No user has that username.", "username_characters": "Usernames can only include the characters a-z, 0-9, _, and -.", "username_used": "Username in use.", "bad_password": "Invalid password.", "invalid_otp": "Invalid invite code.", "invalid_otp_more": "Make sure your invite code is correct and try again.", "cant_delete": "Can't delete.", "cant_delete_more": "You don't have permissions to delete this post.", "cant_interact": "Can't interact.", "cant_interact_more": "You can't interact with this user for some reason.", "blocking": "You are blocking this person.", "blocking_more": "You need to unblock them to do this.", "post_not_found": "Post not found.", "invalid_poll": "Invalid poll.", "poll_more_than_one": "Must have more than one option.", "not_authenticated": "Not Authenticated.", "not_authenticated_more": "You need to be logged in to do this.", "ratelimit": "Ratelimited.", "ratelimit_more": "Try again in a few seconds.", "error_code": "Error code %c", "cant_copy": "Unable to copy!", "cant_copy_more": "Couldn't copy text to your clipboard. Are you using https?", "passwords_dont_match": "Passwords don't match.", "user_dne": "User '%u' does not exist." }, "numbers": { "infinity": "Infinity", "thousand": "%nk", "million": "%nm", "billion": "%nb", "second": "%xs", "minute": "%xm", "hour": "%xh", "day": "%xd", "year": "%xy", "minute_second": "%xm%ys", "hour_minute": "%xh%ym", "day_hour": "%xd%yh", "year_day": "%xy%yd", "future": "in %t" }, "titles": { "base": "%l - %n", "admin": "Administration", "changes": "Changes", "follow_requests": "Follow Requests", "login": "Log In", "logout": "Log Out", "messages": "Messages", "not_found": "Page Not Found", "notifications": "Notifications", "search": "Search", "settings": "Settings", "signup": "Sign Up" }, "post": { "poll": { "refresh": "Refresh", "return_to_voting": "Return to voting", "view_results": "View results", "vote_count": { "1": "%n vote", "*": "%n vote" } }, "cw": { "length": { "1": "%n char", "*": "%n chars" }, "has_quote": ", quote", "has_poll": ", poll", "reply": "RE: %c" }, "quote": { "has_quote": "Includes a quote", "has_poll": "Includes a poll", "cant_view": "You can't view this quote." }, "tl_refresh": "Refresh", "show_new": { "1": "Show new post (%n)", "*": "Show new posts (%n)" }, "copied": "A link to this post has been added to your clipboard.", "embedded": "An IFrame code snippet has been copied to your clipboard.", "deleted": "This post has been deleted.", "cw_short": "CW: %c", "poll_short": "Poll", "followers_only": "Followers Only", "cw_placeholder": "Content warning (optional)", "poll_button": "Poll", "poll_placeholder": "Option %n", "poll_placeholder_optional": "Option %n (optional)", "button": "Post", "placeholder": "Cool post", "quote_button": "Quote", "quote_placeholder": ["Cool quote", "What did they say this time?", "Yet another mistake to point out?", "Ugh... not again..."], "comment_button": "Reply", "comment_placeholder": ["Cool comment", "Got something to say about this?", "Let them know how you feel", "Go spread your opinions, little one"], "edit_button": "Save", "edit_placeholder": "Cool post but edited", "pinned": "Pinned to your profile.", "unpinned": "This post is no longer pinned to your profile.", "embed": "Embed", "share": "Share", "unpin": "Unpin", "pin": "Pin", "edit": "Edit", "delete": "Delete", "parent_link": "Comment Parent", "home_link": "Home" }, "keybinds": { "modifiers": { "alt": "Alt", "ctrl": "Ctrl", "shift": "Shift" }, "button_change": "Change", "change_instructions": "Press the new key in the box above.", "new_post": { "name": "Enter Post Box", "description": "Lets you send a post from anywhere" }, "load_new_posts": { "name": "Load New Posts", "description": "Shows any posts that have been made since the posts were initially loaded" }, "top_of_timeline": { "name": "Jump to Top", "description": "Jumps to the top of the current page" }, "nav_modifier": { "name": "Navigation Modifier", "description": "The key that needs to be pressed in order to use the other navigation keybinds" }, "nav_admin": "Admin Page", "nav_home": "Home", "nav_messages": "Messages", "nav_notifications": "Notifications", "nav_profile": "Your Profile", "nav_settings": "Settings", "hamburger_delete": "Delete Post", "hamburger_pin": "Pin Post", "hamburger_edit": "Edit Post", "hamburger_share": "Share Post", "hamburger_embed": "Embed Post" }, "settings": { "profile": { "title": "Profile", "real_title": "Profile Settings", "description": "Display name, banner color...", "profile_saved": "Your profile has been saved.", "section_profile": "Your Profile", "display_name": "Display name:", "pronouns": "Pronouns:", "pronouns_presets": ["he/him", "she/her", "they/them", "it/its"], "pronouns_unset": "Unset", "pronouns_custom": "Custom", "pronouns_custom_placeholder": "Custom pronouns...", "bio": "User bio:", "banner": "Banner:", "gradient": "Enable gradient banner?", "save_profile": "Save", "section_posts": "Posts", "default_visibility": "Default post visibility:", "vis_public": "Public", "vis_private": "Followers Only", "section_followers": "Followers", "manually_approve": "Manually approve followers?" }, "cosmetic": { "title": "Cosmetic", "real_title": "Cosmetic Settings", "description": "Website theme, tweaks...", "section_colors": "Colors", "themes": { "label": "Theme:", "system": "Automatic", "light": "Light", "dark": "Dark", "warm": "Warm", "gray": "Gray", "darker": "Dark Gray", "oled": "Black" }, "section_timestamps": "Timestamps", "complex_ts": "Enable complex timestamps", "complex_ts_more": "(1h becomes 1h32m, 5m becomes 5m48s)", "section_font_size": "Font Size", "font_size_example": "Aa", "section_posts": "Posts", "hide_interactions": "Hide interactions on posts", "expand_cws": "Always expand content warnings", "hide_changelog": "Hide changelog popups", "no_like_grouping": "Don't group like notifications", "auto_show_new": "Automatically show new posts on the timeline", "auto_show_new_more": "When disabled, there will instead be a button to show new posts.", "banner_shape": { "label": "User banner icon shape:", "none": "Hidden", "square": "Square", "round": "Rounded Square", "circle": "Circle" }, "cw_cascading": { "label": "Content warning cascading:", "description": "What the content warning should be when commenting on a post with one.", "none": "Don't set a content warning", "email": "Prepend \"RE: \" (like an email)", "copy": "Use existing content warning" } }, "keybinds": { "title": "Keybinds", "real_title": "Keybinds", "description": "Navigation, send posts...", "section_generic": "Generic Keybinds", "section_nav": "Navigation Keybinds", "section_hamburger": "Post Interaction Keybinds" }, "account": { "title": "Account", "real_title": "Account Settings", "description": "Change password, delete account...", "password_changed": "Your password has been changed.", "section_change_password": "Change Password", "current": "Current Password", "new": "New Password", "confirm": "Confirm Password", "set": "Set Password", "section_delete": "Delete Account", "password": "Password", "confirmation": "I confirm that this action %Bcan not be undone%b, and any data associated with this account (%u) will %Bnot be recoverable%b.", "delete": "Delete My Account" }, "about": { "title": "About", "description": "Source code, credits...", "section_credits": "Credits", "lead_dev": "Lead Developer:", "contributors": "Other Contributors:", "icons": "Some icons are from Font Awesome", "section_call_to_action": "Found a bug? Have suggestions?", "create_an_issue": "Create an issue on the GitHub repository!", "suggestions_appreciated": "All suggestions and bug reports are greatly appreciated.", "past_changes": "You can also view all past changes %h.", "here": "here", "section_special_thanks": "Special Thanks", "thanks_intro": "Thank you to everyone who has reported issues, suggested features, and been active in the community.", "thanks_body": "This project is created and maintained completely for free. No one has made a single penny off of Smiggins. This wouldn't exist today without your support. Thank you for using Smiggins, and we hope you enjoy it!", "source": "Source Code", "discord": "Discord Server" }, "import": "Import Settings...", "export": "Export Settings...", "log_out": "Log Out...", "log_in": "Log In..." }, "admin": { "title": "Administration", "description": "Delete posts, generate invites...", "delete_post": { "title": "Delete Posts", "pid": "Post ID:", "button": "Delete Post" }, "delete_user": { "title": "Delete User", "success": "This user has been deleted.", "username": "Username: ", "confirmation": "I confirm that this is the user I would like to permanently delete.", "button": "Delete User" }, "generate_otp": { "title": "Manage Invite Codes", "generate": "Generate Code", "list": "List Valid Codes", "delete": "Delete", "copied": "The invite code has been copied to your clipboard." }, "set_level": { "title": "Set Admin Permissions", "success": "Permissions saved.", "username": "Username: ", "permission_warning": "Allows setting permissions for both self and others, including permissions they don't have", "load": "Load Current Permissions", "save": "Save Permissions" } }, "messages": { "none": "No messages", "title": { "1": "%a", "2": "%a and %b", "3": "%a, %b, and %c", "4": "%a, %b, %c, and <b>%n other</b>", "*": "%a, %b, %c, and <b>%n others</b>" }, "placeholder": "Blah blah blah", "create_group": "Create a Group", "create_button": "Create Group", "add_user": "Add User", "cancel": "Cancel" }, "notifications": { "like": { "1": "%a liked your post.", "2": "%a and %b liked your post.", "3": "%a, %b, and %c liked your post.", "4": "%a, %b, %c, and <b>%n other</b> liked your post.", "*": "%a, %b, %c, and <b>%n others</b> liked your post." } }, "user": { "follow": "Follow", "unfollow": "Unfollow", "pending": "Pending", "block": "Block", "unblock": "Unblock", "no_bio": "No bio set", "following_count": "following %n", "followed_by_count": "followed by %n", "posts_count": "%n posts", "modal_close": "Close", "follow_request_accept": "Accept", "follow_request_deny": "Deny" }, "timeline": { "user_main": "Posts", "user_comments": "Include Comments", "newest": "Newest", "oldest": "Oldest", "home_following": "Following", "home_global": "Global", "home_comments": "Comments" }, "login": { "username": "Username", "password": "Password", "confirm": "Confirm Password", "invite_code": "Invite Code", "logout_info": "Click here if you don't get automatically redirected.", "sign_up_button": "Sign Up", "log_in_button": "Log In", "new_accounts_disabled": "New accounts are currently disabled.", "already_have_account": "Already have an account? Log in instead.", "dont_have_account": "Don't have an account? Sign up instead." }, "search": { "button": "Search", "content_placeholder": "Post content", "advanced": "Advanced Search", "cw": "Content Warning:", "cw_placeholder": "CW content (optional)", "author": "Created by:", "author_placeholder": "Username (optional)", "quote": "Includes quote?", "poll": "Includes poll?", "comment": "Is comment?", "any": "Any", "yes": "Yes", "no": "No" }, "not_found": { "subtitle": "The url wasn't found", "back": "Return Home" }, "update": { "title": "%s has been updated!", "view_changes": "View Changes", "dismiss": "Dismiss" } },
    "en_GB": { "meta": { "id": "en_GB", "name": "English (United Kingdom)", "fallbacks": ["en"] }, "version": "v%n", "generic": { "username": "Username", "success": "Success!", "copied": "Copied!", "none": "None", "pending_update": "It seems that %t has been updated. Please reload the page for updates to take effect.\n\nIf this popup continues to show up after you reload, please contact your instance administrator.\nCode: %c", "loading": "Loading...", "load_more": "Load More", "sign_up_for_more": "Sign up to view more!", "toggle_password": "Toggle Password", "back": "Back" }, "errors": { "something_went_wrong": "Something went wrong!", "bad_username": "Invalid username.", "username_no_user": "No user has that username.", "username_characters": "Usernames can only include the characters a-z, 0-9, _, and -.", "username_used": "Username in use.", "bad_password": "Invalid password.", "invalid_otp": "Invalid invite code.", "invalid_otp_more": "Make sure your invite code is correct and try again.", "cant_delete": "Can't delete.", "cant_delete_more": "You don't have permissions to delete this post.", "cant_interact": "Can't interact.", "cant_interact_more": "You can't interact with this user for some reason.", "blocking": "You are blocking this person.", "blocking_more": "You need to unblock them to do this.", "post_not_found": "Post not found.", "invalid_poll": "Invalid poll.", "poll_more_than_one": "Must have more than one option.", "not_authenticated": "Not Authenticated.", "not_authenticated_more": "You need to be logged in to do this.", "ratelimit": "Ratelimited.", "ratelimit_more": "Try again in a few seconds.", "error_code": "Error code %c", "cant_copy": "Unable to copy!", "cant_copy_more": "Couldn't copy text to your clipboard. Are you using https?", "passwords_dont_match": "Passwords don't match.", "user_dne": "User '%u' does not exist." }, "numbers": { "infinity": "Infinity", "thousand": "%nk", "million": "%nm", "billion": "%nb", "second": "%xs", "minute": "%xm", "hour": "%xh", "day": "%xd", "year": "%xy", "minute_second": "%xm%ys", "hour_minute": "%xh%ym", "day_hour": "%xd%yh", "year_day": "%xy%yd", "future": "in %t" }, "titles": { "base": "%l - %n", "admin": "Administration", "changes": "Changes", "follow_requests": "Follow Requests", "login": "Log In", "logout": "Log Out", "messages": "Messages", "not_found": "Page Not Found", "notifications": "Notifications", "search": "Search", "settings": "Settings", "signup": "Sign Up" }, "post": { "poll": { "refresh": "Refresh", "return_to_voting": "Return to voting", "view_results": "View results", "vote_count": { "1": "%n vote", "*": "%n vote" } }, "cw": { "length": { "1": "%n char", "*": "%n chars" }, "has_quote": ", quote", "has_poll": ", poll", "reply": "RE: %c" }, "quote": { "has_quote": "Includes a quote", "has_poll": "Includes a poll", "cant_view": "You can't view this quote." }, "tl_refresh": "Refresh", "show_new": { "1": "Show new post (%n)", "*": "Show new posts (%n)" }, "copied": "A link to this post has been added to your clipboard.", "embedded": "An IFrame code snippet has been copied to your clipboard.", "deleted": "This post has been deleted.", "cw_short": "CW: %c", "poll_short": "Poll", "followers_only": "Followers Only", "cw_placeholder": "Content warning (optional)", "poll_button": "Poll", "poll_placeholder": "Option %n", "poll_placeholder_optional": "Option %n (optional)", "button": "Post", "placeholder": "Cool post", "quote_button": "Quote", "quote_placeholder": ["Cool quote", "What did they say this time?", "Yet another mistake to point out?", "Ugh... not again..."], "comment_button": "Reply", "comment_placeholder": ["Cool comment", "Got something to say about this?", "Let them know how you feel", "Go spread your opinions, little one"], "edit_button": "Save", "edit_placeholder": "Cool post but edited", "pinned": "Pinned to your profile.", "unpinned": "This post is no longer pinned to your profile.", "embed": "Embed", "share": "Share", "unpin": "Unpin", "pin": "Pin", "edit": "Edit", "delete": "Delete", "parent_link": "Comment Parent", "home_link": "Home" }, "keybinds": { "modifiers": { "alt": "Alt", "ctrl": "Ctrl", "shift": "Shift" }, "button_change": "Change", "change_instructions": "Press the new key in the box above.", "new_post": { "name": "Enter Post Box", "description": "Lets you send a post from anywhere" }, "load_new_posts": { "name": "Load New Posts", "description": "Shows any posts that have been made since the posts were initially loaded" }, "top_of_timeline": { "name": "Jump to Top", "description": "Jumps to the top of the current page" }, "nav_modifier": { "name": "Navigation Modifier", "description": "The key that needs to be pressed in order to use the other navigation keybinds" }, "nav_admin": "Admin Page", "nav_home": "Home", "nav_messages": "Messages", "nav_notifications": "Notifications", "nav_profile": "Your Profile", "nav_settings": "Settings", "hamburger_delete": "Delete Post", "hamburger_pin": "Pin Post", "hamburger_edit": "Edit Post", "hamburger_share": "Share Post", "hamburger_embed": "Embed Post" }, "settings": { "profile": { "title": "Profile", "real_title": "Profile Settings", "description": "Display name, banner colour...", "profile_saved": "Your profile has been saved.", "section_profile": "Your Profile", "display_name": "Display name:", "pronouns": "Pronouns:", "pronouns_presets": ["he/him", "she/her", "they/them", "it/its"], "pronouns_unset": "Unset", "pronouns_custom": "Custom", "pronouns_custom_placeholder": "Custom pronouns...", "bio": "User bio:", "banner": "Banner:", "gradient": "Enable gradient banner?", "save_profile": "Save", "section_posts": "Posts", "default_visibility": "Default post visibility:", "vis_public": "Public", "vis_private": "Followers Only", "section_followers": "Followers", "manually_approve": "Manually approve followers?" }, "cosmetic": { "title": "Cosmetic", "real_title": "Cosmetic Settings", "description": "Website theme, tweaks...", "section_colors": "Colors", "themes": { "label": "Theme:", "system": "Automatic", "light": "Light", "dark": "Dark", "warm": "Warm", "gray": "Gray", "darker": "Dark Gray", "oled": "Black" }, "section_timestamps": "Timestamps", "complex_ts": "Enable complex timestamps", "complex_ts_more": "(1h becomes 1h32m, 5m becomes 5m48s)", "section_font_size": "Font Size", "font_size_example": "Aa", "section_posts": "Posts", "hide_interactions": "Hide interactions on posts", "expand_cws": "Always expand content warnings", "hide_changelog": "Hide changelog popups", "no_like_grouping": "Don't group like notifications", "auto_show_new": "Automatically show new posts on the timeline", "auto_show_new_more": "When disabled, there will instead be a button to show new posts.", "banner_shape": { "label": "User banner icon shape:", "none": "Hidden", "square": "Square", "round": "Rounded Square", "circle": "Circle" }, "cw_cascading": { "label": "Content warning cascading:", "description": "What the content warning should be when commenting on a post with one.", "none": "Don't set a content warning", "email": "Prepend \"RE: \" (like an email)", "copy": "Use existing content warning" } }, "keybinds": { "title": "Keybinds", "real_title": "Keybinds", "description": "Navigation, send posts...", "section_generic": "Generic Keybinds", "section_nav": "Navigation Keybinds", "section_hamburger": "Post Interaction Keybinds" }, "account": { "title": "Account", "real_title": "Account Settings", "description": "Change password, delete account...", "password_changed": "Your password has been changed.", "section_change_password": "Change Password", "current": "Current Password", "new": "New Password", "confirm": "Confirm Password", "set": "Set Password", "section_delete": "Delete Account", "password": "Password", "confirmation": "I confirm that this action %Bcan not be undone%b, and any data associated with this account (%u) will %Bnot be recoverable%b.", "delete": "Delete My Account" }, "about": { "title": "About", "description": "Source code, credits...", "section_credits": "Credits", "lead_dev": "Lead Developer:", "contributors": "Other Contributors:", "icons": "Some icons are from Font Awesome", "section_call_to_action": "Found a bug? Have suggestions?", "create_an_issue": "Create an issue on the GitHub repository!", "suggestions_appreciated": "All suggestions and bug reports are greatly appreciated.", "past_changes": "You can also view all past changes %h.", "here": "here", "section_special_thanks": "Special Thanks", "thanks_intro": "Thank you to everyone who has reported issues, suggested features, and been active in the community.", "thanks_body": "This project is created and maintained completely for free. No one has made a single penny off of Smiggins. This wouldn't exist today without your support. Thank you for using Smiggins, and we hope you enjoy it!", "source": "Source Code", "discord": "Discord Server" }, "import": "Import Settings...", "export": "Export Settings...", "log_out": "Log Out...", "log_in": "Log In..." }, "admin": { "title": "Administration", "description": "Delete posts, generate invites...", "delete_post": { "title": "Delete Posts", "pid": "Post ID:", "button": "Delete Post" }, "delete_user": { "title": "Delete User", "success": "This user has been deleted.", "username": "Username: ", "confirmation": "I confirm that this is the user I would like to permanently delete.", "button": "Delete User" }, "generate_otp": { "title": "Manage Invite Codes", "generate": "Generate Code", "list": "List Valid Codes", "delete": "Delete", "copied": "The invite code has been copied to your clipboard." }, "set_level": { "title": "Set Admin Permissions", "success": "Permissions saved.", "username": "Username: ", "permission_warning": "Allows setting permissions for both self and others, including permissions they don't have", "load": "Load Current Permissions", "save": "Save Permissions" } }, "messages": { "none": "No messages", "title": { "1": "%a", "2": "%a and %b", "3": "%a, %b, and %c", "4": "%a, %b, %c, and <b>%n other</b>", "*": "%a, %b, %c, and <b>%n others</b>" }, "placeholder": "Blah blah blah", "create_group": "Create a Group", "create_button": "Create Group", "add_user": "Add User", "cancel": "Cancel" }, "notifications": { "like": { "1": "%a liked your post.", "2": "%a and %b liked your post.", "3": "%a, %b, and %c liked your post.", "4": "%a, %b, %c, and <b>%n other</b> liked your post.", "*": "%a, %b, %c, and <b>%n others</b> liked your post." } }, "user": { "follow": "Follow", "unfollow": "Unfollow", "pending": "Pending", "block": "Block", "unblock": "Unblock", "no_bio": "No bio set", "following_count": "following %n", "followed_by_count": "followed by %n", "posts_count": "%n posts", "modal_close": "Close", "follow_request_accept": "Accept", "follow_request_deny": "Deny" }, "timeline": { "user_main": "Posts", "user_comments": "Include Comments", "newest": "Newest", "oldest": "Oldest", "home_following": "Following", "home_global": "Global", "home_comments": "Comments" }, "login": { "username": "Username", "password": "Password", "confirm": "Confirm Password", "invite_code": "Invite Code", "logout_info": "Click here if you don't get automatically redirected.", "sign_up_button": "Sign Up", "log_in_button": "Log In", "new_accounts_disabled": "New accounts are currently disabled.", "already_have_account": "Already have an account? Log in instead.", "dont_have_account": "Don't have an account? Sign up instead." }, "search": { "button": "Search", "content_placeholder": "Post content", "advanced": "Advanced Search", "cw": "Content Warning:", "cw_placeholder": "CW content (optional)", "author": "Created by:", "author_placeholder": "Username (optional)", "quote": "Includes quote?", "poll": "Includes poll?", "comment": "Is comment?", "any": "Any", "yes": "Yes", "no": "No" }, "not_found": { "subtitle": "The url wasn't found", "back": "Return Home" }, "update": { "title": "%s has been updated!", "view_changes": "View Changes", "dismiss": "Dismiss" } },
    "es": { "meta": { "id": "es", "name": "Espa\u00f1ol", "fallbacks": [] }, "version": "v%n", "generic": { "username": "Nombre para mostrar", "success": "\u00a1\u00c9xito!", "copied": "\u00a1Copiado!", "none": "Nada", "pending_update": "Parece que %t fue actualizado. Recarga la p\u00e1gina para ver los actualizaciones.\n\nSi este mensaje continuar\u00eda apareciendo despu\u00e9s de recargar, contacta su administrador.\nC\u00f3digo: %c", "loading": "Cargando...", "load_more": "Carga M\u00e1s", "sign_up_for_more": "Inscribese para ver m\u00e1s!", "toggle_password": "Ver Contrase\u00f1a", "back": "Atr\u00e1s" }, "errors": { "something_went_wrong": "\u00a1Algo sali\u00f3 mal!", "bad_username": "Nombre inv\u00e1lido.", "username_no_user": "No usuario tiene este nombre.", "username_characters": "Nombres para mostrar solo pueden incluir los car\u00e1cteres a-z, 0-9, _, and -.", "username_used": "Este nombre est\u00e1 ocupado.", "bad_password": "Contrase\u00f1a inv\u00e1lida.", "invalid_otp": "C\u00f3digo de invitaci\u00f3n inv\u00e1lido.", "invalid_otp_more": "Make sure your invite code is correct and try again.", "cant_delete": "No puede borrar.", "cant_delete_more": "No tiene los permisos para borrar este publicaci\u00f3n.", "cant_interact": "No puede interactuar.", "cant_interact_more": "No puede interactuar con este usuario por alguno raz\u00f3n.", "blocking": "Est\u00e1 bloqueando este usuario.", "blocking_more": "Deber\u00eda desbloquear este usuario para hacerlo.", "post_not_found": "Este publicaci\u00f3n no fue encontrado.", "invalid_poll": "Encuesta inv\u00e1lida.", "poll_more_than_one": "Necesita m\u00e1s de una opci\u00f3n.", "not_authenticated": "No tiene autenticaci\u00f3n.", "not_authenticated_more": "Necesita iniciar una sesi\u00f3n para hacerlo.", "ratelimit": "Ratelimited.", "ratelimit_more": "Int\u00e9ntalo de nuevo en algunos segundos.", "error_code": "C\u00f3digo de error: %c", "cant_copy": "\u00a1No pudo copiarlo!", "cant_copy_more": "No puede copiar el texto al portapapeles. Est\u00e1 usando https?", "passwords_dont_match": "Contrase\u00f1as no se combinan.", "user_dne": "Usario '%u' no existe." }, "numbers": { "infinity": "Infinito", "thousand": "%nk", "million": "%nm", "billion": "%nb", "second": "%xs", "minute": "%xm", "hour": "%xh", "day": "%xd", "year": "%xa", "minute_second": "%xm%ys", "hour_minute": "%xh%ym", "day_hour": "%xd%yh", "year_day": "%xa%yd", "future": "en %t" }, "titles": { "base": "%l - %n", "admin": "Administraci\u00f3n", "changes": "Cambios", "follow_requests": "Solicitudes para seguirte", "login": "Iniciar sesi\u00f3n", "logout": "Cerrar sesi\u00f3n", "messages": "Mensajes", "not_found": "P\u00e1gina No Encontrado", "notifications": "Notificaciones", "search": "Buscar", "settings": "Ajustes", "signup": "Inscribirse" }, "post": { "poll": { "refresh": "Actualizar", "return_to_voting": "Regresar a votar", "view_results": "Ver resultados", "vote_count": { "1": "%n vota", "*": "%n votas" } }, "cw": { "length": { "1": "%n car.", "*": "%n cars." }, "has_quote": ", cita", "has_poll": ", encuesta", "reply": "RE: %c" }, "quote": { "has_quote": "Incluye una cita", "has_poll": "Incluye una encuesta", "cant_view": "No puede ver esta cita." }, "tl_refresh": "Actualizar", "show_new": { "1": "Muestra publicaci\u00f3n nueva (%n)", "*": "Muestra publicaciones nuevas (%n)" }, "copied": "Copiado un enlace a esta publicaci\u00f3n al portapapeles.", "embedded": "Copiado un IFrame al portapapeles.", "deleted": "Este publicaci\u00f3n fue borrado.", "cw_short": "CW: %c", "poll_short": "Encuesta", "followers_only": "Solo para Seguidores", "cw_placeholder": "Advertencia de Contenido (opcional)", "poll_button": "Encuesta", "poll_placeholder": "Opci\u00f3n %n", "poll_placeholder_optional": "Opci\u00f3n %n (opcional)", "button": "Publicar", "placeholder": "Un miau o algo", "quote_button": "Citar", "quote_placeholder": ["Una cita...", "\u00bfQu\u00e9 se dice ahora...?", "\u00bfOtro error?", "Otra vez..."], "comment_button": "Responder", "comment_placeholder": ["Una nota...", "\u00bfTiene algo que quiere decir?", "Informase como se siente", "Puede decir algo... o puede enviar un miau"], "edit_button": "Guardar", "edit_placeholder": "Otro tipo de miau", "pinned": "La publicaci\u00f3n esta fijado a su perfil.", "unpinned": "Este publicaci\u00f3n ya no esta fijado a su perfil.", "embed": "Incrustar", "share": "Compartir", "unpin": "Desfijar", "pin": "Fijar", "edit": "Editar", "delete": "Borrar", "parent_link": "Nota Superior", "home_link": "Inicio" }, "keybinds": { "modifiers": { "alt": "Alt", "ctrl": "Ctrl", "shift": "Shift" }, "button_change": "Cambiar", "change_instructions": "Pulsa la tecla nueva en el cuadro arriba.", "new_post": { "name": "Entrar Cuadro de Publicar", "description": "Se permite enviar un publicaci\u00f3n de cualquier lugar" }, "load_new_posts": { "name": "Cargar Publicaciones Nuevas", "description": "Muestra todas las publicaciones que fue creado desde cuando fueron cargados" }, "top_of_timeline": { "name": "Saltar al principio", "description": "Salta al principio de la p\u00e1gina" }, "nav_modifier": { "name": "Tecla modificador de navigaci\u00f3n", "description": "La tecla que activa los otros comandos" }, "nav_admin": "Administraci\u00f3n", "nav_home": "Inicio", "nav_messages": "Mensajes", "nav_notifications": "Notificaciones", "nav_profile": "Perfil", "nav_settings": "Ajustes", "hamburger_delete": "Borrar publicaci\u00f3n", "hamburger_pin": "Fijar publicaci\u00f3n", "hamburger_edit": "Editar publicaci\u00f3n", "hamburger_share": "Compartir publicaci\u00f3n", "hamburger_embed": "Incrustar publicaci\u00f3n" }, "settings": { "profile": { "title": "Perfil", "real_title": "Perfil", "description": "Nombre de usuario, color del banner...", "profile_saved": "Su perfil fue guardado.", "section_profile": "Su Perfil", "display_name": "Nombre de usuario:", "pronouns": "Pronombres:", "pronouns_presets": ["\u00e9l", "ella", "elle"], "pronouns_unset": "-", "pronouns_custom": "Personalizado", "pronouns_custom_placeholder": "Pronombres personalizados...", "bio": "B\u00edo:", "banner": "Banner:", "gradient": "Activar banner con gradiente", "save_profile": "Guardar", "section_posts": "Publicaciones", "default_visibility": "Visibilidad de publicaci\u00f3n por defecto:", "vis_public": "P\u00fablico", "vis_private": "Solo seguidores", "section_followers": "Seguidores", "manually_approve": "Revisar seguidores nuevos" }, "cosmetic": { "title": "Est\u00e9tico", "real_title": "Est\u00e9tico", "description": "Dise\u00f1o del sitio, modificaciones...", "section_colors": "Colores", "themes": { "label": "Dise\u00f1o:", "system": "Autom\u00e1tico", "light": "Claro", "dark": "Oscuro", "warm": "C\u00e1lido", "gray": "Gris", "darker": "Gris Oscuro", "oled": "OLED" }, "section_timestamps": "Marcas de tiempo", "complex_ts": "Activa marcas de tiempo detallados", "complex_ts_more": "(1h \u2192 1h32m, 5m \u2192 5m48s)", "section_font_size": "Tama\u00f1o de fuente", "font_size_example": "Aa", "section_posts": "Publicaciones", "hide_interactions": "Esconder interacciones en publicaciones", "expand_cws": "Siempre abrir advertencias de contenido", "hide_changelog": "Esconder registro de cambios", "no_like_grouping": "No agrupar notificaciones de likes", "auto_show_new": "Mostrar publicaciones nuevas en la biograf\u00eda autom\u00e1ticamente", "auto_show_new_more": "Si no es activado, estar\u00eda un bot\u00f3n para mostrar publicaciones nuevas.", "banner_shape": { "label": "Forma del \u00edcono del banner usuario:", "none": "Escondido", "square": "Cuadrado", "round": "Cuadrado redondeado", "circle": "C\u00edrculo" }, "cw_cascading": { "label": "Catarada de Advertencias de contenido:", "description": "Que la advertencia de contenido debe estar cuando notando una publicaci\u00f3n con uno.", "none": "No pone un advertencia", "email": "Adjuntar \"RE: \" (como email)", "copy": "Usar advertencia actual" } }, "keybinds": { "title": "Comandos", "real_title": "Comandos", "description": "Navigaci\u00f3n, enviar publicaciones...", "section_generic": "Comandos gen\u00e9ricos", "section_nav": "Comandos de Navigaci\u00f3n", "section_hamburger": "Comandos de Interacciones" }, "account": { "title": "Cuenta", "real_title": "Cuenta", "description": "Cambiar contrase\u00f1a, borrar cuenta...", "password_changed": "Su contrase\u00f1a fue cambiado.", "section_change_password": "Cambiar contrase\u00f1a", "current": "Contrase\u00f1a actual", "new": "Contrase\u00f1a nueva", "confirm": "Confirma contrase\u00f1a nueva", "set": "Cambiar", "section_delete": "Borrar cuenta", "password": "Contrase\u00f1a", "confirmation": "Yo confirma que %Bno podr\u00eda deshacer%b este acci\u00f3n, y que %Bno podr\u00eda recuperar%b todo la informaci\u00f3n relacionado con este cuenta.", "delete": "Borrar mi cuenta" }, "about": { "title": "Acerca De", "description": "C\u00f3digo fuente, cr\u00e9ditos...", "section_credits": "Cr\u00e9ditos", "lead_dev": "Desarrollador Principal:", "contributors": "Otros Contribuyentes:", "icons": "Algunos \u00edconos son de Font Awesome", "section_call_to_action": "\u00bfEncontraste un error? \u00bfTienes recomendaciones?", "create_an_issue": "\u00a1Crea un cuestion en GitHub!", "suggestions_appreciated": "Todos los recomendaciones y declaraciones de errores son apreciados.", "past_changes": "Tambi\u00e9n, puedes ver todos los cambios pasados %h.", "here": "aqu\u00ed", "section_special_thanks": "Agradecimientos Especiales", "thanks_intro": "Gracias a todos quien han declarado cuestiones, han dado recomendaciones, y quien son activo en la comunidad.", "thanks_body": "Este projecto esta creado y mantenido gratis. Nadie ha ganado ni uno centavo por Smiggins. No existe hoy sin su apoyo. Gracias por usando Smiggins, \u00a1y esperamos que lo guste!", "source": "C\u00f3digo fuente", "discord": "Servidor de Discord" }, "import": "Importar Ajustes...", "export": "Exportar Ajustes...", "log_out": "Cerrar sesi\u00f3n...", "log_in": "Iniciar sesi\u00f3n..." }, "admin": { "title": "Administraci\u00f3n", "description": "Borrar publicaciones, crear invitaciones...", "delete_post": { "title": "Borrar publicaciones", "pid": "ID de la publicaci\u00f3n:", "button": "Borrar publicaci\u00f3n" }, "delete_user": { "title": "Borrar usuario", "success": "This user has been deleted.", "username": "Nombre para mostrar: ", "confirmation": "Yo confirma que este es el usuario que quiero borrar permanentemente.", "button": "Borrar usuario" }, "generate_otp": { "title": "Manejar c\u00f3digos de invitaci\u00f3n", "generate": "Crear c\u00f3digo de invitaci\u00f3n", "list": "Enumerar c\u00f3digos v\u00e1lidos", "delete": "Borrar", "copied": "El c\u00f3digo de invitaci\u00f3n fue copiado al portapapeles." }, "set_level": { "title": "Permisos de administraci\u00f3n", "success": "Guard\u00f3 los permisos.", "username": "Nombre para mostrar: ", "permission_warning": "Permite cambiar permisos a s\u00ed mismo y a otros, incluyendo permisos que no tiene.", "load": "Cargar Permisos Actuales", "save": "Guardar Permisos" } }, "messages": { "none": "No mensajes", "title": { "1": "%a", "2": "%a y %b", "3": "%a, %b, y %c", "4": "%a, %b, %c, y <b>%n otro</b>", "*": "%a, %b, %c, y <b>%n otros</b>" }, "placeholder": "Miau Miau", "create_group": "Crear un Grupo", "create_button": "Crear Grupo", "add_user": "A\u00f1adir un Usuario", "cancel": "Cancelar" }, "notifications": { "like": { "1": "%a dio un like a tu publicaci\u00f3n.", "2": "%a y %b dieron likes a tu publicaci\u00f3n.", "3": "%a, %b, y %c dieron likes a tu publicaci\u00f3n.", "4": "%a, %b, %c, y <b>%n otro</b> dieron likes a tu publicaci\u00f3n.", "*": "%a, %b, %c, y <b>%n otros</b> dieron likes a tu publicaci\u00f3n." } }, "user": { "follow": "Seguir", "unfollow": "Dejar de seguir", "pending": "Pendiente", "block": "Bloquear", "unblock": "Desbloquear", "no_bio": "No b\u00edo esta presente", "following_count": "%n Siguiendo", "followed_by_count": "%n Seguidores", "posts_count": "%n publicaciones", "modal_close": "Cerrar", "follow_request_accept": "Aceptar", "follow_request_deny": "Rechazar" }, "timeline": { "user_main": "Publicaciones", "user_comments": "Con Notas", "newest": "M\u00e1s nuevo", "oldest": "M\u00e1s viejo", "home_following": "Seguidores", "home_global": "Global", "home_comments": "Notas" }, "login": { "username": "Nombre para mostrar", "password": "Contrase\u00f1a", "confirm": "Confirma Contrase\u00f1a", "invite_code": "C\u00f3digo de invitaci\u00f3n", "logout_info": "Haz clic aqu\u00ed si no ha sido redirigido autom\u00e1ticamente", "sign_up_button": "Inscribirse", "log_in_button": "Iniciar sesi\u00f3n", "new_accounts_disabled": "Se ha cerrado crear nuevas cuentas.", "already_have_account": "\u00bfYa tienes una cuenta? Mejor iniciar una sesi\u00f3n.", "dont_have_account": "\u00bfNo tienes una cuenta? Mejor inscribirse." }, "search": { "button": "Buscar", "content_placeholder": "Contenido de la publicaci\u00f3n", "advanced": "Avanzada", "cw": "Advertencia de Contenido:", "cw_placeholder": "Contenido de la AC (opcional)", "author": "Creado por:", "author_placeholder": "Nombre para mostrar (opcional)", "quote": "\u00bfCon una cita?", "poll": "\u00bfCon una encuesta?", "comment": "\u00bfEs una Nota?", "any": "Cualquier", "yes": "S\u00ed", "no": "No" }, "not_found": { "subtitle": "No se encontr\u00f3 el URL", "back": "Volver a inicio" }, "update": { "title": "%s hab\u00eda actualizado!", "view_changes": "Mirar a los Cambios", "dismiss": "Descartar" } },
};
let L = LANGS[localStorage.getItem("smiggins-language") || "en"];
const RE_TLDs = "aaa|aarp|abb|abbott|abbvie|abc|able|abogado|abudhabi|ac|academy|accenture|accountant|accountants|aco|actor|ad|ads|adult|ae|aeg|aero|aetna|af|afl|africa|ag|agakhan|agency|ai|aig|airbus|airforce|airtel|akdn|al|alibaba|alipay|allfinanz|allstate|ally|alsace|alstom|am|amazon|americanexpress|americanfamily|amex|amfam|amica|amsterdam|analytics|android|anquan|anz|ao|aol|apartments|app|apple|aq|aquarelle|ar|arab|aramco|archi|army|arpa|art|arte|as|asda|asia|associates|at|athleta|attorney|au|auction|audi|audible|audio|auspost|author|auto|autos|aw|aws|ax|axa|az|azure|ba|baby|baidu|banamex|band|bank|bar|barcelona|barclaycard|barclays|barefoot|bargains|baseball|basketball|bauhaus|bayern|bb|bbc|bbt|bbva|bcg|bcn|bd|be|beats|beauty|beer|berlin|best|bestbuy|bet|bf|bg|bh|bharti|bi|bible|bid|bike|bing|bingo|bio|biz|bj|black|blackfriday|blockbuster|blog|bloomberg|blue|bm|bms|bmw|bn|bnpparibas|bo|boats|boehringer|bofa|bom|bond|boo|book|booking|bosch|bostik|boston|bot|boutique|box|br|bradesco|bridgestone|broadway|broker|brother|brussels|bs|bt|build|builders|business|buy|buzz|bv|bw|by|bz|bzh|ca|cab|cafe|cal|call|calvinklein|cam|camera|camp|canon|capetown|capital|capitalone|car|caravan|cards|care|career|careers|cars|casa|case|cash|casino|cat|catering|catholic|cba|cbn|cbre|cc|cd|center|ceo|cern|cf|cfa|cfd|cg|ch|chanel|channel|charity|chase|chat|cheap|chintai|christmas|chrome|church|ci|cipriani|circle|cisco|citadel|citi|citic|city|ck|cl|claims|cleaning|click|clinic|clinique|clothing|cloud|club|clubmed|cm|cn|co|coach|codes|coffee|college|cologne|com|commbank|community|company|compare|computer|comsec|condos|construction|consulting|contact|contractors|cooking|cool|coop|corsica|country|coupon|coupons|courses|cpa|cr|credit|creditcard|creditunion|cricket|crown|crs|cruise|cruises|cu|cuisinella|cv|cw|cx|cy|cymru|cyou|cz|dad|dance|data|date|dating|datsun|day|dclk|dds|de|deal|dealer|deals|degree|delivery|dell|deloitte|delta|democrat|dental|dentist|desi|design|dev|dhl|diamonds|diet|digital|direct|directory|discount|discover|dish|diy|dj|dk|dm|dnp|do|docs|doctor|dog|domains|dot|download|drive|dtv|dubai|dunlop|dupont|durban|dvag|dvr|dz|earth|eat|ec|eco|edeka|edu|education|ee|eg|email|emerck|energy|engineer|engineering|enterprises|epson|equipment|er|ericsson|erni|es|esq|estate|et|eu|eurovision|eus|events|exchange|expert|exposed|express|extraspace|fage|fail|fairwinds|faith|family|fan|fans|farm|farmers|fashion|fast|fedex|feedback|ferrari|ferrero|fi|fidelity|fido|film|final|finance|financial|fire|firestone|firmdale|fish|fishing|fit|fitness|fj|fk|flickr|flights|flir|florist|flowers|fly|fm|fo|foo|food|football|ford|forex|forsale|forum|foundation|fox|fr|free|fresenius|frl|frogans|frontier|ftr|fujitsu|fun|fund|furniture|futbol|fyi|ga|gal|gallery|gallo|gallup|game|games|gap|garden|gay|gb|gbiz|gd|gdn|ge|gea|gent|genting|george|gf|gg|ggee|gh|gi|gift|gifts|gives|giving|gl|glass|gle|global|globo|gm|gmail|gmbh|gmo|gmx|gn|godaddy|gold|goldpoint|golf|goo|goodyear|goog|google|gop|got|gov|gp|gq|gr|grainger|graphics|gratis|green|gripe|grocery|group|gs|gt|gu|gucci|guge|guide|guitars|guru|gw|gy|hair|hamburg|hangout|haus|hbo|hdfc|hdfcbank|health|healthcare|help|helsinki|here|hermes|hiphop|hisamitsu|hitachi|hiv|hk|hkt|hm|hn|hockey|holdings|holiday|homedepot|homegoods|homes|homesense|honda|horse|hospital|host|hosting|hot|hotels|hotmail|house|how|hr|hsbc|ht|hu|hughes|hyatt|hyundai|ibm|icbc|ice|icu|id|ie|ieee|ifm|ikano|il|im|imamat|imdb|immo|immobilien|in|inc|industries|infiniti|info|ing|ink|institute|insurance|insure|int|international|intuit|investments|io|ipiranga|iq|ir|irish|is|ismaili|ist|istanbul|it|itau|itv|jaguar|java|jcb|je|jeep|jetzt|jewelry|jio|jll|jm|jmp|jnj|jo|jobs|joburg|jot|joy|jp|jpmorgan|jprs|juegos|juniper|kaufen|kddi|ke|kerryhotels|kerryproperties|kfh|kg|kh|ki|kia|kids|kim|kindle|kitchen|kiwi|km|kn|koeln|komatsu|kosher|kp|kpmg|kpn|kr|krd|kred|kuokgroup|kw|ky|kyoto|kz|la|lacaixa|lamborghini|lamer|land|landrover|lanxess|lasalle|lat|latino|latrobe|law|lawyer|lb|lc|lds|lease|leclerc|lefrak|legal|lego|lexus|lgbt|li|lidl|life|lifeinsurance|lifestyle|lighting|like|lilly|limited|limo|lincoln|link|live|living|lk|llc|llp|loan|loans|locker|locus|lol|london|lotte|lotto|love|lpl|lplfinancial|lr|ls|lt|ltd|ltda|lu|lundbeck|luxe|luxury|lv|ly|ma|madrid|maif|maison|makeup|man|management|mango|map|market|marketing|markets|marriott|marshalls|mattel|mba|mc|mckinsey|md|me|med|media|meet|melbourne|meme|memorial|men|menu|merckmsd|mg|mh|miami|microsoft|mil|mini|mint|mit|mitsubishi|mk|ml|mlb|mls|mm|mma|mn|mo|mobi|mobile|moda|moe|moi|mom|monash|money|monster|mormon|mortgage|moscow|moto|motorcycles|mov|movie|mp|mq|mr|ms|msd|mt|mtn|mtr|mu|museum|music|mv|mw|mx|my|mz|na|nab|nagoya|name|navy|nba|nc|ne|nec|net|netbank|netflix|network|neustar|new|news|next|nextdirect|nexus|nf|nfl|ng|ngo|nhk|ni|nico|nike|nikon|ninja|nissan|nissay|nl|no|nokia|norton|now|nowruz|nowtv|np|nr|nra|nrw|ntt|nu|nyc|nz|obi|observer|office|okinawa|olayan|olayangroup|ollo|om|omega|one|ong|onl|online|ooo|open|oracle|orange|org|organic|origins|osaka|otsuka|ott|ovh|pa|page|panasonic|paris|pars|partners|parts|party|pay|pccw|pe|pet|pf|pfizer|pg|ph|pharmacy|phd|philips|phone|photo|photography|photos|physio|pics|pictet|pictures|pid|pin|ping|pink|pioneer|pizza|pk|pl|place|play|playstation|plumbing|plus|pm|pn|pnc|pohl|poker|politie|porn|post|pr|praxi|press|prime|pro|prod|productions|prof|progressive|promo|properties|property|protection|pru|prudential|ps|pt|pub|pw|pwc|py|qa|qpon|quebec|quest|racing|radio|re|read|realestate|realtor|realty|recipes|red|redumbrella|rehab|reise|reisen|reit|reliance|ren|rent|rentals|repair|report|republican|rest|restaurant|review|reviews|rexroth|rich|richardli|ricoh|ril|rio|rip|ro|rocks|rodeo|rogers|room|rs|rsvp|ru|rugby|ruhr|run|rw|rwe|ryukyu|sa|saarland|safe|safety|sakura|sale|salon|samsclub|samsung|sandvik|sandvikcoromant|sanofi|sap|sarl|sas|save|saxo|sb|sbi|sbs|sc|scb|schaeffler|schmidt|scholarships|school|schule|schwarz|science|scot|sd|se|search|seat|secure|security|seek|select|sener|services|seven|sew|sex|sexy|sfr|sg|sh|shangrila|sharp|shell|shia|shiksha|shoes|shop|shopping|shouji|show|si|silk|sina|singles|site|sj|sk|ski|skin|sky|skype|sl|sling|sm|smart|smile|sn|sncf|so|soccer|social|softbank|software|sohu|solar|solutions|song|sony|soy|spa|space|sport|spot|sr|srl|ss|st|stada|staples|star|statebank|statefarm|stc|stcgroup|stockholm|storage|store|stream|studio|study|style|su|sucks|supplies|supply|support|surf|surgery|suzuki|sv|swatch|swiss|sx|sy|sydney|systems|sz|tab|taipei|talk|taobao|target|tatamotors|tatar|tattoo|tax|taxi|tc|tci|td|tdk|team|tech|technology|tel|temasek|tennis|teva|tf|tg|th|thd|theater|theatre|tiaa|tickets|tienda|tips|tires|tirol|tj|tjmaxx|tjx|tk|tkmaxx|tl|tm|tmall|tn|to|today|tokyo|tools|top|toray|toshiba|total|tours|town|toyota|toys|tr|trade|trading|training|travel|travelers|travelersinsurance|trust|trv|tt|tube|tui|tunes|tushu|tv|tvs|tw|tz|ua|ubank|ubs|ug|uk|unicom|university|uno|uol|ups|us|uy|uz|va|vacations|vana|vanguard|vc|ve|vegas|ventures|verisign|versicherung|vet|vg|vi|viajes|video|vig|viking|villas|vin|vip|virgin|visa|vision|viva|vivo|vlaanderen|vn|vodka|volvo|vote|voting|voto|voyage|vu|wales|walmart|walter|wang|wanggou|watch|watches|weather|weatherchannel|webcam|weber|website|wed|wedding|weibo|weir|wf|whoswho|wien|wiki|williamhill|win|windows|wine|winners|wme|wolterskluwer|woodside|work|works|world|wow|ws|wtc|wtf|xbox|xerox|xihuan|xin|xn--11b4c3d|xn--1ck2e1b|xn--1qqw23a|xn--2scrj9c|xn--30rr7y|xn--3bst00m|xn--3ds443g|xn--3e0b707e|xn--3hcrj9c|xn--3pxu8k|xn--42c2d9a|xn--45br5cyl|xn--45brj9c|xn--45q11c|xn--4dbrk0ce|xn--4gbrim|xn--54b7fta0cc|xn--55qw42g|xn--55qx5d|xn--5su34j936bgsg|xn--5tzm5g|xn--6frz82g|xn--6qq986b3xl|xn--80adxhks|xn--80ao21a|xn--80aqecdr1a|xn--80asehdb|xn--80aswg|xn--8y0a063a|xn--90a3ac|xn--90ae|xn--90ais|xn--9dbq2a|xn--9et52u|xn--9krt00a|xn--b4w605ferd|xn--bck1b9a5dre4c|xn--c1avg|xn--c2br7g|xn--cck2b3b|xn--cckwcxetd|xn--cg4bki|xn--clchc0ea0b2g2a9gcd|xn--czr694b|xn--czrs0t|xn--czru2d|xn--d1acj3b|xn--d1alf|xn--e1a4c|xn--eckvdtc9d|xn--efvy88h|xn--fct429k|xn--fhbei|xn--fiq228c5hs|xn--fiq64b|xn--fiqs8s|xn--fiqz9s|xn--fjq720a|xn--flw351e|xn--fpcrj9c3d|xn--fzc2c9e2c|xn--fzys8d69uvgm|xn--g2xx48c|xn--gckr3f0f|xn--gecrj9c|xn--gk3at1e|xn--h2breg3eve|xn--h2brj9c|xn--h2brj9c8c|xn--hxt814e|xn--i1b6b1a6a2e|xn--imr513n|xn--io0a7i|xn--j1aef|xn--j1amh|xn--j6w193g|xn--jlq480n2rg|xn--jvr189m|xn--kcrx77d1x4a|xn--kprw13d|xn--kpry57d|xn--kput3i|xn--l1acc|xn--lgbbat1ad8j|xn--mgb9awbf|xn--mgba3a3ejt|xn--mgba3a4f16a|xn--mgba7c0bbn0a|xn--mgbaam7a8h|xn--mgbab2bd|xn--mgbah1a3hjkrd|xn--mgbai9azgqp6j|xn--mgbayh7gpa|xn--mgbbh1a|xn--mgbbh1a71e|xn--mgbc0a9azcg|xn--mgbca7dzdo|xn--mgbcpq6gpa1a|xn--mgberp4a5d4ar|xn--mgbgu82a|xn--mgbi4ecexp|xn--mgbpl2fh|xn--mgbt3dhd|xn--mgbtx2b|xn--mgbx4cd0ab|xn--mix891f|xn--mk1bu44c|xn--mxtq1m|xn--ngbc5azd|xn--ngbe9e0a|xn--ngbrx|xn--node|xn--nqv7f|xn--nqv7fs00ema|xn--nyqy26a|xn--o3cw4h|xn--ogbpf8fl|xn--otu796d|xn--p1acf|xn--p1ai|xn--pgbs0dh|xn--pssy2u|xn--q7ce6a|xn--q9jyb4c|xn--qcka1pmc|xn--qxa6a|xn--qxam|xn--rhqv96g|xn--rovu88b|xn--rvc1e0am3e|xn--s9brj9c|xn--ses554g|xn--t60b56a|xn--tckwe|xn--tiq49xqyj|xn--unup4y|xn--vermgensberater-ctb|xn--vermgensberatung-pwb|xn--vhquv|xn--vuq861b|xn--w4r85el8fhu5dnra|xn--w4rs40l|xn--wgbh1c|xn--wgbl6a|xn--xhq521b|xn--xkc2al3hye2a|xn--xkc2dl3a5ee0h|xn--y9a3aq|xn--yfro4i67o|xn--ygbi2ammx|xn--zfr164b|xxx|xyz|yachts|yahoo|yamaxun|yandex|ye|yodobashi|yoga|yokohama|you|youtube|yt|yun|za|zappos|zara|zero|zip|zm|zone|zuerich|zw";
const RE_IP_NUM = "25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}";
const RE_PORTS = ":(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[0-5][0-9]{4}|[1-9][0-9]{0,3})";
let urlRegex = new RegExp(`(?:https?:\\/\\/)?(?:(?:${RE_IP_NUM}\\.){3}(?:${RE_IP_NUM})|(?:[\\-a-z0-9]+\\.){1,}(?:${RE_TLDs}))\\b(?:${RE_PORTS}\\b)?(?:/(?:&amp;|[\\-a-zA-Z0-9@:%_\\+.~#?\\/=])*)?`, "g");
let mentionRegex = new RegExp(`@([a-zA-Z0-9_\\-]{1,${limits.username}})\\b`, "g");
let hashtagRegex = /#([a-zA-Z_][a-zA-Z0-9_]{0,63})\b/g;
function withinBounds(index, length, bounds) {
    for (const i of bounds) {
        if ((i.index <= index && i.index + i.length - 1 >= index) ||
            (i.index <= index + length - 1 && i.index + i.length - 1 >= index + length - 1) ||
            (i.index >= index && i.index + i.length - 1 <= index + length - 1)) {
            return true;
        }
    }
    return false;
}
function urlReplacements(str, repl) {
    repl.sort((a, b) => (b.index - a.index));
    for (const r of repl) {
        let linkTag = `<a href="${r.href}" ${r.hiddenLink ? "class=\"plain-link\"" : ""} ${r.internalIntent ? `data-internal-link="${r.internalIntent}"` : "target=\"_blank\""}>`;
        str = str.slice(0, r.index) + linkTag + str.slice(r.index, r.index + r.length) + "</a>" + str.slice(r.index + r.length);
    }
    return str;
}
function linkify(str, postIDOrUsername) {
    let urlReplacement = [];
    for (const url of str.matchAll(urlRegex)) {
        let link = url[0];
        if (!link.startsWith("https://") && !link.startsWith("http://")) {
            link = "https://" + link;
        }
        urlReplacement.push({
            index: url.index,
            length: url[0].length,
            href: unescapeHTML(link)
        });
    }
    for (const mention of str.matchAll(mentionRegex)) {
        if (!withinBounds(mention.index, mention[0].length, urlReplacement)) {
            urlReplacement.push({
                index: mention.index,
                length: mention[0].length,
                href: `/u/${mention[1]}/`,
                internalIntent: "user"
            });
        }
    }
    for (const hashtag of str.matchAll(hashtagRegex)) {
        if (!withinBounds(hashtag.index, hashtag[0].length, urlReplacement)) {
            urlReplacement.push({
                index: hashtag.index,
                length: hashtag[0].length,
                href: `/tag/${hashtag[1].toLowerCase()}/`,
                internalIntent: "hashtag"
            });
        }
    }
    if (postIDOrUsername) {
        let href = typeof postIDOrUsername === "number" ? `/p/${postIDOrUsername}/` : `/u/${postIDOrUsername}/`;
        let newReplacements = [];
        let textIndex = 0;
        urlReplacement.sort((a, b) => (a.index - b.index));
        for (const repl of urlReplacement) {
            if (repl.index - textIndex > 0) {
                newReplacements.push({
                    index: textIndex,
                    length: repl.index - textIndex,
                    href: href,
                    internalIntent: typeof postIDOrUsername === "number" ? "post" : "user",
                    hiddenLink: true
                });
            }
            textIndex = repl.index + repl.length;
        }
        let lastRepl = urlReplacement[urlReplacement.length - 1];
        if (lastRepl && lastRepl.index + lastRepl.length < str.length) {
            newReplacements.push({
                index: lastRepl.index + lastRepl.length,
                length: str.length - lastRepl.index - lastRepl.length,
                href: href,
                internalIntent: typeof postIDOrUsername === "number" ? "post" : "user",
                hiddenLink: true
            });
        }
        else if (!lastRepl) {
            newReplacements.push({
                index: 0,
                length: str.length,
                href: href,
                internalIntent: typeof postIDOrUsername === "number" ? "post" : "user",
                hiddenLink: true
            });
        }
        urlReplacement.push(...newReplacements);
    }
    return urlReplacements(str, urlReplacement);
    ;
}
let postModalFor = undefined;
function createPostModal(type, id) {
    var _a, _b, _c, _d;
    if (document.getElementById("modal") || !loggedIn) {
        return;
    }
    let extraVars = {
        hidden_if_no_quote: "hidden",
        hidden_if_no_comment: "hidden",
        hidden_if_no_poll: "",
        poll_items: getPollInputsHTML("modal", "#modal-post"),
        private_post: "",
        placeholder: L.post.placeholder,
        action: L.post.button
    };
    postModalFor = undefined;
    if (type && id !== undefined) {
        let post = postCache[id];
        if (!post) {
            console.log("post modal post not found", id);
            return;
        }
        postModalFor = {
            type: type,
            id: id
        };
        extraVars = {
            placeholder: L.post.placeholder,
            action: L.post.button,
            hidden_if_no_quote: "hidden",
            hidden_if_no_comment: "hidden",
            hidden_if_no_poll: "",
            poll_items: getPollInputsHTML("modal", "#modal-post"),
            private_post: post.private ? "data-private-post" : "",
            username: post.user.username,
            timestamp: getTimestamp(post.timestamp),
            checked_if_private: (defaultPostPrivate || ((type === "comment" || type === "quote") && post.private)) ? "checked" : "",
            content: [simplePostContent(post), 1],
            display_name: [escapeHTML(post.user.display_name), 1],
            content_2: [simplePostContent(post), 1],
            display_name_2: [escapeHTML(post.user.display_name), 1]
        };
        if (type === "quote") {
            extraVars.hidden_if_no_quote = "";
            extraVars.action = L.post.quote_button;
            extraVars.placeholder = L.post.quote_placeholder[Math.floor(Math.random() * L.post.quote_placeholder.length)];
        }
        else if (type === "comment") {
            extraVars.hidden_if_no_comment = "";
            extraVars.action = L.post.comment_button;
            extraVars.placeholder = L.post.comment_placeholder[Math.floor(Math.random() * L.post.comment_placeholder.length)];
        }
        else if (type === "edit") {
            extraVars.action = L.post.edit_button;
            extraVars.placeholder = L.post.edit_placeholder;
            extraVars.hidden_if_no_poll = "hidden";
        }
    }
    let el = getSnippet("modal/compose", extraVars);
    (_a = el.querySelector("#modal-post")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", postModalCreatePost);
    (_b = el.querySelector("#modal")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", clearModalIfClicked);
    document.body.append(el);
    (_c = el.querySelector("#modal-post-content")) === null || _c === void 0 ? void 0 : _c.focus();
    (_d = el.querySelector("#modal-poll-toggle")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", function () {
        let pollElement = el.querySelector("#modal-poll-area");
        if (pollElement) {
            pollElement.hidden = !pollElement.hidden;
        }
    });
    document.addEventListener("keydown", clearModalOnEscape);
    if (type === "edit" && id !== undefined) {
        let post = postCache[id];
        if (!post) {
            return;
        }
        if (post.content_warning) {
            let cwEl = el.querySelector("#modal-post-cw");
            if (cwEl) {
                cwEl.value = post.content_warning;
            }
        }
        let contentEl = el.querySelector("#modal-post-content");
        if (contentEl) {
            contentEl.value = post.content;
        }
        let privEl = el.querySelector("#modal-post-private");
        if (privEl) {
            privEl.checked = post.private;
        }
    }
    else if (type === "comment" && id !== undefined) {
        let post = postCache[id];
        if (!post) {
            return;
        }
        let contentEl = el.querySelector("#modal-post-content");
        if (contentEl) {
            contentEl.value = getPostMentionsString(post);
        }
    }
    if ((type === "comment" || type === "quote") && id !== undefined) {
        let post = postCache[id];
        if (!post) {
            return;
        }
        let cwEl = el.querySelector("#modal-post-cw");
        if (cwEl) {
            cwEl.value = getPostTemplatedCW(post);
        }
    }
}
function createUpdateModal(since) {
    var _a;
    if (document.getElementById("modal")) {
        return;
    }
    document.body.append(getSnippet("modal/update", {
        since: since,
        update_title: lr(L.update.title, {
            s: pageTitle
        })
    }));
    (_a = document.getElementById("modal")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", clearModalIfClicked);
    document.addEventListener("keydown", clearModalOnEscape);
}
function createFollowingModal(type, username) {
    var _a;
    if (document.getElementById("modal")) {
        return;
    }
    let displayName = userCache[username] && userCache[username].display_name || username;
    document.body.append(getSnippet("modal/following", {
        title: type === "following" ? `${displayName} follows:` : `${displayName} is followed by:`
    }));
    hookFollowingTimeline(type, username);
    (_a = document.getElementById("modal")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", clearModalIfClicked);
    document.addEventListener("keydown", clearModalOnEscape);
}
function modifyKeybindModal(kbId) {
    var _a, _b, _c;
    let kbData = keybinds[kbId];
    let el = getSnippet("modal/keybind", {
        keybind_title: kbData.name || "",
        keybind_description: kbData.description || "",
        hidden_if_no_description: kbData.description ? "" : "hidden"
    });
    forceDisableKeybinds = true;
    (_a = el.querySelector("#kb-modal-input")) === null || _a === void 0 ? void 0 : _a.addEventListener("keydown", (e) => {
        if (["shift", "alt", "control", "meta", " "].includes(e.key.toLowerCase())) {
        }
        else if (setKeybindKey(kbId, e.key, {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            nav: kbData.modifiers && kbData.modifiers.includes("nav"),
            shift: e.shiftKey
        })) {
            if (kbId === "navModifier") {
                for (const el of document.querySelectorAll("[data-kb-id^=\"nav\"]")) {
                    setKeybindElementData(el.dataset.kbId || kbId, el);
                }
            }
            let kbEl = document.querySelector(`[data-kb-id="${kbId}"]`);
            if (kbEl) {
                setKeybindElementData(kbId, kbEl);
            }
            clearModal();
        }
        else {
            createToast("Key already in use");
        }
        e.preventDefault();
    });
    document.body.append(el);
    (_b = el.querySelector("#kb-modal-input")) === null || _b === void 0 ? void 0 : _b.focus();
    (_c = el.querySelector("#modal")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", clearModalIfClicked);
    document.addEventListener("keydown", clearModalOnEscape);
}
function newMessageModal() {
    var _a, _b, _c;
    if (document.getElementById("modal")) {
        return;
    }
    document.body.append(getSnippet("modal/message"));
    (_a = document.getElementById("message-modal-add")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        var _a, _b, _c, _d, _e;
        let count = document.querySelectorAll("#message-modal-inputs input").length;
        if (count >= 255) {
            return;
        }
        (_a = document.querySelector("#message-modal-inputs input:not([data-enter-next])")) === null || _a === void 0 ? void 0 : _a.setAttribute("data-enter-next", `#message-modal-inputs :nth-child(${count + 1}) input`);
        (_b = document.getElementById("message-modal-inputs")) === null || _b === void 0 ? void 0 : _b.insertAdjacentHTML("beforeend", `<div>@<input autofocus data-enter-submit="#message-modal-create" placeholder="${L.generic.username}"></div>`);
        (_c = document.querySelector("#message-modal-inputs input:not([data-enter-next])")) === null || _c === void 0 ? void 0 : _c.addEventListener("keydown", inputEnterEvent);
        (_d = document.querySelector("#message-modal-inputs input:not([data-enter-next])")) === null || _d === void 0 ? void 0 : _d.focus();
        if (count >= 254) {
            (_e = document.getElementById("message-modal-add")) === null || _e === void 0 ? void 0 : _e.setAttribute("hidden", "");
        }
    });
    (_b = document.getElementById("message-modal-create")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
        let usernames = [...document.querySelectorAll("#message-modal-inputs input")].map((a) => (a.value.toLowerCase())).filter(Boolean);
        if (!usernames.length) {
            return;
        }
        new api_MessageGetGID(usernames, document.getElementById("message-modal-create")).fetch();
    });
    (_c = document.getElementById("modal")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", clearModalIfClicked);
}
function postModalCreatePost(e) {
    var _a;
    let cwElement = document.getElementById("modal-post-cw");
    let contentElement = document.getElementById("modal-post-content");
    let privatePostElement = document.getElementById("modal-post-private");
    if (!cwElement || !contentElement || !privatePostElement) {
        return;
    }
    let cw = cwElement.value;
    let content = contentElement.value;
    let privatePost = privatePostElement.checked;
    let poll = [];
    if (!postModalFor || postModalFor.type !== "edit") {
        for (const el of document.querySelectorAll(":not([hidden]) > div > [data-poll-input=\"modal\"]")) {
            if (el.value) {
                poll.push(el.value);
            }
        }
    }
    if (!content && poll.length === 0) {
        contentElement.focus();
        return;
    }
    (_a = e.target) === null || _a === void 0 ? void 0 : _a.setAttribute("disabled", "");
    if (postModalFor && postModalFor.type === "edit") {
        new api_EditPost(postModalFor.id, content, cw, privatePost, e.target)
            .fetch()
            .then((success) => {
            if (success && postModalFor) {
                let p = postCache[postModalFor.id];
                clearModal();
                if (p) {
                    p.content = content;
                    p.content_warning = cw;
                    p.private = privatePost;
                    p.edited = true;
                    for (const el of document.querySelectorAll(`[data-edit-replace="${postModalFor.id}"]`)) {
                        el.replaceWith(getPost(p.id, false));
                    }
                }
            }
            else {
                contentElement.focus();
            }
        });
    }
    else {
        let extra = {};
        if (postModalFor) {
            extra[postModalFor.type] = postModalFor.id;
        }
        if (poll.length !== 0) {
            extra.poll = poll;
        }
        createPost(content, cw || null, privatePost, (success) => {
            var _a;
            if (success) {
                if (postModalFor && postModalFor.type === "quote") {
                    let els = document.querySelectorAll(`[data-interaction-quote="${postModalFor.id}"] [data-number]`);
                    for (const el of els) {
                        if (!isNaN(+el.innerText)) {
                            el.innerText = String(+el.innerText + 1);
                        }
                    }
                }
                else if (postModalFor && postModalFor.type === "comment") {
                    let els = document.querySelectorAll(`[data-interaction-comment="${postModalFor.id}"] [data-number]`);
                    for (const el of els) {
                        if (!isNaN(+el.innerText)) {
                            el.innerText = String(+el.innerText + 1);
                        }
                    }
                }
                clearModal();
            }
            else {
                contentElement.focus();
                (_a = e.target) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
            }
        }, extra);
    }
}
function clearModalOnEscape(e) {
    if (e.key === "Escape") {
        clearModal();
        document.removeEventListener("keydown", clearModalOnEscape);
        e.preventDefault();
    }
}
function clearModalIfClicked(e) {
    var _a;
    if (((_a = e.target) === null || _a === void 0 ? void 0 : _a.dataset.closeModal) !== undefined) {
        clearModal();
    }
}
function clearModal() {
    var _a;
    (_a = document.getElementById("modal")) === null || _a === void 0 ? void 0 : _a.remove();
    forceDisableKeybinds = false;
}
const container = document.getElementById("container");
function urlToIntent(path) {
    path = normalizePath(path);
    if (loggedIn) {
        switch (path) {
            case "/home/":
            case "/login/":
            case "/signup/": history.pushState("home", "", "/");
            case "/": return "home";
            case "/notifications/": return "notifications";
            case "/follow-requests/": return "follow-requests";
            case "/search/": return "search";
            case "/messages/": return "message-list";
            case "/settings/profile/": return "settings/profile";
            case "/settings/keybinds/": return "settings/keybinds";
            case "/settings/account/": return "settings/account";
            case isAdmin && "/admin/": return "admin";
            case /^\/tag\/[a-z0-9_]+\/$/.test(path) ? path : "": return "hashtag";
            case /^\/message\/[0-9]+\/$/.test(path) ? path : "": return "message";
        }
    }
    else {
        switch (path) {
            case "/": return "index";
            case "/login/": return "login";
            case "/signup/": return "signup";
        }
    }
    switch (path) {
        case "/logout/": return "logout";
        case /^\/u\/[a-z0-9_\-]+\/$/.test(path) ? path : "": return "user";
        case /^\/p\/[0-9]+\/$/.test(path) ? path : "": return "post";
        case "/settings/": return "settings";
        case "/settings/cosmetic/": return "settings/cosmetic";
        case "/settings/about/": return "settings/about";
        case "/changes/all/":
        case /^\/changes\/[0-9]+\.[0-9]+\.[0-9]\/$/.test(path) ? path : "":
            return "changelog";
        default: return "404";
    }
}
function generateInternalLinks(element) {
    if (!element) {
        element = container;
    }
    let links = element.querySelectorAll("[data-internal-link]:not([data-link-processed])");
    for (const i of links) {
        i.dataset.linkProcessed = "";
        if (IS_IFRAME) {
            i.setAttribute("target", "_blank");
        }
        else {
            i.addEventListener("click", internalLinkHandler);
        }
    }
}
function internalLinkHandler(e) {
    if (!e.ctrlKey) {
        let el = e.currentTarget;
        let newPage = el.dataset.internalLink;
        let newURL = el.href || null;
        if (newURL === null || newURL === void 0 ? void 0 : newURL.includes("//")) {
            newURL = "/" + newURL.split("//")[1].split("/").slice(1).join("/");
        }
        if (newURL && newPage === "post" && getPostIDFromPath(newURL) === getPostIDFromPath()) {
            createPostModal("comment", getPostIDFromPath());
        }
        else if (newPage !== currentPage || newPage === "post"
            || (newURL && newPage === "user" && getUsernameFromPath(newURL) !== getUsernameFromPath())
            || (newURL && newPage === "hashtag" && getHashtagFromPath(newURL) !== getHashtagFromPath())) {
            history.pushState(newPage, "", newURL);
            renderPage(newPage);
            currentPage = newPage;
        }
        e.preventDefault();
    }
}
function normalizePath(path, includeQueryParams) {
    if (!path.split("?")[0].endsWith("/")) {
        path = path.split("?")[0] + "/" + path.split("?").slice(1).map((a) => ("?" + a));
    }
    if (!path.startsWith("/")) {
        path = "/" + path;
    }
    return includeQueryParams ? path.toLowerCase() : path.toLowerCase().split("?")[0];
}
function renderPage(intent) {
    let extraVariables = {};
    let c;
    clearModal();
    switch (intent) {
        case "home":
            extraVariables = {
                poll_items: getPollInputsHTML("home", "#post")
            };
            break;
        case "user":
            let u = getUsernameFromPath();
            c = userCache[u];
            extraVariables = {
                color_one: c && c.color_one || "var(--background-mid)",
                color_two: c && c.color_two || "var(--background-mid)",
                following: lr(L.user.following_count, { n: c && floatintToStr(c.num_following) || "0" }),
                followers: lr(L.user.followed_by_count, { n: c && floatintToStr(c.num_followers) || "0" }),
                post_count: lr(L.user.posts_count, { n: c && floatintToStr(c.num_posts) || "0" }),
                bio: c && [linkify(escapeHTML(c.bio)), 1] || "",
                user_username: c && [escapeHTML(u + (c.pronouns ? " - " + c.pronouns : "")), 1] || u,
                display_name: c && [escapeHTML(c.display_name), 1] || u
            };
            break;
        case "settings/profile":
            let defaultBanner = window.getComputedStyle(document.documentElement).getPropertyValue("--background-mid");
            c = userCache[username];
            extraVariables = {
                color_one: c && c.color_one || defaultBanner,
                color_two: c && c.color_two || defaultBanner,
                checked_if_gradient: !c || !c.color_one || !c.color_two || c.color_one === c.color_two ? "" : "checked",
                display_name: c && escapeHTML(c.display_name) || username,
                bio: c && escapeHTML(c.bio) || "",
                pronouns_presets: L.settings.profile.pronouns_presets.map((a) => (`<option value="${a}">${a}</option>`)).join("")
            };
            break;
        case "settings/account":
            extraVariables = {
                delete_account_confirmation: lr(L.settings.account.confirmation, {
                    B: "<span class=\"warning\">",
                    b: "</span>",
                    u: `<b>@${username}</b>`
                })
            };
            break;
        case "settings/about":
            extraVariables = {
                changes_link: lr(L.settings.about.past_changes, {
                    h: `<a href="/changes/all/" data-internal-link="changelog">${L.settings.about.here}</a>`
                })
            };
            break;
        case "post":
            let pid = getPostIDFromPath();
            let p = postCache[pid];
            extraVariables = {
                pid: String(pid),
                parent: String(p && p.comment),
                hidden_if_comment: p && p.comment ? "hidden" : "",
                hidden_if_not_comment: p && p.comment ? "" : "hidden",
                checked_if_private: defaultPostPrivate || p && p.private ? "checked" : ""
            };
            break;
        case "hashtag":
            extraVariables = {
                tag: getHashtagFromPath()
            };
            break;
        case "changelog":
            extraVariables = {
                changes: generateChangesHTML(location.pathname.split("/").filter(Boolean)[1])
            };
            break;
    }
    if (tlPollingIntervalID) {
        clearInterval(tlPollingIntervalID);
        tlPollingIntervalID = null;
    }
    let snippet = getSnippet(`pages/${intent}`, extraVariables);
    container.replaceChildren(snippet);
    document.title = getPageTitle(intent);
    currentPage = intent;
    resetNotificationIndicators();
}
function getPageTitle(intent) {
    let notificationString = "";
    if (Object.values(pendingNotifications).some(Boolean)) {
        notificationString = "\u2022 ";
    }
    let val = intent;
    switch (intent) {
        case "login":
            val = L.titles.login;
            break;
        case "signup":
            val = L.titles.signup;
            break;
        case "logout":
            val = L.titles.logout;
            break;
        case "404":
            val = L.titles.not_found;
            break;
        case "user":
            val = getUsernameFromPath() + " - ";
            break;
        case "notifications":
            val = L.titles.notifications;
            break;
        case "follow-requests":
            val = L.titles.follow_requests;
            break;
        case "changelog":
            val = L.titles.changes;
            break;
        case "admin":
            val = L.titles.admin;
            break;
        case "search":
            val = L.titles.search;
            break;
        case "message-list":
        case "message":
            val = L.titles.messages;
            break;
        case "index":
        case "home":
        case "post":
            val = null;
            break;
        case "settings":
        case "settings/profile":
        case "settings/cosmetic":
        case "settings/keybinds":
        case "settings/account":
        case "settings/about":
            val = L.titles.settings;
            break;
    }
    if (val) {
        return notificationString + lr(L.titles.base, {
            l: val,
            n: pageTitle
        });
    }
    return notificationString + pageTitle;
}
onpopstate = function (e) {
    currentPage = e.state;
    renderPage(currentPage);
};
let pendingNotifications = {
    notifications: false,
    messages: false,
    follow_requests: false
};
function fetchNotifications() {
    new api_Notifications().fetch();
}
function resetNotificationIndicators() {
    var _a, _b, _c;
    for (const el of document.querySelectorAll("#navbar [data-notif-dot][data-notification]")) {
        delete el.dataset.notification;
    }
    for (const el of document.querySelectorAll("#navbar [data-notif-dot]")) {
        if (pendingNotifications.notifications && ((_a = el.dataset.notifDot) === null || _a === void 0 ? void 0 : _a.includes("notifications"))
            || pendingNotifications.messages && ((_b = el.dataset.notifDot) === null || _b === void 0 ? void 0 : _b.includes("messages"))
            || pendingNotifications.follow_requests && ((_c = el.dataset.notifDot) === null || _c === void 0 ? void 0 : _c.includes("folreq"))) {
            el.dataset.notification = "";
        }
        else {
            delete el.dataset.notification;
        }
    }
    if (pendingNotifications.follow_requests) {
        for (const el of document.querySelectorAll("[data-navbar-folreq-toggle][hidden]")) {
            el.removeAttribute("hidden");
        }
    }
    document.title = getPageTitle(currentPage);
}
if (loggedIn) {
    fetchNotifications();
    setInterval(fetchNotifications, NOTIFICATION_POLLING_INTERVAL);
}
function lr(str, replacements) {
    for (const [key, val] of Object.entries(replacements)) {
        str = str.replaceAll("%" + key, val);
    }
    return str;
}
function n(data, num) {
    if (data[num]) {
        return data[num];
    }
    return data["*"];
}
function langFromRaw(key) {
    let response = L;
    for (const sect of key.split(".")) {
        response = response[sect];
        if (!response) {
            return key;
        }
    }
    return String(response);
}
function floatintToStr(num) {
    if (num >> 14 & 1) {
        return L.numbers.infinity;
    }
    let negative = 1;
    if (num >> 13 & 1) {
        negative = -1;
    }
    let output = (num >> 3 & 0b1111111111) * negative;
    let power = num & 0b11;
    let d10 = Boolean(num >> 2 & 1);
    if (d10) {
        output /= 10;
    }
    let powerLetter = "";
    switch (power) {
        case 0:
            powerLetter = "%n";
            break;
        case 1:
            powerLetter = L.numbers.thousand;
            break;
        case 2:
            powerLetter = L.numbers.million;
            break;
        case 3:
            powerLetter = L.numbers.billion;
            break;
    }
    return lr(powerLetter, {
        n: String(output)
    });
}
function floatintToNum(num) {
    if (num >> 14 & 1) {
        return Infinity;
    }
    let negative = 1;
    if (num >> 13 & 1) {
        negative = -1;
    }
    let output = (num >> 3 & 0b1111111111) * negative;
    let power = num & 0b11;
    let d10 = Boolean(num >> 2 & 1);
    if (d10) {
        output /= 10;
    }
    return output * (Math.pow(1000, power));
}
function _getErrorStrings(code, context) {
    switch (code) {
        case ErrorCodes.BadRequest: return [L.errors.something_went_wrong];
        case ErrorCodes.BadUsername: switch (context) {
            case ResponseCodes.LogIn:
            case ResponseCodes.AdminDeleteUser:
            case ResponseCodes.GetAdminPermissions:
            case ResponseCodes.SetAdminPermissions:
                return [L.errors.bad_username, L.errors.username_no_user];
            case ResponseCodes.SignUp: return [L.errors.bad_username, L.errors.username_characters];
            case ResponseCodes.TimelineUser:
                userSetDNE();
                return [null];
            default: return [L.errors.bad_username];
        }
        case ErrorCodes.UsernameUsed: return [L.errors.username_used];
        case ErrorCodes.BadPassword: return [L.errors.bad_password];
        case ErrorCodes.InvalidOTP: return [L.errors.invalid_otp, L.errors.invalid_otp_more];
        case ErrorCodes.CantInteract: switch (context) {
            case ResponseCodes.DeletePost: return [L.errors.cant_delete, L.errors.cant_delete_more];
            default: return [L.errors.cant_interact, L.errors.cant_interact_more];
        }
        case ErrorCodes.Blocking: return [L.errors.blocking, L.errors.blocking_more];
        case ErrorCodes.PostNotFound: switch (context) {
            case ResponseCodes.TimelineComments:
                postSetDNE();
                return [null];
            default: return [L.errors.post_not_found];
        }
        case ErrorCodes.PollSingleOption: return [L.errors.invalid_poll, L.errors.poll_more_than_one];
        case ErrorCodes.NotAuthenticated: return [L.errors.not_authenticated, L.errors.not_authenticated_more];
        case ErrorCodes.Ratelimit: return [L.errors.ratelimit, L.errors.ratelimit_more];
    }
    return [L.errors.something_went_wrong, lr(L.errors.error_code, { c: context.toString(16) + code.toString(16) })];
}
function _extractString(lengthBits, data) {
    let length = _extractInt(lengthBits, data);
    return [
        new TextDecoder().decode(data.slice(lengthBits / 8, lengthBits / 8 + length)),
        data.slice(lengthBits / 8 + length)
    ];
}
function _extractInt(lengthBits, data) {
    let output = 0;
    for (let i = 0; i * 8 < lengthBits; i++) {
        output <<= 8;
        output += data[i];
    }
    return output;
}
function _extractBool(num, offset) {
    return Boolean((num >> offset) & 1);
}
function _extractPost(data) {
    let postId = _extractInt(32, data);
    let commentParentId = null;
    let postTimestamp = _extractInt(64, data.slice(4));
    let flags = [data[12], data[13]];
    let edited = [_extractBool(flags[1], 7), _extractBool(flags[1], 6)];
    let newData = data.slice(14);
    if (_extractBool(flags[0], 6)) {
        commentParentId = _extractInt(32, newData);
        newData = newData.slice(4);
    }
    let interactions = {
        likes: _extractInt(16, newData),
        liked: _extractBool(flags[0], 3),
        quotes: _extractInt(16, newData.slice(2)),
        comments: _extractInt(16, newData.slice(4)),
    };
    let content = _extractString(16, newData.slice(6));
    let contentWarning = _extractString(8, content[1]);
    let username = _extractString(8, contentWarning[1]);
    let displayName = _extractString(8, username[1]);
    let pronouns = _extractString(8, displayName[1]);
    let banner = ["#" + _toHex(pronouns[1].slice(0, 3)), "#" + _toHex(pronouns[1].slice(3, 6))];
    newData = pronouns[1].slice(6);
    let pollData = null;
    if (_extractBool(flags[0], 0)) {
        let d = _extractPoll(newData);
        pollData = d[0];
        newData = d[1];
    }
    let quoteData = null;
    if (_extractBool(flags[0], 5)) {
        if (!_extractBool(flags[0], 4)) {
            quoteData = false;
        }
        else {
            let quoteIsComment = _extractBool(flags[0], 1);
            let quoteCommentId = null;
            if (quoteIsComment) {
                quoteCommentId = _extractInt(32, newData.slice(12));
            }
            let quoteContent = _extractString(16, newData.slice(12 + (4 * +quoteIsComment)));
            let quoteCW = _extractString(8, quoteContent[1]);
            let quoteUsername = _extractString(8, quoteCW[1]);
            let quoteDispName = _extractString(8, quoteUsername[1]);
            let quotePronouns = _extractString(8, quoteDispName[1]);
            let quoteBanner = ["#" + _toHex(quotePronouns[1].slice(0, 3)), "#" + _toHex(quotePronouns[1].slice(3, 6))];
            quoteData = {
                id: _extractInt(32, newData),
                content: quoteContent[0],
                content_warning: quoteCW[0],
                timestamp: _extractInt(64, newData.slice(4)),
                private: _extractBool(flags[0], 2),
                comment: quoteCommentId,
                edited: edited[1],
                has_poll: _extractBool(flags[1], 5),
                has_quote: _extractBool(flags[1], 4),
                user: {
                    username: quoteUsername[0],
                    display_name: quoteDispName[0],
                    pronouns: quotePronouns[0],
                    banner: quoteBanner
                }
            };
            newData = quotePronouns[1].slice(6);
        }
    }
    return [{
            id: postId,
            content: content[0],
            content_warning: contentWarning[0],
            timestamp: postTimestamp,
            private: _extractBool(flags[0], 7),
            comment: commentParentId,
            edited: edited[0],
            interactions: interactions,
            poll: pollData,
            user: {
                username: username[0],
                display_name: displayName[0],
                pronouns: pronouns[0],
                banner: banner
            },
            quote: quoteData
        }, newData];
}
function _extractPoll(data) {
    let pollData = {
        votes: _extractInt(16, data),
        has_voted: false,
        items: []
    };
    let optionCount = _extractInt(8, data.slice(2));
    data = data.slice(3);
    for (let i = 0; i < optionCount; i++) {
        let content = _extractString(8, data);
        let pct = _extractInt(16, content[1]);
        let voted = _extractBool(content[1][2], 7);
        data = content[1].slice(3);
        if (voted) {
            pollData.has_voted = true;
        }
        pollData.items.push({
            content: content[0],
            percentage: pct / 10,
            voted: voted
        });
    }
    return [pollData, data];
}
function _toHex(data) {
    return [...data].map((i) => i.toString(16).padStart(2, "0")).join("");
}
var _a, _b, _c;
const icons = {
    back: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M7.4 273.4C2.7 268.8 0 262.6 0 256s2.7-12.8 7.4-17.4l176-168c9.6-9.2 24.8-8.8 33.9.8s8.8 24.8-.8 33.9L83.9 232H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H83.9l132.7 126.6c9.6 9.2 9.9 24.3.8 33.9s-24.3 9.9-33.9.8l-176-168z"/></svg>',
    private: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M130.9 168.3v54.4h136v-54.4c0-37.57-30.43-68-68-68s-68 30.43-68 68m-40.8 54.4v-54.4c0-60.095 48.705-108.8 108.8-108.8s108.8 48.705 108.8 108.8v54.4h27.2c30.005 0 54.4 24.395 54.4 54.4v163.2c0 30.005-24.395 54.4-54.4 54.4h-272c-30.005 0-54.4-24.395-54.4-54.4V277.1c0-30.005 24.395-54.4 54.4-54.4zm-40.8 54.4v163.2c0 7.48 6.12 13.6 13.6 13.6h272c7.48 0 13.6-6.12 13.6-13.6V277.1c0-7.48-6.12-13.6-13.6-13.6h-272c-7.48 0-13.6 6.12-13.6 13.6"/></svg>',
    comment_arrow: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M488 528c13.3 0 24 10.7 24 24s-10.7 24-24 24h-96c-53 0-96-43-96-96V145.9l-95 95c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9L303 71c4.5-4.5 10.6-7 17-7s12.5 2.5 17 7l136 136c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-95-95V480c0 26.5 21.5 48 48 48h96z"/></svg>',
    login: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m217 401 128-128c9.4-9.4 9.4-24.6 0-33.9L217 111c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l87 87L24 232c-13.3 0-24 10.7-24 24s10.7 24 24 24h246.1l-87 87c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0zM344 80h80c22.1 0 40 17.9 40 40v272c0 22.1-17.9 40-40 40h-80c-13.3 0-24 10.7-24 24s10.7 24 24 24h80c48.6 0 88-39.4 88-88V120c0-48.6-39.4-88-88-88h-80c-13.3 0-24 10.7-24 24s10.7 24 24 24"/></svg>',
    user_plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M224 48a80 80 0 1 1 0 160 80 80 0 1 1 0-160m0 208a128 128 0 1 0 0-256 128 128 0 1 0 0 256m-45.7 96h91.4c65.7 0 120.1 48.7 129 112H49.3c8.9-63.3 63.3-112 129-112m0-48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3zm325.7 8c0 13.3 10.7 24 24 24s24-10.7 24-24v-64h64c13.3 0 24-10.7 24-24s-10.7-24-24-24h-64v-64c0-13.3-10.7-24-24-24s-24 10.7-24 24v64h-64c-13.3 0-24 10.7-24 24s10.7 24 24 24h64z"/></svg>',
    comment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4 26.5 9.6 56.2 15.1 87.8 15.1 124.7 0 208-80.5 208-160S380.7 80 256 80 48 160.5 48 240c0 32 12.4 62.8 35.7 89.2 8.6 9.7 12.8 22.5 11.8 35.5-1.4 18.1-5.7 34.7-11.3 49.4 17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9q2.7-4.05 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240 0 125.1 114.6 32 256 32s256 93.1 256 208-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9-11.9 8.7-31.3 20.6-54.3 30.6-15.1 6.6-32.3 12.6-50.1 16.1-.8.2-1.6.3-2.4.5-4.4.8-8.7 1.5-13.2 1.9-.2 0-.5.1-.7.1-5.1.5-10.2.8-15.3.8-6.5 0-12.3-3.9-14.8-9.9S0 457.4 4.5 452.8c4.1-4.2 7.8-8.7 11.3-13.5q2.55-3.45 4.8-6.9c.1-.2.2-.3.3-.5z"/></svg>',
    quote: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 254.5c-.8 13.2 9.2 24.6 22.5 25.5s24.6-9.2 25.5-22.5l.5-8c3.4-54.8 48.8-97.5 103.7-97.5H366l-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l96-96c9.4-9.4 9.4-24.6 0-33.9L345 15c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l55 55H152.3C72 104 5.6 166.4.5 246.5zm511.9 3c.8-13.2-9.2-24.6-22.5-25.5s-24.6 9.2-25.4 22.5l-.5 8c-3.4 54.8-48.9 97.5-103.8 97.5H145.9l55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L71 367c-9.4 9.4-9.4 24.6 0 33.9l96 96c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55h213.8c80.3 0 146.7-62.4 151.7-142.5z"/></svg>',
    like: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m225.8 468.2-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144 39.4-7.6 79.7 1.5 111.8 24.1 9 6.4 17.4 13.8 25 22.3 4.2-4.8 8.7-9.2 13.5-13.3 3.7-3.2 7.5-6.2 11.5-9 32.1-22.6 72.4-31.7 111.8-24.2C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9M239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-23.1-25.9-58-37.7-92-31.2-46.6 8.9-80.2 49.5-80.2 96.9v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268a102.7 102.7 0 0 0 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9-34-6.5-69 5.4-92 31.2l-.1.1-.1.1-17.8 20c-.3.4-.7.7-1 1.1-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/></svg>',
    like_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="m47.6 300.4 180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141-45.6-7.6-92 7.3-124.6 39.9l-12 12-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5"/></svg>',
    hamburger: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m0 160c0-17.7 14.3-32 32-32h384c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32m448 160c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h384c17.7 0 32 14.3 32 32"/></svg>',
    edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M395.8 39.6c9.4-9.4 24.6-9.4 33.9 0l42.6 42.6c9.4 9.4 9.4 24.6 0 33.9L417.6 171 341 94.4zM318.4 117l76.6 76.6-219 219V400c0-8.8-7.2-16-16-16h-32v-32c0-8.8-7.2-16-16-16H99.4zM66.9 379.5c1.2-4 2.7-7.9 4.7-11.5H96v32c0 8.8 7.2 16 16 16h32v24.4c-3.7 1.9-7.5 3.5-11.6 4.7l-92.8 27.3 27.3-92.8zM452.4 17c-21.9-21.9-57.3-21.9-79.2 0L60.4 329.7c-11.4 11.4-19.7 25.4-24.2 40.8L.7 491.5c-1.7 5.6-.1 11.7 4 15.8s10.2 5.7 15.8 4l121-35.6c15.4-4.5 29.4-12.9 40.8-24.2L495 138.8c21.9-21.9 21.9-57.3 0-79.2zM331.3 202.7c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0l-128 128c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0z"/></svg>',
    pin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="m134.6 51.7-10.8 140.9c-1.1 14.6-8.8 27.8-20.9 36-23.9 16.2-41.8 40.8-49.1 70.3l-1.3 5.1h279l-1.3-5.1c-7.4-29.5-25.2-54.1-49.1-70.2-12.1-8.2-19.8-21.5-20.9-36l-10.8-141c-.1-1.2-.1-2.5-.1-3.7H134.8c0 1.2 0 2.5-.2 3.7M168 352H32c-9.9 0-19.2-4.5-25.2-12.3s-8.2-17.9-5.8-27.5l6.2-25c10.3-41.3 35.4-75.7 68.7-98.3L83.1 96l3.7-48H56c-4.4 0-8.6-1.2-12.2-3.3C36.8 40.5 32 32.8 32 24 32 10.7 42.7 0 56 0h272c13.3 0 24 10.7 24 24 0 8.8-4.8 16.5-11.8 20.7-3.6 2.1-7.7 3.3-12.2 3.3h-30.8l3.7 48 7.1 92.9c33.3 22.6 58.4 57.1 68.7 98.3l6.2 25c2.4 9.6.2 19.7-5.8 27.5S361.7 352 351.9 352H216v136c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>',
    unpin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M73 39.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6-.1 34l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L449.8 416h23.9c21.2 0 38.3-17.2 38.3-38.3 0-29.2-12.5-57-28.5-79.5-13.4-18.9-30.2-35.5-47.5-48L425.8 112h-48.2l10.5 141.8 1.7 22.3 18.2 13.1c16.1 11.6 29.3 26.3 40.4 42.8 6.9 10.8 13 23.3 14.7 36.1h-61.3L254.2 220.5l8-108.4h-48.1l-4.7 63.6L72.9 39.2zM213.8 112H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H184c-5.1 0-9.9 1.6-13.8 4.4zm100.4 304-48-48h-89.3c2.5-15.3 9.9-29.5 18.8-42.1 3.9-5.4 8.2-10.7 12.8-15.7l-34-34c-6.4 6.9-12.5 14.2-18 21.9-15.9 22.5-28.5 50.3-28.5 79.5 0 21.2 17.2 38.3 38.3 38.3h147.8zM296 584c0 13.3 10.7 24 24 24s24-10.7 24-24V464h-48z"/></svg>',
    delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="m170.5 51.6-19 28.4h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6h-93.7c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6 36.7 55H424c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8v304c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128h-8c-13.3 0-24-10.7-24-24s10.7-24 24-24h69.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128v304c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V128zm80 64v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16m80 0v208c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M288 240h-96c-66.2 0-122 44.7-138.8 105.5-3.3-12.4-5.2-26.2-5.2-41.5 0-70.7 57.3-128 128-128h136c13.3 0 24-10.7 24-24V99.9L456.1 208 336 316.1V264c0-13.3-10.7-24-24-24zm0 48v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4S288 51.4 288 64v64H176C78.8 128 0 206.8 0 304c0 78 38.6 126.2 68.7 152.1 4.1 3.5 8.1 6.6 11.7 9.3 3.2 2.4 6.2 4.4 8.9 6.2 4.5 3 8.3 5.1 10.8 6.5s5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7 0-6.8-3.6-13.2-8.3-18.1l-1.4-1.4c-2.4-2.3-5.1-5.1-7.7-8.6-1.7-2.3-3.4-5-5-7.9-5.3-9.7-9.5-22.9-9.5-40.2 0-53 43-96 96-96h96z"/></svg>',
    embed: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M392.8 65.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6m64.6 136.1c-12.5 12.5-12.5 32.8 0 45.3l73.4 73.4-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0zm-274.7 0c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 320l73.3-73.4c12.5-12.5 12.5-32.8 0-45.3z"/></svg>',
    home_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40h-16c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1H392c-22.1 0-40-17.9-40-40v-88c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2h-16c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.6H32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24"/></svg>',
    home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M303.5 5.7c-9-7.6-22.1-7.6-31.1 0l-264 224c-10.1 8.6-11.3 23.7-2.8 33.8s23.7 11.3 33.8 2.8L64 245.5V432c0 44.2 35.8 80 80 80h288c44.2 0 80-35.8 80-80V245.5l24.5 20.8c10.1 8.6 25.3 7.3 33.8-2.8s7.3-25.3-2.8-33.8zM112 432V204.8L288 55.5l176 149.3V432c0 17.7-14.3 32-32 32h-48V312c0-22.1-17.9-40-40-40H232c-22.1 0-40 17.9-40 40v152h-48c-17.7 0-32-14.3-32-32m128 32V320h96v144z"/></svg>',
    notifications_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416h384c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3c-31.2-35.2-48.5-80.5-48.5-127.6V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m45.3 493.3c12-12 18.7-28.3 18.7-45.3H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7"/></svg>',
    notifications: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 0c-17.7 0-32 14.3-32 32v19.2C119 66 64 130.6 64 208v25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416h400c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6c-28.3-35.5-43.8-79.6-43.8-125V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32m0 96c61.9 0 112 50.1 112 112v25.4c0 47.9 13.9 94.6 39.7 134.6H72.3c25.8-40 39.7-86.7 39.7-134.6V208c0-61.9 50.1-112 112-112m64 352H160c0 17 6.7 33.3 18.7 45.3S207 512 224 512s33.3-6.7 45.3-18.7S288 465 288 448"/></svg>',
    messages_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l217.6 163.2c11.4 8.5 27 8.5 38.4 0l217.6-163.2c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48zM0 176v208c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V176L294.4 339.2a63.9 63.9 0 0 1-76.8 0z"/></svg>',
    messages: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 112c-8.8 0-16 7.2-16 16v22.1l172.5 141.6c20.7 17 50.4 17 71.1 0L464 150.1V128c0-8.8-7.2-16-16-16zM48 212.2V384c0 8.8 7.2 16 16 16h384c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 31.5-93.7 31.5-132 0zM0 128c0-35.3 28.7-64 64-64h384c35.3 0 64 28.7 64 64v256c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64z"/></svg>',
    user_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256m-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M304 128a80 80 0 1 0-160 0 80 80 0 1 0 160 0m-208 0a128 128 0 1 1 256 0 128 128 0 1 1-256 0M49.3 464h349.5c-8.9-63.3-63.3-112-129-112h-91.4c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3"/></svg>',
    settings_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4l-55.6 17.8c-8.8 2.8-18.6.3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4c-1.1-8.4-1.7-16.9-1.7-25.5s.6-17.1 1.7-25.4l-43.3-39.4c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0c17 0 33.6 1.7 49.8 4.8 7.9 1.5 21.8 6.1 29.4 20.1 2 3.7 3.6 7.6 4.6 11.8l9.3 38.5c1.4 5.8 11.2 11.5 16.9 9.8l38-11.2c4-1.2 8.1-1.8 12.2-1.9 16.1-.5 27 9.4 32.3 15.4 22.1 25.1 39.1 54.6 49.9 86.3 2.6 7.6 5.6 21.8-2.7 35.4-2.2 3.6-4.9 7-8 10L459 246.3c-4.2 4-4.2 15.5 0 19.5l28.7 27.3c3.1 3 5.8 6.4 8 10 8.2 13.6 5.2 27.8 2.7 35.4-10.8 31.7-27.8 61.1-49.9 86.3-5.3 6-16.3 15.9-32.3 15.4-4.1-.1-8.2-.8-12.2-1.9L366 427c-5.7-1.7-15.5 4-16.9 9.8l-9.3 38.5c-1 4.2-2.6 8.2-4.6 11.8-7.7 14-21.6 18.5-29.4 20.1-16.2 3.1-32.8 4.8-49.8 4.8s-33.6-1.7-49.8-4.8c-7.9-1.5-21.8-6.1-29.4-20.1-2-3.7-3.6-7.6-4.6-11.8l-9.3-38.5c-1.4-5.8-11.2-11.5-16.9-9.8l-38 11.2c-4 1.2-8.1 1.8-12.2 1.9-16.1.5-27-9.4-32.3-15.4-22-25.1-39.1-54.6-49.9-86.3-2.6-7.6-5.6-21.8 2.7-35.4 2.2-3.6 4.9-7 8-10L53 265.7c4.2-4 4.2-15.5 0-19.5l-28.8-27.3c-3.1-3-5.8-6.4-8-10-8.2-13.6-5.2-27.8-2.6-35.3 10.8-31.7 27.8-61.1 49.9-86.3 5.3-6 16.3-15.9 32.3-15.4 4.1.1 8.2.8 12.2 1.9L146 85c5.7 1.7 15.5-4 16.9-9.8l9.3-38.5c1-4.2 2.6-8.2 4.6-11.8 7.7-14 21.6-18.5 29.4-20.1C222.4 1.7 239 0 256 0m-37.9 51.4-8.5 35.1c-7.8 32.3-45.3 53.9-77.2 44.6l-34.5-10.2c-16.5 19.3-29.5 41.7-38 65.7l26.2 24.9c24 22.8 24 66.2 0 89l-26.2 24.9c8.5 24 21.5 46.4 38 65.7l34.6-10.2c31.8-9.4 69.4 12.3 77.2 44.6l8.5 35.1c24.6 4.5 51.3 4.5 75.9 0l8.5-35.1c7.8-32.3 45.3-53.9 77.2-44.6l34.6 10.2c16.5-19.3 29.5-41.7 38-65.7l-26.2-24.9c-24-22.8-24-66.2 0-89l26.2-24.9c-8.5-24-21.5-46.4-38-65.7l-34.6 10.2c-31.8 9.4-69.4-12.3-77.2-44.6l-8.5-35.1c-24.6-4.5-51.3-4.5-75.9 0zM208 256a48 48 0 1 0 96 0 48 48 0 1 0-96 0m48 96a96 96 0 1 1 0-192 96 96 0 1 1 0 192"/></svg>',
    folreq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M224 48a80 80 0 1 1 0 160 80 80 0 1 1 0-160m0 208a128 128 0 1 0 0-256 128 128 0 1 0 0 256m-45.7 96h91.4c65.7 0 120.1 48.7 129 112H49.3c8.9-63.3 63.3-112 129-112m0-48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3zm325.7 8c0 13.3 10.7 24 24 24s24-10.7 24-24v-64h64c13.3 0 24-10.7 24-24s-10.7-24-24-24h-64v-64c0-13.3-10.7-24-24-24s-24 10.7-24 24v64h-64c-13.3 0-24 10.7-24 24s10.7 24 24 24h64z"/></svg>',
    folreq_active: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M96 128a128 128 0 1 1 256 0 128 128 0 1 1-256 0M0 482.3C0 383.8 79.8 304 178.3 304h91.4c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3M504 312v-64h-64c-13.3 0-24-10.7-24-24s10.7-24 24-24h64v-64c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24h-64v64c0 13.3-10.7 24-24 24s-24-10.7-24-24"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="currentColor" d="M480 272c0 45.9-14.9 88.3-40 122.7l126.6 126.7c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L394.7 440c-34.4 25.1-76.8 40-122.7 40-114.9 0-208-93.1-208-208S157.1 64 272 64s208 93.1 208 208M272 416c79.5 0 144-64.5 144-144s-64.5-144-144-144-144 64.5-144 144 64.5 144 144 144"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512m-24-168v-64h-64c-13.3 0-24-10.7-24-24s10.7-24 24-24h64v-64c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24h-64v64c0 13.3-10.7 24-24 24s-24-10.7-24-24"/></svg>'
};
let snippetVariables = {
    site_name: pageTitle,
    home_page: loggedIn ? "home" : "index",
    username: loggedIn ? username : "",
    selected_if_default_private: defaultPostPrivate ? "selected" : "",
    checked_if_default_private: defaultPostPrivate ? "checked" : ""
};
let snippetProcessing = {
    input_enter: p_inputEnter,
    password_toggle: p_passwordToggle,
    timeline_switch: p_tlSwitch,
    timeline_more: p_tlMore,
    login: p_login,
    signup: p_signup,
    logout: p_logout,
    home: p_home,
    user: p_user,
    post: p_post,
    post_page: p_postPage,
    notifications: p_notifications,
    hashtag: p_hashtag,
    follow_requests: p_folreq,
    admin: p_admin,
    search: p_search,
    message_list: p_messageList,
    message: p_message,
    settings_index: p_settingsIndex,
    settings_profile: p_settingsProfile,
    settings_cosmetic: p_settingsCosmetic,
    settings_account: p_settingsAccount,
    settings_keybinds: p_settingsKeybinds
};
let snippets = {};
function getSnippet(snippet, extraVariables) {
    let s = snippets[snippet];
    let content = s.content;
    for (const i of Object.keys(icons)) {
        content = content.replaceAll(`@{icon_${i}}`, icons[i]);
    }
    for (const i of content.matchAll(/@\{lang.((?:[a-z_0-9]+.)*[a-z_0-9]+)\}/ig)) {
        content = content.replace(i[0], langFromRaw(i[1]));
    }
    for (const i of s.variables) {
        let replacementValue = "";
        let replacementCount = 0;
        if (typeof i === "string") {
            if (i in snippetVariables) {
                replacementValue = snippetVariables[i];
            }
            else {
                console.log(`Unknown snippet variable "${i}"`);
            }
        }
        else {
            replacementCount = i[1];
            if (i[0] in snippetVariables) {
                replacementValue = i[0];
            }
            else {
                console.log(`Unknown snippet variable "${i}"`);
            }
        }
        if (replacementCount) {
            for (let _ = 0; _ < replacementCount; _++) {
                content = content.replace(`@{${typeof i === "string" ? i : i[0]}}`, replacementValue);
            }
        }
        else {
            content = content.replaceAll(`@{${typeof i === "string" ? i : i[0]}}`, replacementValue);
        }
    }
    if (extraVariables) {
        for (const i of Object.keys(extraVariables)) {
            if (typeof extraVariables[i] === "string") {
                content = content.replaceAll(`@{${i}}`, extraVariables[i]);
            }
            else {
                for (let _ = 0; _ < extraVariables[i][1]; _++) {
                    content = content.replace(`@{${i}}`, extraVariables[i][0]);
                }
            }
        }
    }
    let element = document.createElement("div");
    element.innerHTML = content.replaceAll(" =\"\"", "");
    for (const i of s.processing) {
        if (i in snippetProcessing) {
            snippetProcessing[i](element);
        }
        else {
            console.log(`Unknown snippet process "${i}"`);
        }
    }
    generateInternalLinks(element);
    return element;
}
function p_inputEnter(element) {
    for (const el of element.querySelectorAll("[data-enter-submit]")) {
        el.onkeydown = inputEnterEvent;
    }
}
function p_passwordToggle(element) {
    for (const el of element.querySelectorAll("[data-password-toggle]")) {
        el.onclick = togglePasswords;
    }
}
for (const snippet of document.querySelectorAll("[data-snippet]")) {
    snippets[snippet.dataset.snippet] = {
        variables: ((_a = snippet.dataset.snippetVariables) === null || _a === void 0 ? void 0 : _a.split(",").filter((a) => a).map((a) => {
            if (a.includes(":")) {
                return [a.split(":")[0], +a.split(":")[1]];
            }
            return a;
        })) || [],
        processing: ((_b = snippet.dataset.snippetProcessing) === null || _b === void 0 ? void 0 : _b.split(",").filter((a) => a)) || [],
        content: snippet.innerHTML
    };
    snippet.remove();
}
(_c = document.getElementById("snippets")) === null || _c === void 0 ? void 0 : _c.remove();
let themeMedia = matchMedia("(prefers-color-scheme: light)");
let _themeLs = localStorage.getItem("smiggins-theme");
let theme = _themeLs === "light" || _themeLs === "dark" || _themeLs === "warm" || _themeLs === "gray" || _themeLs === "darker" || _themeLs === "oled" ? _themeLs : "system";
function setTheme(th) {
    if (th === "system") {
        localStorage.removeItem("smiggins-theme");
        theme = "system";
        updateTheme(themeMedia.matches ? "light" : "dark");
        return;
    }
    localStorage.setItem("smiggins-theme", th);
    updateTheme(th);
}
function updateTheme(theme) {
    document.documentElement.dataset.theme = theme;
}
function updateAutoTheme() {
    if (theme !== "system") {
        return;
    }
    updateTheme(themeMedia.matches ? "light" : "dark");
}
themeMedia.addEventListener("change", updateAutoTheme);
updateTheme((theme === "system" && (themeMedia.matches ? "light" : "dark")) || theme);
let currentTl;
let currentTlID;
let tlElement;
let timelines = {};
let tlPollingIntervalID = null;
let tlPollingPendingResponse = false;
let prependedPosts = 0;
let timelineToggles = [];
let tlCache = {};
let postCache = {};
let userCache = {};
let offset = {
    upper: null,
    lower: null
};
function hookTimeline(element, carousel, tls, activeTimeline, fakeBodyElement) {
    timelineToggles = [];
    if (carousel) {
        for (const el of carousel.querySelectorAll("[data-timeline-toggle][data-timeline-toggle-store]")) {
            if (el.dataset.timelineToggle
                && el.dataset.timelineToggleStore
                && localStorage.getItem("smiggins-" + el.dataset.timelineToggleStore)) {
                timelineToggles.push(el.dataset.timelineToggle);
                el.dataset.timelineActive = "";
            }
        }
        if (carousel.dataset.timelineStore) {
            let id = localStorage.getItem("smiggins-" + carousel.dataset.timelineStore) || "";
            let el = carousel.querySelector(`[data-timeline-id="${id}"]`);
            if (el) {
                for (const el of carousel.querySelectorAll(`[data-timeline-active][data-timeline-id]`)) {
                    delete el.dataset.timelineActive;
                }
                el.dataset.timelineActive = "";
                activeTimeline = id;
            }
        }
    }
    timelines = tls;
    tlElement = element;
    _setTimeline(activeTimeline, fakeBodyElement);
}
function reloadTimeline(ignoreCache = false, element) {
    var _a;
    tlElement.innerHTML = `<i class="timeline-status">${L.generic.loading}</i>`;
    prependedPosts = 0;
    let cache = tlCache[currentTlID];
    if (!currentTl.disableCaching && !ignoreCache && cache && cache.pendingForward !== false) {
        offset = {
            upper: cache.upperBound,
            lower: cache.lowerBound
        };
        cache.posts = cache.pendingForward.reverse().concat(cache.posts);
        let posts = [];
        for (const post of cache.posts) {
            let p = postCache[post];
            let u = p && userCache[p.user.username];
            if (currentTl.api === api_TimelineUser || !u || !u.blocking) {
                posts.push(post);
            }
        }
        (currentTl.customRender || renderTimeline)(posts, cache.end, false, element === null || element === void 0 ? void 0 : element.querySelector("#timeline-more"));
        timelinePolling(true);
        return;
    }
    (_a = document.getElementById("timeline-more")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "");
    delete tlCache[currentTlID];
    offset.upper = null;
    offset.lower = null;
    new currentTl.api(null, false, ...(currentTl.args || [])).fetch();
}
function insertIntoPostCache(posts) {
    let postIds = [];
    for (const post of posts) {
        postCache[post.id] = post;
        postIds.push(post.id);
    }
    return postIds;
}
function loadMorePosts() {
    let more = document.getElementById("timeline-more");
    if (more) {
        more.hidden = true;
    }
    tlElement.insertAdjacentHTML("beforeend", `<i class="timeline-status">${L.generic.loading}</i>`);
    new currentTl.api(currentTl.invertOffset ? offset.upper : offset.lower, false, ...(currentTl.args || []))
        .fetch()
        .then((success) => {
        if (typeof success !== "boolean") {
            if (more) {
                more.hidden = false;
            }
            clearTimelineStatuses();
        }
    });
}
function clearTimelineStatuses(el) {
    let statuses = (el || tlElement).querySelectorAll(".timeline-status");
    for (const el of statuses) {
        el.remove();
    }
}
function renderTimeline(posts, end, updateCache = true, moreElementOverride) {
    clearTimelineStatuses();
    if (offset.lower === null && posts.length === 0) {
        let none = document.createElement("i");
        none.classList.add("timeline-status");
        none.innerText = L.generic.none;
        tlElement.append(none);
        return;
    }
    let frag = document.createDocumentFragment();
    let more = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
        if (end) {
            more.hidden = true;
        }
        else {
            more.hidden = false;
        }
    }
    for (const post of posts) {
        frag.append(getPost(post));
    }
    if (!loggedIn) {
        let logInReminder = document.createElement("div");
        logInReminder.innerHTML = `<a class="timeline-status" href="/signup/" data-internal-link=\"signup\">${L.generic.sign_up_for_more}</a>`;
        generateInternalLinks(logInReminder);
        frag.append(logInReminder);
    }
    tlElement.append(frag);
    if (updateCache && !currentTl.disableCaching) {
        let c = tlCache[currentTlID];
        if (!c) {
            c = {
                upperBound: null,
                lowerBound: null,
                posts: [],
                pendingForward: [],
                end: false
            };
            tlCache[currentTlID] = c;
        }
        c.posts.push(...posts);
        c.lowerBound = offset.lower;
        c.upperBound = offset.upper;
        c.end = end;
    }
}
function _setTimeline(timelineId, element) {
    let c = tlCache[currentTlID];
    if (c) {
        c.upperBound = offset.upper;
        c.lowerBound = offset.lower;
    }
    currentTlID = timelineId.split("__")[0] + timelineToggles.map((a) => ("__" + a)).join("");
    currentTl = timelines[currentTlID];
    if (!loggedIn) {
        currentTl.disablePolling = true;
    }
    if (tlPollingIntervalID) {
        clearInterval(tlPollingIntervalID);
        tlPollingIntervalID = null;
    }
    if (!currentTl.disablePolling) {
        tlPollingIntervalID = setInterval(timelinePolling, TL_POLLING_INTERVAL);
    }
    reloadTimeline(false, element);
}
function switchTimeline(e) {
    let el = e.target;
    if (!el) {
        return;
    }
    if (el.dataset.timelineId
        && el.dataset.timelineId in timelines) {
        let newTl = timelines[el.dataset.timelineId.split("__")[0] + timelineToggles.map((a) => ("__" + a)).join("")];
        if (newTl.api !== currentTl.api
            || typeof newTl.args !== typeof currentTl.args
            || (newTl.args && currentTl.args && (newTl.args.length !== currentTl.args.length || newTl.args.map((a, i) => (a === currentTl.args[i])).filter(Boolean).length !== newTl.args.length))) {
            _setTimeline(el.dataset.timelineId);
            let carousel = document.querySelector("[data-timeline-store]");
            if (carousel && carousel.dataset.timelineStore) {
                localStorage.setItem("smiggins-" + carousel.dataset.timelineStore, el.dataset.timelineId);
            }
        }
    }
    for (const el of document.querySelectorAll("[data-timeline-active]:not([data-timeline-toggle])")) {
        delete el.dataset.timelineActive;
    }
    e.target.dataset.timelineActive = "";
}
function toggleTimeline(e) {
    let el = e.target;
    if (!el) {
        return;
    }
    let t = el.dataset.timelineToggle;
    if (!t) {
        return;
    }
    if (typeof el.dataset.timelineActive === "string") {
        delete el.dataset.timelineActive;
        if (el.dataset.timelineToggleStore) {
            localStorage.removeItem("smiggins-" + el.dataset.timelineToggleStore);
        }
        if (timelineToggles.includes(t)) {
            timelineToggles.splice(timelineToggles.indexOf(t), 1);
        }
    }
    else {
        el.dataset.timelineActive = "";
        timelineToggles.push(t);
        if (el.dataset.timelineToggleStore) {
            localStorage.setItem("smiggins-" + el.dataset.timelineToggleStore, "1");
        }
    }
    _setTimeline(currentTlID);
}
function pollVote(pid, option) {
    new api_PollVote(pid, option).fetch();
}
function refreshPollData(pid) {
    new api_PollRefresh(pid).fetch();
}
function refreshPollDisplay(pid, forceVotedView = false) {
    let c = postCache[pid];
    if (!c) {
        return;
    }
    for (const el of document.querySelectorAll(`[data-post-id="${pid}"] .poll-container`)) {
        el.innerHTML = getPollHTML(c.poll, pid, forceVotedView);
    }
}
function getPollHTML(poll, pid, forceVotedView = false) {
    if (!poll) {
        return "";
    }
    let output = "";
    let pollButtons = "";
    let voted = poll.has_voted || forceVotedView || !loggedIn;
    let votedClass = voted ? "poll-voted" : "";
    let c = 0;
    for (const item of poll.items) {
        output += `<div ${voted ? "" : `onclick="pollVote(${pid}, ${c})"`} class="poll-bar ${votedClass}" style="--poll-width: ${item.percentage}%;" ${item.voted || !loggedIn ? "data-vote" : ""}><div class="poll-bar-text">${voted ? `${item.percentage}% - ` : ""}${escapeHTML(item.content)}</div></div>`;
        c++;
    }
    if (voted) {
        pollButtons = `<a onclick="refreshPollData(${pid})">${L.post.poll.refresh}</a>`;
        if (!poll.has_voted && forceVotedView && loggedIn) {
            pollButtons += ` - <a onclick="refreshPollDisplay(${pid})">${L.post.poll.return_to_voting}</a>`;
        }
    }
    else {
        pollButtons = `<a onclick="refreshPollDisplay(${pid}, true)">${L.post.poll.view_results}</a>`;
    }
    return output + `<small><div>${lr(n(L.post.poll.vote_count, floatintToNum(poll.votes)), { n: floatintToStr(poll.votes) })} - ${pollButtons}</div></small>`;
}
function getPost(post, updateOffset = true, forceCwState = null) {
    let p = postCache[post];
    if (!p) {
        let el = document.createElement("div");
        el.innerText = "Post couldn't be loaded.";
        return el;
    }
    let postContent = linkify(escapeHTML(p.content), post);
    if (updateOffset && (!offset.lower || p.timestamp < offset.lower)) {
        offset.lower = p.timestamp;
    }
    if (updateOffset && (!offset.upper || p.timestamp > offset.upper)) {
        offset.upper = p.timestamp;
    }
    let contentWarningStart = "";
    let contentWarningEnd = "";
    if (p.content_warning) {
        contentWarningStart = `<details class="content-warning"${forceCwState !== false && (forceCwState === true || localStorage.getItem("smiggins-expand-cws")) ? " open" : ""}><summary><div>${escapeHTML(p.content_warning)} <div class="content-warning-stats">(${lr(n(L.post.cw.length, p.content.length), { n: String(p.content.length) })}${p.quote ? L.post.cw.has_quote : ""}${p.poll ? L.post.cw.has_poll : ""})</div></div></summary>`;
        contentWarningEnd = "</details>";
    }
    let pollContent = getPollHTML(p.poll, p.id);
    let quoteData = { hidden_if_no_quote: "hidden" };
    let quoteUnsafeData = {};
    if (p.quote) {
        let quoteContent = linkify(escapeHTML(p.quote.content), p.quote.id);
        let quoteCwStart = "";
        let quoteCwEnd = "";
        if (p.quote.content_warning) {
            quoteCwStart = `<details class="content-warning"${forceCwState !== false && (forceCwState === true || localStorage.getItem("smiggins-expand-cws")) ? " open" : ""}><summary><div>${escapeHTML(p.quote.content_warning)} <div class="content-warning-stats">(${lr(n(L.post.cw.length, p.quote.content.length), { n: String(p.quote.content.length) })}${p.quote.has_quote ? L.post.cw.has_quote : ""}${p.quote.has_poll ? L.post.cw.has_poll : ""})</div></div></summary>`;
            quoteCwEnd = "</details>";
        }
        quoteData = {
            hidden_if_no_quote: "",
            quote_timestamp: getTimestamp(p.quote.timestamp),
            quote_username: p.quote.user.username,
            quote_private_post: p.quote.private ? "data-private-post" : "",
            quote_cw_end: quoteCwEnd,
            quote_banner_one: p.quote.user.banner[0],
            quote_banner_two: p.quote.user.banner[1],
            quote_pid: String(p.quote.id),
            quote_comment_id: String(p.quote.comment),
            hidden_if_no_quote_pronouns: p.quote.user.pronouns ? "" : "hidden",
            hidden_if_no_quote_comment: p.quote.comment ? "" : "hidden",
            hidden_if_no_quote_edit: p.quote.edited ? "" : "hidden"
        };
        quoteUnsafeData = {
            quote_content: [quoteContent + (p.quote.has_poll ? (p.quote.content ? "\n" : "") + `<a data-internal-link="post" href="/p/${p.quote.id}/" class="plain-link"><i>${L.post.quote.has_poll}</i></a>` : "") + (p.quote.has_quote ? (p.quote.content || p.quote.has_poll ? "\n" : "") + `<a data-internal-link="post" href="/p/${p.quote.id}/" class="plain-link"><i>${L.post.quote.has_quote}</i></a>` : ""), 1],
            quote_cw_start: [quoteCwStart, 1],
            quote_pronouns: [p.quote.user.pronouns || "", 1],
            quote_display_name: [escapeHTML(p.quote.user.display_name), 1]
        };
    }
    let el = getSnippet("post", Object.assign(Object.assign(Object.assign({ timestamp: getTimestamp(p.timestamp), username: p.user.username, post_interactions_hidden: localStorage.getItem("smiggins-hide-interactions") && "hidden" || "", edit_hidden: username === p.user.username ? "" : "hidden", delete_hidden: isAdmin || username === p.user.username ? "" : "hidden", pid: String(post), comment_id: String(p.comment), comments: floatintToStr(p.interactions.comments), quotes: floatintToStr(p.interactions.quotes), likes: floatintToStr(p.interactions.likes), liked: String(p.interactions.liked), banner_one: p.user.banner[0], banner_two: p.user.banner[1], private_post: p.private ? "data-private-post" : "", cw_end: contentWarningEnd, hidden_if_no_pronouns: p.user.pronouns ? "" : "hidden", hidden_if_no_comment: p.comment ? "" : "hidden", hidden_if_no_poll: p.poll ? "" : "hidden", hidden_if_no_edit: p.edited ? "" : "hidden" }, quoteData), quoteUnsafeData), { poll: [pollContent, 1], content: [postContent, 1], pronouns: [p.user.pronouns || "", 1], display_name: [escapeHTML(p.user.display_name), 1], cw_start: [contentWarningStart, 1] }));
    el.dataset.editReplace = String(post);
    if (p.quote === false) {
        let quoteElement = el.querySelector(".post-quote");
        if (quoteElement) {
            quoteElement.removeAttribute("hidden");
            quoteElement.innerHTML = `<i>${L.post.quote.cant_view}</i>`;
        }
    }
    return el;
}
function timelineShowNew() {
    var _a;
    let c = tlCache[currentTlID];
    if (!c) {
        return;
    }
    let posts = c.pendingForward;
    c.pendingForward = [];
    (_a = document.getElementById("timeline-show-new")) === null || _a === void 0 ? void 0 : _a.remove();
    if (posts === false) {
        reloadTimeline(true);
        return;
    }
    c.posts = posts.reverse().concat(c.posts);
    let frag = document.createDocumentFragment();
    for (const post of posts) {
        frag.append(getPost(post));
    }
    prependedPosts = 0;
    for (const el of document.querySelectorAll("[data-prepended]")) {
        el.remove();
    }
    tlElement.prepend(frag);
}
function handleForward(posts, end, expectedTlID, forceEvent = false) {
    tlPollingPendingResponse = false;
    let c = tlCache[expectedTlID];
    if (!c) {
        return;
    }
    if (expectedTlID !== currentTlID) {
        console.log("timeline switched, discarding request");
        if (end) {
            c.pendingForward = false;
        }
        else if (c.pendingForward !== false) {
            c.pendingForward.push(...insertIntoPostCache(posts).reverse());
        }
        return;
    }
    if (posts.length === 0 || c.pendingForward === false) {
        return;
    }
    let showNewElement = document.getElementById("timeline-show-new");
    if (!forceEvent && !showNewElement && (!end || (c.pendingForward.length + posts.length - prependedPosts) > 0)) {
        showNewElement = document.createElement("button");
        showNewElement.id = "timeline-show-new";
        showNewElement.addEventListener("click", timelineShowNew);
        tlElement.prepend(showNewElement);
    }
    if (end) {
        offset.upper = posts[0].timestamp;
        c.pendingForward.push(...insertIntoPostCache(posts).reverse());
        if (showNewElement) {
            showNewElement.innerText = lr(n(L.post.show_new, c.pendingForward.length), { n: String(c.pendingForward.length) });
        }
    }
    else {
        c.pendingForward = false;
        if (showNewElement) {
            showNewElement.innerText = L.post.tl_refresh;
        }
    }
    if (forceEvent) {
        timelineShowNew();
    }
}
function timelinePolling(forceEvent = false) {
    if (currentTl.disablePolling || !offset.upper || (tlPollingPendingResponse && !forceEvent)) {
        return;
    }
    let c = tlCache[currentTlID];
    tlPollingPendingResponse = true;
    if (c && c.pendingForward === false) {
        return;
    }
    if (localStorage.getItem("smiggins-auto-show-posts")) {
        forceEvent = true;
    }
    new currentTl.api(currentTl.invertOffset ? offset.lower : offset.upper, forceEvent ? "force" : true, ...(currentTl.args || []))
        .fetch()
        .then((success) => {
        tlPollingPendingResponse = false;
    });
}
function prependPostToTimeline(post) {
    if (currentTl.prependPosts) {
        if (typeof currentTl.prependPosts === "number" &&
            post.comment !== currentTl.prependPosts) {
            return;
        }
        if (!tlElement.querySelector(".post")) {
            clearTimelineStatuses();
        }
        let newButton = document.getElementById("timeline-show-new");
        let prependedPost = getPost(insertIntoPostCache([post])[0], false);
        prependedPost.dataset.prepended = "";
        prependedPosts++;
        if (newButton) {
            tlElement.prepend(newButton, prependedPost);
        }
        else {
            tlElement.prepend(prependedPost);
        }
    }
}
function postButtonClick(e) {
    let el = e.currentTarget;
    if (!el || !loggedIn) {
        return;
    }
    if (el.dataset.interactionQuote) {
        createPostModal("quote", +el.dataset.interactionQuote);
    }
    else if (el.dataset.interactionLike) {
        let postId = +el.dataset.interactionLike;
        let liked = el.dataset.liked === "true";
        let c = postCache[postId];
        if (c) {
            c.interactions.liked = !liked;
            c.interactions.likes += (-liked + 0.5) * 2 * (1 << 3);
        }
        for (const element of document.querySelectorAll(`[data-interaction-like="${postId}"]`)) {
            element.dataset.liked = String(!liked);
            let number = element.querySelector("[data-number]");
            if (number && !isNaN(+number.innerText)) {
                number.innerText = String(+number.innerText + (-liked + 0.5) * 2);
            }
        }
        new (liked ? api_Unlike : api_Like)(postId).fetch();
    }
    else if (el.dataset.interactionEdit) {
        createPostModal("edit", +el.dataset.interactionEdit);
    }
    else if (el.dataset.interactionPin) {
        let postId = +el.dataset.interactionPin;
        new api_Pin(postId).fetch();
    }
    else if (el.dataset.interactionUnpin) {
        new api_Unpin().fetch();
    }
    else if (el.dataset.interactionDelete) {
        let postId = +el.dataset.interactionDelete;
        new api_DeletePost(postId).fetch();
    }
    else if (el.dataset.interactionShare) {
        let postId = +el.dataset.interactionShare;
        if (!navigator.clipboard) {
            createToast(L.errors.cant_copy, L.errors.cant_copy_more);
            return;
        }
        navigator.clipboard.writeText(`Check out this post on ${pageTitle}! ${location.origin}/p/${postId}/`);
        createToast(L.generic.copied, L.post.copied);
    }
    else if (el.dataset.interactionEmbed) {
        let postId = +el.dataset.interactionEmbed;
        if (!navigator.clipboard) {
            createToast(L.errors.cant_copy, L.errors.cant_copy_more);
            return;
        }
        navigator.clipboard.writeText(`<iframe src="${location.origin}/p/${postId}/?iframe=" width="600" height="400"></iframe>`);
        createToast(L.generic.copied, L.post.embedded);
    }
    else {
        console.log("Unknown interaction type for post button", e);
    }
    e.preventDefault();
}
function createPost(content, cw, followersOnly, callback, extra) {
    new api_CreatePost(content, cw, followersOnly, extra)
        .fetch()
        .then((success) => {
        if (callback) {
            callback(Boolean(success));
        }
    });
}
function handlePostDelete(pid) {
    for (const tlData of Object.values(tlCache)) {
        while (tlData === null || tlData === void 0 ? void 0 : tlData.posts.includes(pid)) {
            tlData.posts.splice(tlData.posts.indexOf(pid), 1);
        }
    }
    for (const el of document.querySelectorAll(`[data-post-id="${pid}"]`)) {
        el.innerHTML = `<i>${L.post.deleted}</i>`;
    }
    delete tlCache[`post_${pid}_recent`];
    delete tlCache[`post_${pid}_oldest`];
    if (getPostIDFromPath() === pid) {
        currentPage = "home";
        history.pushState("home", "", "/");
        renderPage("home");
    }
    for (const [newPid, data] of Object.entries(postCache)) {
        if ((data === null || data === void 0 ? void 0 : data.comment) === pid) {
            delete postCache[+newPid];
            handlePostDelete(+newPid);
        }
    }
}
function simplePostContent(post) {
    return escapeHTML(post.content_warning ? lr(L.post.cw_short, { c: post.content_warning }) : post.content) || (post.poll ? L.post.poll_short : "");
}
function p_tlMore(element) {
    let el = element.querySelector("[id=\"timeline-more\"]");
    if (el) {
        el.addEventListener("click", () => {
            el.setAttribute("hidden", "");
            loadMorePosts();
        });
    }
}
function p_tlSwitch(element) {
    let carouselItems = element.querySelectorAll("[data-timeline-id]");
    let carouselToggles = element.querySelectorAll("[data-timeline-toggle]");
    for (const i of carouselItems) {
        i.addEventListener("click", switchTimeline);
    }
    for (const i of carouselToggles) {
        i.addEventListener("click", toggleTimeline);
    }
}
function p_post(element) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    (_a = element.querySelector("[data-interaction-comment]")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", postButtonClick);
    (_b = element.querySelector("[data-interaction-quote]")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", postButtonClick);
    (_c = element.querySelector("[data-interaction-like]")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", postButtonClick);
    (_d = element.querySelector("[data-interaction-edit]")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", postButtonClick);
    (_e = element.querySelector("[data-interaction-pin]")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", postButtonClick);
    (_f = element.querySelector("[data-interaction-delete]")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", postButtonClick);
    (_g = element.querySelector("[data-interaction-share]")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", postButtonClick);
    (_h = element.querySelector("[data-interaction-embed]")) === null || _h === void 0 ? void 0 : _h.addEventListener("click", postButtonClick);
}
setInterval(updateTimestamps, 1000);
function createToast(title, content, timeout) {
    var _a;
    if (!title) {
        return;
    }
    let toast = getSnippet("toast", {
        title: title,
        content: content || ""
    });
    (_a = document.getElementById("toasts")) === null || _a === void 0 ? void 0 : _a.append(toast);
    toast.addEventListener("click", () => (toast.remove()));
    setTimeout(() => (toast.remove()), timeout || 3000);
}
function inputEnterEvent(e) {
    if (e.key !== "Enter") {
        return;
    }
    let el = e.currentTarget;
    let eventQuery = (e.ctrlKey && el.dataset.enterSubmit) || el.dataset.enterNext || el.dataset.enterSubmit;
    if (!eventQuery || eventQuery === "!avoid") {
        return;
    }
    let newElement = document.querySelector(eventQuery);
    if (!newElement) {
        return;
    }
    newElement.focus();
    if (newElement.nodeName === "BUTTON") {
        newElement.click();
    }
    e.preventDefault();
}
function togglePasswords(e) {
    let toText;
    let toPassword;
    let queries = "";
    let baseElement = e.target;
    if (baseElement) {
        queries = baseElement.dataset.passwordToggle || "";
    }
    if (queries) {
        toText = [];
        toPassword = [];
        for (const q of queries.split(",")) {
            let el = document.querySelector(q.trim());
            if (el) {
                if (el.type === "password") {
                    toText.push(el);
                }
                else {
                    toPassword.push(el);
                }
            }
        }
    }
    else {
        toText = [...document.querySelectorAll("input[type=\"password\"]")];
        toPassword = [...document.querySelectorAll("input[data-toggle-password]")];
    }
    for (const el of toText) {
        el.type = "text";
        el.dataset.togglePassword = "";
    }
    for (const el of toPassword) {
        el.type = "password";
        delete el.dataset.togglePassword;
    }
}
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    ;
    let maxWord = Math.pow(2, 32);
    let result = '';
    let words = [];
    let asciiBitLength = ascii["length"] * 8;
    let hash = [];
    let k = [];
    let primeCounter = k["length"];
    let isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (Math.pow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (Math.pow(candidate, (1 / 3)) * maxWord) | 0;
        }
    }
    ascii += '\x80';
    while (ascii["length"] % 64 - 56)
        ascii += '\x00';
    for (let i = 0; i < ascii["length"]; i++) {
        let j = ascii.charCodeAt(i);
        if (j >> 8)
            return "";
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = (asciiBitLength);
    for (let j = 0; j < words.length;) {
        let w = words.slice(j, j += 16);
        let oldHash = hash;
        hash = hash.slice(0, 8);
        for (let i = 0; i < 64; i++) {
            let w15 = w[i - 15];
            let w2 = w[i - 2];
            let a = hash[0];
            let e = hash[4];
            let temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        for (let i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j + 1; j--) {
            let b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}
function escapeHTML(str) {
    if (str === undefined) {
        return "⚠️";
    }
    return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("`", "&#96;");
}
function unescapeHTML(str) {
    if (str === undefined) {
        return "⚠️";
    }
    return str.replaceAll("&#96;", "`").replaceAll("&quot;", "\"").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
}
function getTimestamp(timestamp, raw = false) {
    let difference = Math.round(Date.now() / 1000 - timestamp);
    let future = difference < 0;
    let complexTimestamps = !!localStorage.getItem("smiggins-complex-timestamps");
    if (future) {
        difference = -difference;
    }
    let output = "?";
    if (difference < 60) {
        output = lr(L.numbers.second, {
            x: String(difference)
        });
    }
    else if (difference < 60 * 60) {
        output = lr(L.numbers[complexTimestamps ? "minute_second" : "minute"], {
            x: String(Math.floor(difference / 60)),
            y: String(difference % 60)
        });
    }
    else if (difference < 60 * 60 * 24) {
        output = lr(L.numbers[complexTimestamps ? "hour_minute" : "hour"], {
            x: String(Math.floor(difference / 60 / 60)),
            y: String(Math.floor(difference / 60) % 60)
        });
    }
    else if (difference < 60 * 60 * 24 * 365) {
        output = lr(L.numbers[complexTimestamps ? "day_hour" : "day"], {
            x: String(Math.floor(difference / 60 / 60 / 24)),
            y: String(Math.floor(difference / 60 / 60) % 24)
        });
    }
    else if (!isNaN(timestamp)) {
        output = lr(L.numbers[complexTimestamps ? "day_hour" : "day"], {
            x: String(Math.floor(difference / 60 / 60 / 24 / 365)),
            y: String(Math.floor(difference / 60 / 60 / 24) % 365)
        });
    }
    if (future) {
        output = lr(L.numbers.future, { t: output });
    }
    if (raw) {
        return output;
    }
    return `<span data-timestamp="${timestamp}">${output}</span>`;
}
function updateTimestamps() {
    let timestamps = document.querySelectorAll("[data-timestamp]");
    for (const i of timestamps) {
        let newTime = getTimestamp(+(i.dataset.timestamp || NaN), true);
        if (newTime !== i.innerText) {
            i.innerText = newTime;
        }
    }
}
function setTokenCookie(token) {
    document.cookie = `token=${token};Path=/;SameSite=Lax;Expires=${new Date(Date.now() + (356 * 24 * 60 * 60 * 1000)).toUTCString()}`;
}
function genericCheckbox(storageId) {
    return function (e) {
        let el = e.target;
        if (el) {
            if (el.checked) {
                localStorage.setItem(storageId, "1");
            }
            else {
                localStorage.removeItem(storageId);
            }
        }
    };
}
function getMentionsFromPost(p) {
    let mentions = [...new Set([[null, p.user.username], ...p.content.matchAll(mentionRegex)].map((a) => (a[1].toLowerCase())))].sort((a, b) => (a < b ? -1 : 1));
    if (mentions.includes(username)) {
        mentions.splice(mentions.indexOf(username), 1);
    }
    return mentions;
}
function adminDeletePost() {
    let pidElement = document.getElementById("delete-post-id");
    if (!pidElement) {
        return;
    }
    if (!pidElement.value) {
        pidElement.focus();
        return;
    }
    new api_DeletePost(+pidElement.value).fetch();
}
function adminDeleteUser() {
    let usernameElement = document.getElementById("delete-user-username");
    let confElement = document.getElementById("delete-user-confirm");
    if (!usernameElement || !confElement) {
        return;
    }
    if (!usernameElement.value) {
        usernameElement.focus();
        return;
    }
    if (!confElement.checked) {
        confElement.focus();
        return;
    }
    new api_AdminDeleteUser(usernameElement.value).fetch();
}
function adminCreateOTP() {
    new api_GenerateOTP().fetch();
}
function adminDeleteOTP(e) {
    let el = e.target;
    if (!el) {
        return;
    }
    let otp = el.dataset.otp || "";
    for (const item of document.querySelectorAll(`[data-otp-container="${otp}"]`)) {
        item.remove();
    }
    new api_DeleteOTP(otp).fetch();
}
function adminListOTPs() {
    let el = document.getElementById("otp-list");
    if (el) {
        el.removeAttribute("hidden");
        el.innerHTML = `<i>${L.generic.loading}</i>`;
    }
    new api_ListOTP().fetch();
}
function adminLoadPermissions() {
    let userElement = document.getElementById("permissions-username");
    if (!userElement) {
        return;
    }
    if (!userElement.value) {
        userElement.focus();
        return;
    }
    new api_GetAdminPermissions(userElement.value).fetch();
}
function adminSavePermissions() {
    let userElement = document.getElementById("permissions-username");
    if (!userElement) {
        return;
    }
    if (!userElement.value) {
        userElement.focus();
        return;
    }
    let val = 0;
    for (const el of document.querySelectorAll("[data-admin-permissions]")) {
        if (el.checked && el.dataset.adminPermissions) {
            val |= 1 << +el.dataset.adminPermissions;
        }
    }
    new api_SetAdminPermissions(userElement.value, val).fetch();
}
function adminSetPermissionCheckboxes(lvl) {
    for (const el of document.querySelectorAll("[data-admin-permissions]")) {
        el.checked = Boolean(lvl & (1 << +(el.dataset.adminPermissions || 0)));
    }
}
function p_admin(element) {
    var _a, _b, _c, _d, _e, _f;
    (_a = element.querySelector("#delete-post")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", adminDeletePost);
    (_b = element.querySelector("#delete-user")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", adminDeleteUser);
    (_c = element.querySelector("#generate-otp")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", adminCreateOTP);
    (_d = element.querySelector("#list-otps")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", adminListOTPs);
    (_e = element.querySelector("#permissions-load")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", adminLoadPermissions);
    (_f = element.querySelector("#permissions-save")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", adminSavePermissions);
}
function _getChanges(version, changes) {
    let list = changes.map((a) => (`<li>${a}</li>`)).join("");
    return `<details><summary>All changes in v${version}</summary><ul>${list}</ul></details>`;
}
function _getVersionSpotlight(spotlight) {
    if (!spotlight) {
        return "";
    }
    let list = (spotlight === null || spotlight === void 0 ? void 0 : spotlight.map((a) => (`<div>${a.icon ? icons[a.icon] : ""}${a.info}</div>`)).join("")) || "";
    return list && `<div class="version-spotlight">${list}</div>`;
}
function checkVersionNewer(current, version) {
    let target = current.split(".").map(Number);
    let ver = version.split(".").map(Number);
    return ver[0] > target[0]
        || ver[0] === target[0] && ver[1] > target[1]
        || ver[0] === target[0] && ver[1] === target[1] && ver[2] > target[2];
}
function generateChangesHTML(since) {
    let queuedVersions = Object.keys(changes);
    if (since !== "all") {
        if (!since.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) {
            return "Invalid";
        }
        let realQueued = [];
        for (const verString of queuedVersions) {
            if (checkVersionNewer(since, verString)) {
                realQueued.push(verString);
            }
        }
        queuedVersions = realQueued;
    }
    if (queuedVersions.length === 0) {
        return "No changes";
    }
    queuedVersions.sort((a, b) => {
        let aNum = a.split(".").map(Number);
        let bNum = b.split(".").map(Number);
        return bNum[0] - aNum[0] || bNum[1] - aNum[1] || bNum[2] - aNum[2];
    });
    let output = "";
    if (since === "all") {
        for (const ver of queuedVersions) {
            let data = changes[ver];
            output += `<h2>v${ver}</h2> <div class="changelog-description">- ${data.description}</div>${_getVersionSpotlight(data.major_changes)}${_getChanges(ver, data.changes)}`;
        }
    }
    else {
        let allMajorChanges = [].concat(...queuedVersions.map((a) => (changes[a].major_changes || [])));
        output += "<h2>What's new?</h2><br>" + _getVersionSpotlight(allMajorChanges);
        for (const ver of queuedVersions) {
            let data = changes[ver];
            output += `<h2>v${ver}</h2> <div class="changelog-description">- ${data.description}</div>${_getChanges(ver, data.changes)}`;
        }
    }
    return output;
}
let expectedVersion = localStorage.getItem("smiggins-last-version");
if (loggedIn && expectedVersion && checkVersionNewer(expectedVersion, version) && !localStorage.getItem("smiggins-hide-changelog")) {
    setTimeout(() => {
        createUpdateModal(localStorage.getItem("smiggins-last-version") || "0.0.0");
        localStorage.setItem("smiggins-last-version", version);
    }, 100);
}
function p_folreq(element) {
    let timelineElement = element.querySelector("#timeline-posts");
    if (!timelineElement) {
        return;
    }
    hookTimeline(timelineElement, null, {
        "follow-requests": { api: api_TimelineFolreq, disableCaching: true, disablePolling: true, prependPosts: false, customRender: renderFolreqTimeline }
    }, "follow-requests", element);
}
function renderFolreqTimeline(users, end, updateCache, moreElementOverride) {
    var _a, _b, _c;
    clearTimelineStatuses();
    if (offset.lower === null && users.length === 0) {
        let none = document.createElement("i");
        none.classList.add("timeline-status");
        none.innerText = L.generic.none;
        tlElement.append(none);
        return;
    }
    let frag = document.createDocumentFragment();
    let more = moreElementOverride || document.getElementById("timeline-more");
    if (more) {
        if (end) {
            more.hidden = true;
        }
        else {
            more.hidden = false;
        }
    }
    for (const user of users) {
        let el = getSnippet("folreq-user", {
            username: user.username,
            banner_one: user.color_one,
            banner_two: user.color_two,
            hidden_if_no_pronouns: user.pronouns ? "" : "hidden",
            bio: [linkify(escapeHTML(user.bio)), 1],
            pronouns: [escapeHTML(user.pronouns || ""), 1],
            display_name: [escapeHTML(user.display_name), 1]
        });
        (_a = el.querySelector("[data-folreq-interaction-accept]")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", folreqInteraction);
        (_b = el.querySelector("[data-folreq-interaction-deny]")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", folreqInteraction);
        (_c = el.querySelector("[data-folreq-interaction-block]")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", folreqInteraction);
        el.dataset.folreqRemove = user.username;
        frag.append(el);
    }
    tlElement.append(frag);
}
function folreqInteraction(e) {
    var _a, _b;
    let el = e.currentTarget;
    if (!el) {
        return;
    }
    if (el.dataset.folreqInteractionAccept || el.dataset.folreqInteractionDeny) {
        let username = el.dataset.folreqInteractionAccept || el.dataset.folreqInteractionDeny || "";
        (_a = document.querySelector(`[data-folreq-remove="${username}"]`)) === null || _a === void 0 ? void 0 : _a.remove();
        new (el.dataset.folreqInteractionAccept ? api_AcceptFollowRequest : api_DenyFollowRequest)(username).fetch();
    }
    else if (el.dataset.folreqInteractionBlock) {
        (_b = document.querySelector(`[data-folreq-remove="${el.dataset.folreqInteractionBlock}"]`)) === null || _b === void 0 ? void 0 : _b.remove();
        blockUser(el.dataset.folreqInteractionBlock, true);
    }
}
function getHashtagFromPath(path) {
    return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}
function p_hashtag(element) {
    let timelineElement = element.querySelector("#timeline-posts");
    let tag = getHashtagFromPath();
    if (!timelineElement || !tag) {
        return;
    }
    hookTimeline(timelineElement, element.querySelector("#timeline-carousel"), {
        [`hashtag_${tag}_recent`]: { api: api_TimelineHashtag, args: [getHashtagFromPath(), "recent"], prependPosts: false },
        [`hashtag_${tag}_oldest`]: { api: api_TimelineHashtag, args: [getHashtagFromPath(), "oldest"], prependPosts: false, disablePolling: true, invertOffset: true },
    }, `hashtag_${tag}_recent`, element);
}
function p_home(element) {
    var _a, _b;
    hookTimeline(element.querySelector("[id=\"timeline-posts\"]"), element.querySelector("#timeline-carousel"), {
        following: { api: api_TimelineFollowing, prependPosts: true },
        global: { api: api_TimelineGlobal, prependPosts: true },
        following__comments: { api: api_TimelineFollowing, args: [true], prependPosts: true },
        global__comments: { api: api_TimelineGlobal, args: [true], prependPosts: true }
    }, "global", element);
    (_a = element.querySelector("#post")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", homeCreatePost);
    (_b = element.querySelector("#poll-toggle")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
        let pollElement = element.querySelector("#poll-area");
        if (pollElement) {
            pollElement.hidden = !pollElement.hidden;
        }
    });
}
function getPollInputsHTML(id, submit) {
    let output = "";
    for (let i = 0; i < limits.poll_count; i++) {
        output += `<div><input data-poll-input="${id}" data-poll-num="${i}" ${i + 1 < limits.poll_count ? `data-enter-next="[data-poll-input='${id}'][data-poll-num='${i + 1}']"` : ""} data-enter-submit="${submit}" placeholder="${lr(L.post[i >= 2 ? "poll_placeholder_optional" : "poll_placeholder"], { n: String(i + 1) })}" maxlength="${limits.poll_item}"></div>`;
    }
    return output;
}
function homeCreatePost(e) {
    var _a;
    let cwElement = document.getElementById("post-cw");
    let contentElement = document.getElementById("post-content");
    let privatePostElement = document.getElementById("post-private");
    if (!cwElement || !contentElement || !privatePostElement) {
        return;
    }
    let cw = cwElement.value;
    let content = contentElement.value;
    let privatePost = privatePostElement.checked;
    let poll = [];
    if (!postModalFor || postModalFor.type !== "edit") {
        for (const el of document.querySelectorAll(":not([hidden]) > div > [data-poll-input=\"home\"]")) {
            if (el.value) {
                poll.push(el.value);
            }
        }
    }
    if (!content && poll.length === 0) {
        contentElement.focus();
        return;
    }
    (_a = e.target) === null || _a === void 0 ? void 0 : _a.setAttribute("disabled", "");
    createPost(content, cw || null, privatePost, (success) => {
        var _a, _b;
        (_a = e.target) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
        contentElement.focus();
        if (success) {
            cwElement.value = "";
            contentElement.value = "";
            (_b = document.getElementById("poll-area")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "");
            for (const el of document.querySelectorAll("[data-poll-input]")) {
                el.value = "";
            }
        }
    }, {
        poll: poll.length ? poll : undefined
    });
}
function loginSubmitEvent(e) {
    let usernameElement = document.getElementById("username");
    let passwordElement = document.getElementById("password");
    if (!usernameElement || !passwordElement) {
        return;
    }
    let username = usernameElement.value;
    let password = passwordElement.value;
    if (!username) {
        usernameElement.focus();
        return;
    }
    else if (!password) {
        passwordElement.focus();
        return;
    }
    new api_LogIn(username, password, e.target).fetch();
}
function signupSubmitEvent(e) {
    let usernameElement = document.getElementById("username");
    let passwordElement = document.getElementById("password");
    let confirmElement = document.getElementById("confirm");
    let otpElement = document.getElementById("otp");
    if (!usernameElement || !passwordElement || !confirmElement) {
        return;
    }
    let username = usernameElement.value;
    let password = passwordElement.value;
    let confirm = confirmElement.value;
    let otp = null;
    if (otpElement) {
        otp = otpElement.value;
    }
    if (otpElement && !otp) {
        otpElement.focus();
        return;
    }
    else if (!username) {
        usernameElement.focus();
        return;
    }
    else if (!password) {
        passwordElement.focus();
        return;
    }
    else if (password !== confirm) {
        confirmElement.focus();
        createToast(L.errors.passwords_dont_match);
        return;
    }
    new api_SignUp(username, password, e.target).fetch();
}
function p_login(element) {
    element.querySelector("#submit").addEventListener("click", loginSubmitEvent);
}
function p_signup(element) {
    var _a;
    (_a = element.querySelector("#submit")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", signupSubmitEvent);
}
function p_logout(element) {
    document.cookie = "token=;Path=/;Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    location.href = "/";
}
const MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD = 600;
const MESSAGE_PREPEND_SCROLL_DOWN_THRESHOLD = 16;
let previousMessageLabel = null;
let firstMessage = null;
function getMessageGroupIDFromPath(path) {
    return +(path || location.pathname).split("/").filter(Boolean)[1];
}
function p_messageList(element) {
    var _a;
    let timelineElement = element.querySelector("#timeline-posts");
    if (!timelineElement) {
        return;
    }
    hookTimeline(timelineElement, null, {
        message_list: { api: api_MessageGroupTimeline, disableCaching: true, prependPosts: false, customRender: renderMessageListTimeline, customForward: handleMessageListForward }
    }, "message_list", element);
    (_a = element.querySelector("#message-new")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", newMessageModal);
}
function p_message(element) {
    var _a;
    let timelineElement = element.querySelector("#timeline-posts");
    previousMessageLabel = null;
    firstMessage = null;
    if (!timelineElement) {
        return;
    }
    hookTimeline(timelineElement, null, {
        message: { api: api_MessageTimeline, args: [getMessageGroupIDFromPath()], disableCaching: true, prependPosts: false, customRender: renderMessageTimeline, customForward: handleMessageForward }
    }, "message", element);
    (_a = element.querySelector("#messages-compose")) === null || _a === void 0 ? void 0 : _a.addEventListener("keydown", messageComposeHandler);
}
function messageComposeHandler(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        let compose = document.getElementById("messages-compose");
        if (compose && compose.value) {
            new api_MessageSend(getMessageGroupIDFromPath(), compose.value, compose).fetch();
            e.preventDefault();
        }
    }
}
function renderMessageListTimeline(groups, end, _, moreElementOverride, prepend = false) {
    clearTimelineStatuses();
    if (offset.lower === null && groups.length === 0) {
        let none = document.createElement("i");
        none.classList.add("timeline-status");
        none.innerText = L.generic.none;
        tlElement.append(none);
        return;
    }
    let frag = document.createDocumentFragment();
    for (const group of groups) {
        if (!offset.lower || group.timestamp < offset.lower) {
            offset.lower = group.timestamp;
        }
        if (!offset.upper || group.timestamp > offset.upper) {
            offset.upper = group.timestamp;
        }
        let el = getSnippet("message-list-item", {
            gid: String(group.group_id),
            timestamp: getTimestamp(group.timestamp),
            content: [group.recent_content ? escapeHTML(group.recent_content) : `<i>${L.messages.none}</i>`, 1],
            names: [getMessageTitle(group.members.names, group.members.count), 1],
        });
        if (!group.unread) {
            el.dataset.notificationRead = "";
        }
        let existing = document.querySelector(`[data-message-group-id="${group.group_id}"]`) || frag.querySelector(`[data-message-group-id="${group.group_id}"]`);
        if (prepend) {
            existing === null || existing === void 0 ? void 0 : existing.remove();
        }
        if (!existing || prepend) {
            el.dataset.messageGroupId = String(group.group_id);
            frag.append(el);
        }
    }
    if (prepend) {
        tlElement.prepend(frag);
    }
    else {
        tlElement.append(frag);
        let more = moreElementOverride || document.getElementById("timeline-more");
        if (more) {
            if (end) {
                more.hidden = true;
            }
            else {
                more.hidden = false;
            }
        }
    }
}
function handleMessageListForward(groups, end, expectedTlID = "message_list", _ = false) {
    tlPollingPendingResponse = false;
    if (expectedTlID !== currentTlID) {
        console.log("timeline switched, discarding request");
        return;
    }
    if (groups.length === 0) {
        return;
    }
    if (!end) {
        reloadTimeline(true);
        return;
    }
    renderMessageListTimeline(groups.reverse(), false, false, null, true);
}
function getMessageTitle(members, count) {
    members = members.map((a) => (`<b>${escapeHTML(a)}</b>`));
    return lr(n(L.messages.title, count - 1), {
        a: members[0],
        b: members[1],
        c: members[2],
        n: String(count)
    });
}
function _getMessageSeparator(message) {
    let separator = document.createElement("div");
    separator.dataset.messageSeparator = "";
    if (message.username === username) {
        separator.dataset.messageSelf = "";
    }
    separator.innerHTML = `<a data-internal-link="user" href="/u/${message.username}/" class="plain-link">${escapeHTML(message.display_name)} - ${getTimestamp(message.timestamp)}</a>`;
    generateInternalLinks(separator);
    return separator;
}
function renderMessageTimeline(messages, end, _, moreElementOverride, prepend = false) {
    clearTimelineStatuses();
    let scrollToBottom = offset.lower === null;
    let scrollElement = document.getElementById("messages-timeline-container");
    let oldScrollTop = scrollElement === null || scrollElement === void 0 ? void 0 : scrollElement.scrollTop;
    let oldScrollTopMax = scrollElement && (scrollElement.scrollHeight - scrollElement.getBoundingClientRect().height);
    let oldScrollHeight = scrollElement === null || scrollElement === void 0 ? void 0 : scrollElement.scrollHeight;
    if (offset.lower === null) {
        fetchNotifications();
        firstMessage = messages[0];
    }
    if (messages.length === 0) {
        if (offset.lower === null) {
            let none = document.createElement("i");
            none.classList.add("timeline-status");
            none.innerText = L.generic.none;
            tlElement.append(none);
        }
        return;
    }
    let frag = document.createDocumentFragment();
    let previous = messages[0];
    if (!prepend && previousMessageLabel) {
        previous = previousMessageLabel[0];
        previousMessageLabel[1].remove();
        previousMessageLabel = null;
    }
    for (const message of messages) {
        if (!offset.lower || message.timestamp < offset.lower) {
            offset.lower = message.timestamp;
        }
        if (!offset.upper || message.timestamp > offset.upper) {
            offset.upper = message.timestamp;
        }
        if (previous.username !== message.username || previous.timestamp - MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD > message.timestamp) {
            frag.append(_getMessageSeparator(previous));
        }
        previous = message;
        let el = document.createElement("div");
        el.innerHTML = linkify(escapeHTML(message.content));
        generateInternalLinks(el);
        if (message.username === username) {
            el.dataset.messageSelf = "";
        }
        frag.append(el);
    }
    if (!prepend || firstMessage && (previous.username !== firstMessage.username || previous.timestamp - MESSAGE_SEPARATION_TIMESTAMP_THRESHOLD > firstMessage.timestamp)) {
        let previousElement = _getMessageSeparator(previous);
        previousMessageLabel = [previous, previousElement];
        frag.append(previousElement);
    }
    if (prepend) {
        tlElement.prepend(frag);
        firstMessage = messages[0];
        if (scrollElement && oldScrollTop && oldScrollTopMax && oldScrollTopMax - oldScrollTop < MESSAGE_PREPEND_SCROLL_DOWN_THRESHOLD) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }
    else {
        tlElement.append(frag);
        let more = moreElementOverride || document.getElementById("timeline-more");
        if (more) {
            if (end) {
                more.hidden = true;
            }
            else {
                more.hidden = false;
            }
        }
        if (scrollElement && scrollToBottom) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
        else if (scrollElement && oldScrollTop !== undefined && oldScrollHeight !== undefined) {
            scrollElement.scrollTop = oldScrollTop + scrollElement.scrollHeight - oldScrollHeight;
        }
    }
}
function handleMessageForward(messages, end, expectedTlID = "message", _ = false) {
    tlPollingPendingResponse = false;
    if (expectedTlID !== currentTlID) {
        console.log("timeline switched, discarding request");
        return;
    }
    if (messages.length === 0) {
        return;
    }
    if (!end) {
        reloadTimeline(true);
        return;
    }
    renderMessageTimeline(messages, false, false, null, true);
}
var NotificationCodes;
(function (NotificationCodes) {
    NotificationCodes[NotificationCodes["Comment"] = 1] = "Comment";
    NotificationCodes[NotificationCodes["Quote"] = 2] = "Quote";
    NotificationCodes[NotificationCodes["Ping"] = 3] = "Ping";
    NotificationCodes[NotificationCodes["Like"] = 4] = "Like";
})(NotificationCodes || (NotificationCodes = {}));
;
function p_notifications(element) {
    pendingNotifications.notifications = false;
    let timelineElement = element.querySelector("#timeline-posts");
    if (!timelineElement) {
        return;
    }
    hookTimeline(timelineElement, null, {
        notifications: { api: api_TimelineNotifications, disableCaching: true, prependPosts: false, customRender: renderNotificationTimeline, customForward: handleNotificationForward }
    }, "notifications", element);
}
function _getLikeNotification(posts) {
    let recentTimestamp = 0;
    let users = posts.map((a) => {
        if (a.timestamp > recentTimestamp) {
            recentTimestamp = a.timestamp;
        }
        return [a.user.username, a.user.display_name];
    }).map((a) => {
        if (a === null) {
            return "";
        }
        let htmlStart = "<b>";
        let htmlEnd = "</b>";
        if (a[0]) {
            htmlStart += `<a class="plain-link" data-internal-link="user" href="/u/${a[0]}/">`;
            htmlEnd = "</a>" + htmlEnd;
        }
        return htmlStart + escapeHTML(a[1]) + htmlEnd;
    });
    let userFull = lr(n(L.notifications.like, posts.length), {
        a: users[0],
        b: users[1],
        c: users[2],
        n: String(posts.length)
    });
    return getSnippet("notification-like", {
        pid: String(posts[0].id),
        timestamp: getTimestamp(recentTimestamp),
        content: [simplePostContent(posts[0]), 1],
        names: [userFull, 1],
    });
}
function renderNotificationTimeline(posts, end, _, moreElementOverride, prepend = false) {
    clearTimelineStatuses();
    if (offset.lower === null && posts.length === 0) {
        let none = document.createElement("i");
        none.classList.add("timeline-status");
        none.innerText = L.generic.none;
        tlElement.append(none);
        return;
    }
    let frag = document.createDocumentFragment();
    let pendingLikes = {};
    let pendingLikeOrder = [];
    let previousRead = false;
    for (const post of posts) {
        if (!offset.lower || post[0].timestamp < offset.lower) {
            offset.lower = post[0].timestamp;
        }
        if (!offset.upper || post[0].timestamp > offset.upper) {
            offset.upper = post[0].timestamp;
        }
        let nc = post[1] & 0b01111111;
        let read = !(post[1] & 0x80);
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
            if (localStorage.getItem("smiggins-no-like-grouping")) {
                let el = _getLikeNotification([post[0]]);
                if (read) {
                    el.dataset.notificationRead = "";
                }
                frag.append(el);
            }
            else if (pendingLikes[post[0].id]) {
                pendingLikes[post[0].id].push(post[0]);
            }
            else {
                pendingLikeOrder.push(post[0].id);
                pendingLikes[post[0].id] = [post[0]];
            }
        }
        else {
            if (pendingLikeOrder.length) {
                for (const l of pendingLikeOrder) {
                    let el = _getLikeNotification(pendingLikes[l]);
                    if (read) {
                        el.dataset.notificationRead = "";
                    }
                    frag.append(el);
                }
                pendingLikes = {};
                pendingLikeOrder = [];
            }
            let el = getPost(insertIntoPostCache([post[0]])[0], false);
            if (read) {
                el.dataset.notificationRead = "";
            }
            frag.append(el);
        }
    }
    if (pendingLikeOrder.length) {
        for (const l of pendingLikeOrder) {
            let el = _getLikeNotification(pendingLikes[l]);
            if (previousRead) {
                el.dataset.notificationRead = "";
            }
            frag.append(el);
        }
        pendingLikes = {};
        pendingLikeOrder = [];
    }
    if (prepend) {
        tlElement.prepend(frag);
    }
    else {
        tlElement.append(frag);
        let more = moreElementOverride || document.getElementById("timeline-more");
        if (more) {
            if (end) {
                more.hidden = true;
            }
            else {
                more.hidden = false;
            }
        }
    }
}
function handleNotificationForward(posts, end, expectedTlID = "notifications", forceEvent = false) {
    tlPollingPendingResponse = false;
    if (expectedTlID !== currentTlID) {
        console.log("timeline switched, discarding request");
        return;
    }
    if (posts.length === 0) {
        return;
    }
    if (!end) {
        reloadTimeline(true);
        return;
    }
    renderNotificationTimeline(posts.reverse(), false, false, null, true);
}
let commentBoxValueSet = false;
function getPostIDFromPath(path) {
    return +(path || location.pathname).split("/").filter(Boolean)[1];
}
function postSetDNE() {
    var _a, _b, _c;
    let notFound = document.createElement("div");
    notFound.innerText = L.errors.post_not_found;
    notFound.classList.add("generic-margin-top");
    (_a = document.getElementById("focused-post")) === null || _a === void 0 ? void 0 : _a.replaceChildren(notFound);
    (_b = document.getElementById("comment-parent")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "");
    (_c = document.getElementById("home-link")) === null || _c === void 0 ? void 0 : _c.removeAttribute("hidden");
    for (const el of document.querySelectorAll("#focused-post + hr ~ *")) {
        el.setAttribute("hidden", "");
    }
}
function updateFocusedPost(post) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let pid = insertIntoPostCache([post])[0];
    let cwElement = document.querySelector("#focused-post .content-warning");
    (_a = document.getElementById("focused-post")) === null || _a === void 0 ? void 0 : _a.replaceChildren(getPost(pid, false, cwElement ? cwElement.open : null));
    if (post.comment) {
        (_b = document.getElementById("comment-parent")) === null || _b === void 0 ? void 0 : _b.removeAttribute("hidden");
        (_c = document.getElementById("comment-parent")) === null || _c === void 0 ? void 0 : _c.setAttribute("href", `/p/${post.comment}/`);
        (_d = document.getElementById("home-link")) === null || _d === void 0 ? void 0 : _d.setAttribute("hidden", "");
    }
    else {
        (_e = document.getElementById("comment-parent")) === null || _e === void 0 ? void 0 : _e.setAttribute("hidden", "");
        (_f = document.getElementById("home-link")) === null || _f === void 0 ? void 0 : _f.removeAttribute("hidden");
    }
    let commentElement = document.getElementById("post-content");
    let cwInputElement = document.getElementById("post-cw");
    if (!commentBoxValueSet && commentElement && !commentElement.value && cwInputElement && !cwInputElement.value) {
        commentBoxValueSet = true;
        commentElement.value = getPostMentionsString(post);
        cwInputElement.value = getPostTemplatedCW(post);
        if (post.private || defaultPostPrivate) {
            (_g = document.querySelector("#post-private:not([data-private-set])")) === null || _g === void 0 ? void 0 : _g.setAttribute("checked", "");
        }
        (_h = document.querySelector("#post-private:not([data-private-set])")) === null || _h === void 0 ? void 0 : _h.setAttribute("data-private-set", "");
    }
}
function getPostMentionsString(p) {
    return getMentionsFromPost(p).map((a) => (`@${a} `)).join("");
}
function getPostTemplatedCW(p) {
    let cw = p.content_warning;
    if (cw) {
        let style = localStorage.getItem("smiggins-cw-cascading");
        switch (style) {
            case "email":
            case null:
                if (!cw.toLowerCase().startsWith("re:")) {
                    return lr(L.post.cw.reply, { c: cw }).slice(0, limits.content_warning);
                }
            case "copy":
                return cw;
        }
    }
    return "";
}
function createComment(e) {
    var _a;
    let cwElement = document.getElementById("post-cw");
    let contentElement = document.getElementById("post-content");
    let privatePostElement = document.getElementById("post-private");
    if (!cwElement || !contentElement || !privatePostElement) {
        return;
    }
    let cw = cwElement.value;
    let content = contentElement.value;
    let privatePost = privatePostElement.checked;
    if (!content) {
        contentElement.focus();
        return;
    }
    (_a = e.target) === null || _a === void 0 ? void 0 : _a.setAttribute("disabled", "");
    createPost(content, cw || null, privatePost, (success) => {
        var _a;
        (_a = e.target) === null || _a === void 0 ? void 0 : _a.removeAttribute("disabled");
        contentElement.focus();
        if (success) {
            cwElement.value = "";
            let p = postCache[getPostIDFromPath()];
            if (p) {
                contentElement.value = getMentionsFromPost(p).map((a) => (`@${a} `)).join("");
            }
            else {
                contentElement.value = "";
            }
        }
    }, { comment: getPostIDFromPath() });
}
function p_postPage(element) {
    var _a;
    let pid = getPostIDFromPath();
    let p = postCache[pid];
    let postElement = element.querySelector("#focused-post");
    let timelineElement = element.querySelector("#timeline-posts");
    commentBoxValueSet = false;
    if (!timelineElement || !postElement) {
        return;
    }
    if (p) {
        let commentElement = element.querySelector("#post-content");
        let cwElement = element.querySelector("#post-cw");
        if (commentElement) {
            commentElement.value = getPostMentionsString(p);
        }
        if (cwElement) {
            cwElement.value = getPostTemplatedCW(p);
        }
        postElement.replaceChildren(getPost(pid, false));
    }
    else {
        postElement.replaceChildren(getSnippet("post-placeholder"));
    }
    hookTimeline(timelineElement, element.querySelector("#timeline-carousel"), {
        [`post_${pid}_recent`]: { api: api_TimelineComments, args: [pid, "recent"], prependPosts: pid },
        [`post_${pid}_oldest`]: { api: api_TimelineComments, args: [pid, "oldest"], prependPosts: false, disablePolling: true, invertOffset: true },
    }, `post_${pid}_recent`, element);
    (_a = element.querySelector("#post")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", createComment);
}
function p_search(element) {
    var _a;
    let contentElement = element.querySelector("#search-content");
    let advancedElement = element.querySelector("details");
    let cwElement = element.querySelector("#search-cw");
    let usernameElement = element.querySelector("#search-username");
    let quoteElement = element.querySelector("#search-quote");
    let pollElement = element.querySelector("#search-poll");
    let commentElement = element.querySelector("#search-comment");
    let params = new URLSearchParams(location.search);
    if (contentElement && params.get("q")) {
        contentElement.value = params.get("q") || "";
    }
    if (cwElement && params.get("cw")) {
        cwElement.value = params.get("cw") || "";
        advancedElement === null || advancedElement === void 0 ? void 0 : advancedElement.setAttribute("open", "");
    }
    if (usernameElement && params.get("user")) {
        usernameElement.value = params.get("user") || "";
        advancedElement === null || advancedElement === void 0 ? void 0 : advancedElement.setAttribute("open", "");
    }
    if (quoteElement && params.get("quote")) {
        quoteElement.value = params.get("quote") || "";
        advancedElement === null || advancedElement === void 0 ? void 0 : advancedElement.setAttribute("open", "");
    }
    if (pollElement && params.get("poll")) {
        pollElement.value = params.get("poll") || "";
        advancedElement === null || advancedElement === void 0 ? void 0 : advancedElement.setAttribute("open", "");
    }
    if (commentElement && params.get("comment")) {
        commentElement.value = params.get("comment") || "";
        advancedElement === null || advancedElement === void 0 ? void 0 : advancedElement.setAttribute("open", "");
    }
    (_a = element.querySelector("#apply-search")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => resetSearchTL());
    resetSearchTL(element);
}
function resetSearchTL(baseElement) {
    var _a;
    let contentElement = (baseElement || document).querySelector("#search-content");
    let cwElement = (baseElement || document).querySelector("#search-cw");
    let usernameElement = (baseElement || document).querySelector("#search-username");
    let quoteElement = (baseElement || document).querySelector("#search-quote");
    let pollElement = (baseElement || document).querySelector("#search-poll");
    let commentElement = (baseElement || document).querySelector("#search-comment");
    let content = contentElement ? contentElement.value.toLowerCase() : "";
    let cw = cwElement ? cwElement.value.toLowerCase() : "";
    let username = usernameElement ? usernameElement.value.toLowerCase() : "";
    let quoteStr = quoteElement ? quoteElement.value : "";
    let pollStr = pollElement ? pollElement.value : "";
    let commentStr = commentElement ? commentElement.value : "";
    let tlElement = (baseElement || document).querySelector("#timeline-posts");
    if (!tlElement) {
        return;
    }
    let queryParams = "";
    if (content) {
        queryParams += "&q=" + content;
    }
    if (cw) {
        queryParams += "&cw=" + cw;
    }
    if (username) {
        queryParams += "&user=" + username;
    }
    if (quoteStr === "true" || quoteStr === "false") {
        queryParams += "&quote=" + quoteStr;
    }
    if (pollStr === "true" || pollStr === "false") {
        queryParams += "&poll=" + pollStr;
    }
    if (commentStr === "true" || commentStr === "false") {
        queryParams += "&comment=" + commentStr;
    }
    queryParams = queryParams.slice(1);
    if (location.search !== "?" + queryParams && location.search !== queryParams) {
        if (queryParams) {
            history.pushState("search", "", `/search/?${queryParams}`);
        }
        else {
            history.pushState("search", "", "/search/");
        }
    }
    hookTimeline(tlElement, (baseElement || document).querySelector("#timeline-carousel"), {
        search_recent: { api: api_TimelineSearch, args: [queryParams, "new"], prependPosts: false, disableCaching: true, disablePolling: true },
        search_oldest: { api: api_TimelineSearch, args: [queryParams, "old"], prependPosts: false, disableCaching: true, disablePolling: true, invertOffset: true }
    }, ((_a = (baseElement || document).querySelector("#timeline-carousel [data-timeline-active]")) === null || _a === void 0 ? void 0 : _a.dataset.timelineId) || "search_recent", baseElement);
}
function updateBannerColors() {
    let bannerDisplayElement = document.getElementById("banner-example");
    let gradientCheckElement = document.getElementById("banner-gradient");
    let c1Element = document.getElementById("banner-one");
    let c2Element = document.getElementById("banner-two");
    if (!bannerDisplayElement) {
        return;
    }
    if (c1Element) {
        bannerDisplayElement.style.setProperty("--color-one", c1Element.value);
        if (gradientCheckElement && !gradientCheckElement.checked) {
            bannerDisplayElement.style.setProperty("--color-two", c1Element.value);
        }
    }
    if (c2Element && (!gradientCheckElement || gradientCheckElement.checked)) {
        bannerDisplayElement.style.setProperty("--color-two", c2Element.value);
    }
}
function updateUserCacheFromCosmeticSettings() {
    let c = userCache[username];
    let displayNameElement = document.getElementById("display-name");
    let bioElement = document.getElementById("bio");
    let gradientCheckElement = document.getElementById("banner-gradient");
    let c1Element = document.getElementById("banner-one");
    let c2Element = document.getElementById("banner-two");
    if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element) {
        return;
    }
    if (c) {
        c.color_one = c1Element.value;
        c.color_two = gradientCheckElement.checked ? c2Element.value : c1Element.value;
        c.display_name = displayNameElement.value;
        c.bio = bioElement.value;
    }
}
function setFontSize(e) {
    let el = e.currentTarget;
    if (!el) {
        return;
    }
    localStorage.setItem("smiggins-font-size", el.id.slice(10));
    document.body.dataset.fontSize = el.id.slice(10);
}
function saveProfile(e) {
    let displayNameElement = document.getElementById("display-name");
    let bioElement = document.getElementById("bio");
    let gradientCheckElement = document.getElementById("banner-gradient");
    let c1Element = document.getElementById("banner-one");
    let c2Element = document.getElementById("banner-two");
    let pronounsElement = document.getElementById("pronouns");
    let pronounsCustomElement = document.getElementById("pronouns-custom");
    if (!displayNameElement || !bioElement || !gradientCheckElement || !c1Element || !c2Element || !pronounsElement || !pronounsCustomElement) {
        return;
    }
    new api_SaveProfile(gradientCheckElement.checked, displayNameElement.value, bioElement.value, pronounsElement.value === "custom" ? pronounsCustomElement.value : pronounsElement.value, c1Element.value.slice(1), c2Element.value.slice(1), e.target).fetch();
}
function saveDefaultVisibility() {
    var _a;
    defaultPostPrivate = ((_a = document.getElementById("default-private")) === null || _a === void 0 ? void 0 : _a.value) === "true";
    snippetVariables.selected_if_default_private = defaultPostPrivate ? "selected" : "";
    snippetVariables.checked_if_default_private = defaultPostPrivate ? "checked" : "";
    new api_DefaultVisibility(defaultPostPrivate).fetch();
}
function saveVerifyFollowers() {
    var _a;
    new api_VerifyFollowers(((_a = document.getElementById("verify-followers")) === null || _a === void 0 ? void 0 : _a.checked) || false).fetch();
}
function settingsThemeSelection() {
    let themeElement = document.getElementById("theme");
    if (themeElement) {
        let th = themeElement.value;
        setTheme(th);
    }
}
function settingsPFPShapeSelection() {
    let pfpElement = document.getElementById("pfp-shape");
    if (pfpElement) {
        let shape = pfpElement.value;
        localStorage.setItem("smiggins-pfp-shape", shape);
        document.body.dataset.pfpShape = shape;
    }
}
function settingsCWCascadingSelection() {
    let cwElement = document.getElementById("cw-cascading");
    if (cwElement) {
        let type = cwElement.value;
        localStorage.setItem("smiggins-cw-cascading", type);
    }
}
function changePasswordSuccess(token) {
    setTokenCookie(token);
    createToast(L.generic.success, L.settings.account.password_changed);
    let currentPwElement = document.getElementById("password-current");
    let newPwElement = document.getElementById("password-new");
    let confirmPwElement = document.getElementById("password-confirm");
    if (!currentPwElement || !newPwElement || !confirmPwElement) {
        return;
    }
    currentPwElement.value = "";
    newPwElement.value = "";
    confirmPwElement.value = "";
}
function changePassword(e) {
    let currentPwElement = document.getElementById("password-current");
    let newPwElement = document.getElementById("password-new");
    let confirmPwElement = document.getElementById("password-confirm");
    if (!currentPwElement || !newPwElement || !confirmPwElement) {
        return;
    }
    let currentPw = currentPwElement.value;
    let newPw = newPwElement.value;
    let confirmPw = confirmPwElement.value;
    if (!currentPw) {
        currentPwElement.focus();
        return;
    }
    if (!newPw) {
        newPwElement.focus();
        return;
    }
    if (confirmPw !== newPw) {
        confirmPwElement.focus();
        return;
    }
    new api_ChangePassword(currentPw, newPw, e.target).fetch();
}
function deleteAccount(e) {
    let pwElement = document.getElementById("delete-acc-password");
    let confirmElement = document.getElementById("delete-acc-confirm");
    if (!pwElement || !confirmElement) {
        return;
    }
    let password = pwElement.value;
    let confirmed = confirmElement.checked;
    if (!password) {
        pwElement.focus();
        return;
    }
    if (!confirmed) {
        confirmElement.focus();
        return;
    }
    new api_DeleteAccount(username, password, e.target).fetch();
}
function profileSettingsSetUserData(displayName, bio, pronouns, colorOne, colorTwo, gradient, verifyFollowers) {
    var _a, _b, _c;
    let displayNameElement = document.getElementById("display-name");
    let bioElement = document.getElementById("bio");
    let gradientCheckElement = document.getElementById("banner-gradient");
    let c1Element = document.getElementById("banner-one");
    let c2Element = document.getElementById("banner-two");
    let verifyElement = document.getElementById("verify-followers");
    let pronounsElement = document.getElementById("pronouns");
    let pronounsCustomElement = document.getElementById("pronouns-custom");
    if (displayNameElement) {
        displayNameElement.value = displayName;
    }
    if (bioElement) {
        bioElement.value = bio;
    }
    if (gradientCheckElement) {
        gradientCheckElement.checked = gradient;
    }
    if (c1Element) {
        c1Element.value = colorOne;
        c1Element.addEventListener("input", updateBannerColors);
    }
    if (c2Element) {
        c2Element.value = colorTwo;
        c2Element.addEventListener("input", updateBannerColors);
    }
    if (verifyElement) {
        verifyElement.checked = verifyFollowers;
        verifyElement.addEventListener("input", saveVerifyFollowers);
    }
    if (pronounsElement && pronounsCustomElement) {
        pronounsElement.addEventListener("input", function () {
            if (pronounsElement.value === "custom") {
                pronounsCustomElement.removeAttribute("hidden");
            }
            else {
                pronounsCustomElement.setAttribute("hidden", "");
            }
        });
        if (pronouns === "") {
        }
        else if (L.settings.profile.pronouns_presets.includes(pronouns)) {
            pronounsElement.value = pronouns;
            pronounsCustomElement.setAttribute("hidden", "");
        }
        else {
            pronounsElement.value = "custom";
            pronounsCustomElement.value = pronouns;
            pronounsCustomElement.removeAttribute("hidden");
        }
    }
    (_a = document.getElementById("profile-save")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", saveProfile);
    (_b = document.getElementById("default-private")) === null || _b === void 0 ? void 0 : _b.addEventListener("input", saveDefaultVisibility);
    (_c = document.getElementById("banner-gradient")) === null || _c === void 0 ? void 0 : _c.addEventListener("input", updateBannerColors);
    let c = userCache[username];
    if (c) {
        c.color_one = colorOne;
        c.color_two = gradient ? colorTwo : colorOne;
        c.display_name = displayName;
        c.bio = bio;
    }
    updateBannerColors();
    for (const el of document.querySelectorAll("[data-disabled-while-loading]")) {
        el.removeAttribute("disabled");
    }
}
function setKeybindElementData(kbId, el) {
    var _a;
    setKeybindStrings();
    let kbData = keybinds[kbId];
    let keyData = _kbGetKey(kbId);
    let key = keyData[0] + keyData.slice(1).split(":")[0];
    let modifiers = keyData.slice(1).split(":")[1].split(",").map((mod) => ({
        alt: L.keybinds.modifiers.alt + " + ",
        ctrl: L.keybinds.modifiers.ctrl + " + ",
        nav: _kbGetKey("navModifier")[0] + _kbGetKey("navModifier").slice(1).split(":")[0] + " + ",
        shift: L.keybinds.modifiers.shift + " + "
    }[mod])).join("");
    let output = `<div class="generic-margin-top">${escapeHTML(kbData.name || "")}: <code class="kb-key">${escapeHTML(key == KB_DISABLED ? KB_DISABLED : modifiers + key)}</code> <button data-kb-id="${kbId}">${L.keybinds.button_change}</button></div>`;
    if (kbData.description) {
        output += `<small><div>${escapeHTML(kbData.description)}</div></small>`;
    }
    el.innerHTML = output;
    (_a = el.querySelector("button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => { modifyKeybindModal(kbId); });
}
function exportSettings() {
    let settings = {
        autoShowPosts: Boolean(localStorage.getItem("smiggins-auto-show-posts")),
        complexTimestamps: Boolean(localStorage.getItem("smiggins-complex-timestamps")),
        cwCascading: localStorage.getItem("smiggins-cw-cascading") || "email",
        expandCws: Boolean(localStorage.getItem("smiggins-expand-cws")),
        fontSize: localStorage.getItem("smiggins-font-size") || "normal",
        hideChangelog: Boolean(localStorage.getItem("smiggins-hide-changelog")),
        hideInteractions: Boolean(localStorage.getItem("smiggins-hide-interactions")),
        noLikeGrouping: Boolean(localStorage.getItem("smiggins-no-like-grouping")),
        pfpShape: localStorage.getItem("smiggins-php-shape") || "round",
        theme: localStorage.getItem("smiggins-theme") || "system",
        homeTimeline: {
            comments: Boolean(localStorage.getItem("smiggins-home-comments")),
            default: localStorage.getItem("smiggins-home") || "global"
        },
        keybinds: {
            hamburgerDelete: _kbGetKey("hamburgerDelete"),
            hamburgerEdit: _kbGetKey("hamburgerEdit"),
            hamburgerEmbed: _kbGetKey("hamburgerEmbed"),
            hamburgerPin: _kbGetKey("hamburgerPin"),
            hamburgerShare: _kbGetKey("hamburgerShare"),
            loadNewPosts: _kbGetKey("loadNewPosts"),
            navAdmin: _kbGetKey("navAdmin"),
            navHome: _kbGetKey("navHome"),
            navModifier: _kbGetKey("navModifier"),
            navNotifications: _kbGetKey("navNotifications"),
            navProfile: _kbGetKey("navProfile"),
            navSettings: _kbGetKey("navSettings"),
            newPost: _kbGetKey("newPost"),
            topOfTimeline: _kbGetKey("topOfTimeline")
        }
    };
    let element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(settings)));
    element.setAttribute("download", "smiggins.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
function _lsBoolean(data, key) {
    if (data) {
        localStorage.setItem(key, "1");
    }
    else {
        localStorage.removeItem(key);
    }
}
function importSettings(data) {
    _lsBoolean(data.autoShowPosts, "smiggins-auto-show-posts");
    _lsBoolean(data.complexTimestamps, "smiggins-complex-timestamps");
    localStorage.setItem("smiggins-cw-cascading", data.cwCascading || "email");
    _lsBoolean(data.expandCws, "smiggins-expand-cws");
    localStorage.setItem("smiggins-font-size", data.fontSize || "normal");
    _lsBoolean(data.hideChangelog, "smiggins-hide-changelog");
    _lsBoolean(data.hideInteractions, "smiggins-hide-interactions");
    _lsBoolean(data.noLikeGrouping, "smiggins-no-like-grouping");
    localStorage.setItem("smiggins-pfp-shape", data.pfpShape || "round");
    localStorage.setItem("smiggins-theme", data.theme || "system");
    _lsBoolean(data.homeTimeline.comments, "smiggins-home-comments");
    localStorage.setItem("smiggins-home", data.homeTimeline.default || "global");
    localStorage.setItem("smiggins-keybind-hamburgerDelete", data.keybinds.hamburgerDelete || _kbGetKey("hamburgerDelete"));
    localStorage.setItem("smiggins-keybind-hamburgerEdit", data.keybinds.hamburgerEdit || _kbGetKey("hamburgerEdit"));
    localStorage.setItem("smiggins-keybind-hamburgerEmbed", data.keybinds.hamburgerEmbed || _kbGetKey("hamburgerEmbed"));
    localStorage.setItem("smiggins-keybind-hamburgerPin", data.keybinds.hamburgerPin || _kbGetKey("hamburgerPin"));
    localStorage.setItem("smiggins-keybind-hamburgerShare", data.keybinds.hamburgerShare || _kbGetKey("hamburgerShare"));
    localStorage.setItem("smiggins-keybind-loadNewPosts", data.keybinds.loadNewPosts || _kbGetKey("loadNewPosts"));
    localStorage.setItem("smiggins-keybind-navAdmin", data.keybinds.navAdmin || _kbGetKey("navAdmin"));
    localStorage.setItem("smiggins-keybind-navHome", data.keybinds.navHome || _kbGetKey("navHome"));
    localStorage.setItem("smiggins-keybind-navModifier", data.keybinds.navModifier || _kbGetKey("navModifier"));
    localStorage.setItem("smiggins-keybind-navNotifications", data.keybinds.navNotifications || _kbGetKey("navNotifications"));
    localStorage.setItem("smiggins-keybind-navProfile", data.keybinds.navProfile || _kbGetKey("navProfile"));
    localStorage.setItem("smiggins-keybind-navSettings", data.keybinds.navSettings || _kbGetKey("navSettings"));
    localStorage.setItem("smiggins-keybind-newPost", data.keybinds.newPost || _kbGetKey("newPost"));
    localStorage.setItem("smiggins-keybind-topOfTimeline", data.keybinds.topOfTimeline || _kbGetKey("topOfTimeline"));
    location.href = location.origin + location.pathname + location.search;
}
function p_settingsProfile(element) {
    new api_GetProfile().fetch();
}
function p_settingsCosmetic(element) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    (_a = element.querySelector(`#theme > option[value="${theme}"]`)) === null || _a === void 0 ? void 0 : _a.setAttribute("selected", "");
    (_b = element.querySelector(`#pfp-shape > option[value="${localStorage.getItem("smiggins-pfp-shape") || "round"}"]`)) === null || _b === void 0 ? void 0 : _b.setAttribute("selected", "");
    (_c = element.querySelector(`#cw-cascading > option[value="${localStorage.getItem("smiggins-cw-cascading") || "email"}"]`)) === null || _c === void 0 ? void 0 : _c.setAttribute("selected", "");
    if (localStorage.getItem("smiggins-complex-timestamps")) {
        (_d = element.querySelector("#complex-timestamps")) === null || _d === void 0 ? void 0 : _d.setAttribute("checked", "");
    }
    if (localStorage.getItem("smiggins-hide-interactions")) {
        (_e = element.querySelector("#hide-interactions")) === null || _e === void 0 ? void 0 : _e.setAttribute("checked", "");
    }
    if (localStorage.getItem("smiggins-expand-cws")) {
        (_f = element.querySelector("#expand-cws")) === null || _f === void 0 ? void 0 : _f.setAttribute("checked", "");
    }
    if (localStorage.getItem("smiggins-hide-changelog")) {
        (_g = element.querySelector("#hide-changelog")) === null || _g === void 0 ? void 0 : _g.setAttribute("checked", "");
    }
    if (localStorage.getItem("smiggins-no-like-grouping")) {
        (_h = element.querySelector("#no-like-grouping")) === null || _h === void 0 ? void 0 : _h.setAttribute("checked", "");
    }
    if (localStorage.getItem("smiggins-auto-show-posts")) {
        (_j = element.querySelector("#auto-show")) === null || _j === void 0 ? void 0 : _j.setAttribute("checked", "");
    }
    (_k = element.querySelector("#theme")) === null || _k === void 0 ? void 0 : _k.addEventListener("change", settingsThemeSelection);
    (_l = element.querySelector("#pfp-shape")) === null || _l === void 0 ? void 0 : _l.addEventListener("change", settingsPFPShapeSelection);
    (_m = element.querySelector("#cw-cascading")) === null || _m === void 0 ? void 0 : _m.addEventListener("change", settingsCWCascadingSelection);
    (_o = element.querySelector("#complex-timestamps")) === null || _o === void 0 ? void 0 : _o.addEventListener("change", genericCheckbox("smiggins-complex-timestamps"));
    (_p = element.querySelector("#hide-interactions")) === null || _p === void 0 ? void 0 : _p.addEventListener("change", genericCheckbox("smiggins-hide-interactions"));
    (_q = element.querySelector("#expand-cws")) === null || _q === void 0 ? void 0 : _q.addEventListener("change", genericCheckbox("smiggins-expand-cws"));
    (_r = element.querySelector("#hide-changelog")) === null || _r === void 0 ? void 0 : _r.addEventListener("change", genericCheckbox("smiggins-hide-changelog"));
    (_s = element.querySelector("#no-like-grouping")) === null || _s === void 0 ? void 0 : _s.addEventListener("change", genericCheckbox("smiggins-no-like-grouping"));
    (_t = element.querySelector("#auto-show")) === null || _t === void 0 ? void 0 : _t.addEventListener("change", genericCheckbox("smiggins-auto-show-posts"));
    for (const el of element.querySelectorAll("#font-size-selection > div")) {
        el.addEventListener("click", setFontSize);
    }
}
function p_settingsAccount(element) {
    var _a, _b;
    (_a = element.querySelector("#password-set")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", changePassword);
    (_b = element.querySelector("#delete-acc")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", deleteAccount);
}
function p_settingsKeybinds(element) {
    for (const kb of element.querySelectorAll(".kb-input")) {
        let kbId = kb.dataset.kbId || "";
        if (kbId in keybinds) {
            setKeybindElementData(kbId, kb);
        }
    }
}
function p_settingsIndex(element) {
    var _a;
    (_a = element.querySelector("#export")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", exportSettings);
    let importEl = element.querySelector("#import");
    importEl === null || importEl === void 0 ? void 0 : importEl.addEventListener("input", function (e) {
        let files = importEl.files;
        if (files && files.length) {
            let file = files[0];
            let reader = new FileReader();
            reader.onload = (e) => {
                var _a;
                const file = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                if (typeof file === "string") {
                    importSettings(JSON.parse(file));
                }
            };
            reader.readAsText(file);
        }
    });
}
document.body.dataset.fontSize = localStorage.getItem("smiggins-font-size") || "normal";
document.body.dataset.pfpShape = localStorage.getItem("smiggins-pfp-shape") || "round";
const colorRegex = /^#[0-9a-f]{6}$/;
let followingTimelineOffset = null;
function getUsernameFromPath(path) {
    return (path || location.pathname).toLowerCase().split("/").filter(Boolean)[1];
}
function p_user(element) {
    var _a, _b, _c, _d;
    let userUsername = getUsernameFromPath();
    let tlId = `user_${userUsername}`;
    (_a = element.querySelector("#follow")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", toggleFollow);
    (_b = element.querySelector("#block")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", toggleBlock);
    (_c = element.querySelector("#following-popup")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => (createFollowingModal("following", userUsername)));
    (_d = element.querySelector("#followers-popup")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => (createFollowingModal("followers", userUsername)));
    hookTimeline(element.querySelector("[id=\"timeline-posts\"]"), element.querySelector("#timeline-carousel"), {
        [tlId]: { api: api_TimelineUser, args: [userUsername], prependPosts: username === userUsername },
        [tlId + "+all"]: { api: api_TimelineUser, args: [userUsername, true], prependPosts: username === userUsername }
    }, tlId, element);
}
function userSetDNE() {
    let tlContainer = document.getElementById("timeline-posts");
    if (tlContainer) {
        tlContainer.innerHTML = `<i class="timeline-status">${lr(L.errors.user_dne, { u: escapeHTML(getUsernameFromPath()), })}</i>`;
    }
}
function userUpdateStats(displayName, pronouns, bio, colorOne, colorTwo, following, blocking, numFollowing, numFollowers, numPosts, pinned) {
    var _a;
    let userUsername = getUsernameFromPath();
    let c = userCache[userUsername];
    if (c) {
        c.display_name = displayName;
        c.pronouns = pronouns || null;
        c.bio = bio;
        c.color_one = colorOne;
        c.color_two = colorTwo;
        c.following = following;
        c.blocking = blocking;
        c.num_following = numFollowing;
        c.num_followers = numFollowers;
        c.num_posts = numPosts;
        c.pinned = pinned;
    }
    else {
        c = {
            display_name: displayName || username,
            pronouns: pronouns || null,
            bio: bio,
            color_one: colorOne || "var(--background-mid)",
            color_two: colorTwo || "var(--background-mid)",
            following: following || false,
            blocking: blocking || false,
            num_following: numFollowing || 0,
            num_followers: numFollowers || 0,
            num_posts: numPosts || 0,
            pinned: pinned
        };
        userCache[userUsername] = c;
    }
    if (username !== userUsername) {
        (_a = document.getElementById("user-interactions")) === null || _a === void 0 ? void 0 : _a.removeAttribute("hidden");
        let followElement = document.getElementById("follow");
        let blockElement = document.getElementById("block");
        if (followElement) {
            if (following === "pending") {
                followElement.innerText = L.user.pending;
                followElement.dataset.unfollow = "";
            }
            else if (following) {
                followElement.innerText = L.user.unfollow;
                followElement.dataset.unfollow = "";
            }
            else {
                followElement.innerText = L.user.follow;
                delete followElement.dataset.unfollow;
            }
        }
        if (blockElement) {
            if (blocking) {
                blockElement.innerText = L.user.unblock;
                blockElement.dataset.unblock = "";
            }
            else {
                blockElement.innerText = L.user.block;
                delete blockElement.dataset.unblock;
            }
        }
    }
    let bioElement = document.getElementById("bio");
    if (bioElement) {
        bioElement.innerHTML = linkify(escapeHTML(bio));
        generateInternalLinks(bioElement);
    }
    let notificationString = "";
    if (Object.values(pendingNotifications).some(Boolean)) {
        notificationString = "\u2022 ";
    }
    document.title = `${notificationString}${displayName} - ${pageTitle}`;
    let displayNameElement = document.getElementById("display-name");
    if (displayNameElement) {
        displayNameElement.innerText = displayName;
    }
    let usernameElement = document.getElementById("username");
    if (usernameElement) {
        usernameElement.innerText = "@" + userUsername + (pronouns && " - ") + pronouns;
    }
    let bannerElement = document.getElementById("user-banner");
    if (bannerElement) {
        if (colorRegex.test(colorOne)) {
            bannerElement.style.setProperty("--color-one", colorOne);
        }
        if (colorRegex.test(colorTwo)) {
            bannerElement.style.setProperty("--color-two", colorTwo);
        }
    }
    let pinnedContainer = document.getElementById("user-pinned-container");
    if (pinnedContainer) {
        if (pinned) {
            pinnedContainer.removeAttribute("hidden");
            let pinnedElement = document.getElementById("user-pinned");
            if (pinnedElement && !pinnedElement.querySelector(`[data-post-id="${pinned}"]`)) {
                let postElement = getPost(pinned, false);
                if (userUsername === username) {
                    let pinElement = postElement.querySelector("[data-interaction-pin]");
                    if (pinElement) {
                        delete pinElement.dataset.interactionPin;
                        pinElement.dataset.interactionUnpin = String(pinned);
                        pinElement.innerHTML = icons.unpin + " " + L.post.unpin;
                    }
                }
                pinnedElement.replaceChildren(postElement);
            }
        }
        else {
            pinnedContainer.setAttribute("hidden", "");
        }
    }
    let followingElement = document.getElementById("following");
    let followersElement = document.getElementById("followers");
    let postsElement = document.getElementById("post-count");
    if (followingElement) {
        followingElement.innerText = lr(L.user.following_count, { n: c && floatintToStr(numFollowing) || "0" });
    }
    if (followersElement) {
        followersElement.innerText = lr(L.user.followed_by_count, { n: c && floatintToStr(numFollowers) || "0" });
    }
    if (postsElement) {
        postsElement.innerText = lr(L.user.posts_count, { n: c && floatintToStr(numPosts) || "0" });
    }
}
function updateFollowButton(followed, pending) {
    let followButton = document.getElementById("follow");
    if (!followButton) {
        return;
    }
    let c = userCache[username];
    if (!followed) {
        followButton.innerText = L.user.follow;
        delete followButton.dataset.unfollow;
        if (c) {
            c.following = false;
        }
    }
    else if (pending) {
        followButton.innerText = L.user.pending;
        followButton.dataset.unfollow = "";
        if (c) {
            c.following = "pending";
        }
    }
    else {
        followButton.innerText = L.user.unfollow;
        followButton.dataset.unfollow = "";
        if (c) {
            c.following = true;
        }
    }
}
function updateBlockButton(blocked) {
    let blockButton = document.getElementById("block");
    if (!blockButton) {
        return;
    }
    if (blocked) {
        blockButton.innerText = L.user.unblock;
        blockButton.dataset.unblock = "";
        let followButton = document.getElementById("follow");
        if (followButton && followButton.dataset.unfollow !== undefined) {
            delete followButton.dataset.unfollow;
            followButton.innerText = L.user.follow;
        }
    }
    else {
        blockButton.innerText = L.user.block;
        delete blockButton.dataset.unblock;
    }
}
function toggleFollow(e) {
    let followButton = e.target;
    if (!followButton) {
        return;
    }
    let unfollow = followButton.dataset.unfollow !== undefined;
    new (unfollow ? api_Unfollow : api_Follow)(getUsernameFromPath(), followButton).fetch();
}
function toggleBlock(e) {
    let blockButton = e.target;
    if (!blockButton) {
        return;
    }
    let unblock = blockButton.dataset.unblock !== undefined;
    blockUser(getUsernameFromPath(), !unblock, blockButton);
}
function blockUser(username, toBlock, disable) {
    new (toBlock ? api_Block : api_Unblock)(username, disable).fetch();
}
function hookFollowingTimeline(type, username) {
    var _a;
    let tlElement = document.getElementById("modal-following-timeline");
    if (!tlElement) {
        return;
    }
    followingTimelineOffset = null;
    loadFollowingTimeline(type, username);
    (_a = document.getElementById("modal-timeline-more")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => (loadFollowingTimeline(type, username)));
}
function loadFollowingTimeline(type, username) {
    var _a, _b;
    (_a = document.getElementById("modal-timeline-more")) === null || _a === void 0 ? void 0 : _a.setAttribute("hidden", "");
    (_b = document.getElementById("modal-following-timeline")) === null || _b === void 0 ? void 0 : _b.insertAdjacentHTML("beforeend", `<i class="timeline-status">${L.generic.loading}</i>`);
    new (type === "following" ? api_TimelineUserFollowing : api_TimelineUserFollowers)(followingTimelineOffset, username).fetch();
}
function renderFollowingTimeline(users, end) {
    var _a, _b, _c;
    let el = document.getElementById("modal-following-timeline");
    if (!el) {
        return;
    }
    let frag = document.createDocumentFragment();
    clearTimelineStatuses(el);
    if (followingTimelineOffset === null && users.length === 0) {
        if (el) {
            el.innerHTML = `<i class="timeline-status">${L.generic.none}</i>`;
        }
    }
    for (const u of users) {
        let el = getSnippet("folreq-user", {
            username: u.username,
            banner_one: u.color_one,
            banner_two: u.color_two,
            hidden_if_no_pronouns: u.pronouns ? "" : "hidden",
            bio: [u.bio ? linkify(escapeHTML(u.bio), u.username) : `<i>${L.user.no_bio}</i>`, 1],
            pronouns: [escapeHTML(u.pronouns || ""), 1],
            display_name: [escapeHTML(u.display_name), 1]
        });
        (_a = el.querySelector(".folreq-interactions")) === null || _a === void 0 ? void 0 : _a.remove();
        frag.append(el);
        if (followingTimelineOffset === null || u.id < followingTimelineOffset) {
            followingTimelineOffset = u.id;
        }
    }
    el === null || el === void 0 ? void 0 : el.append(frag);
    if (end) {
        (_b = document.getElementById("modal-timeline-more")) === null || _b === void 0 ? void 0 : _b.setAttribute("hidden", "");
    }
    else {
        (_c = document.getElementById("modal-timeline-more")) === null || _c === void 0 ? void 0 : _c.removeAttribute("hidden");
    }
}

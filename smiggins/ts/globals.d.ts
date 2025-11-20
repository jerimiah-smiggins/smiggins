declare const NOTIFICATION_POLLING_INTERVAL: number;
declare const TL_POLLING_INTERVAL: number;
declare const loggedIn: boolean;
declare const isAdmin: boolean;
declare const username: string;
declare const pageTitle: string;
declare const version: string;
declare let currentPage: intent;
declare let defaultPostPrivate: boolean;
declare const limits: {
  username: number,
  poll_count: number,
  poll_item: number
};

type intent = "index" | "login" | "signup"
            | "logout" | "404" | "404-noauth" | "changelog"
            | "home" | "user" | "hashtag" | "post" | "notifications" | "follow-requests" | "admin"
            | "settings" | "settings/profile" | "settings/cosmetic" | "settings/account" | "settings/keybinds" | "settings/about";

type snippet = "pages/index" | "pages/login" | "pages/signup"
             | "pages/logout" | "pages/404" | "pages/404-noauth" | "pages/changelog"
             | "pages/home" | "pages/user" | "pages/hashtag" | "pages/post" | "pages/notifications" | "pages/follow-requests" | "pages/admin"
             | "pages/settings" | "pages/settings/profile" | "pages/settings/cosmetic" | "pages/settings/account" | "pages/settings/keybinds" | "pages/settings/about"
             | "post" | "post-placeholder" | "toast" | "compose-modal" | "keybind-modal" | "update-modal" | "notification-like" | "folreq-user";

type icons = "back" | "private" | "comment_arrow" | "comment" | "quote" | "like" | "like_active" | "hamburger" | "edit" | "pin" | "unpin" | "delete" | "home_active" | "home" | "notifications_active" | "notifications" | "messages_active" | "messages" | "user_active" | "user" | "settings_active" | "settings" | "folreq" | "folreq_active";

type keybindModifiers = "ctrl" | "shift" | "alt" | "nav";
type themes = "light" | "dark" | "warm" | "gray" | "darker" | "oled" | "system";

type versionData = {
  description: string,
  major_changes?: { icon?: icons, info: string }[],
  changes: string[]
};

type snippetData = {
  content: string,
  variables: (string | [string, number])[],
  processing: string[]
};

type post = {
  id: number,
  content: string,
  content_warning: string | null,
  timestamp: number,
  private: boolean,
  comment: number | null,
  edited: boolean,

  poll: {
    votes: number,
    has_voted: boolean,
    items: {
      content: string,
      percentage: number,
      voted: boolean
    }[]
  } | null,

  interactions: {
    likes: number,
    liked: boolean,
    quotes: number,
    comments: number
  },

  user: {
    username: string,
    display_name: string,
    pronouns: string | null
  },

  quote: {
    id: number,
    content: string,
    content_warning: string | null,
    timestamp: number,
    private: boolean,
    comment: number | null,
    edited: boolean,
    has_poll: boolean,
    has_quote: boolean,

    user: {
      username: string,
      display_name: string,
      pronouns: string | null
    },
  } | false | null
};

type timelineConfig = {
  url: string,
  prependPosts: boolean | number,
  disablePolling?: true,
  disableCaching?: true,
  customRender?: (posts: any[], end: boolean, updateCache: boolean, moreElementOverride?: HTMLElement | null) => void,
  customForward?: (posts: any[], end: boolean, expectedTlID: string, forceEvent: boolean) => void
};

type userData = {
  display_name: string,
  pronouns: string | null,
  bio: string,
  color_one: string,
  color_two: string,
  following: boolean | "pending",
  blocking: boolean,
  num_following: number,
  num_followers: number,
  pinned: number | null
};

type folreqUserData = {
  username: string,
  display_name: string,
  bio: string,
  id: number
};

type timelineCache = {
  upperBound: number | null,
  lowerBound: number | null,
  posts: number[],
  pendingForward: number[] | false,
  end: boolean
};

type replacement = {
  index: number,
  length: number,
  href: string,
  internalIntent?: intent,
  hiddenLink?: true
};

type I = HTMLInputElement;
type D = HTMLDivElement;
type B = HTMLButtonElement;

type el = HTMLElement | null;
type Iel = I | null;
type Del = D | null;
type Bel = B | null;

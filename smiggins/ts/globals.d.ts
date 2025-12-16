declare const NOTIFICATION_POLLING_INTERVAL: number;
declare const TL_POLLING_INTERVAL: number;
declare const IS_IFRAME: boolean;
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
  poll_item: number,
  content_warning: number
};

type intent = "index" | "login" | "signup"
            | "logout" | "404" | "changelog"
            | "message-list" | "message"
            | "home" | "user" | "hashtag" | "post" | "notifications" | "follow-requests" | "admin" | "search"
            | "settings" | "settings/profile" | "settings/cosmetic" | "settings/account" | "settings/keybinds" | "settings/about";

type snippet = "pages/index" | "pages/login" | "pages/signup"
             | "pages/logout" | "pages/404" | "pages/changelog"
             | "pages/message-list" | "pages/message" | "message-list-item"
             | "pages/home" | "pages/user" | "pages/hashtag" | "pages/post" | "pages/notifications" | "pages/follow-requests" | "pages/admin" | "pages/search"
             | "pages/settings" | "pages/settings/profile" | "pages/settings/cosmetic" | "pages/settings/account" | "pages/settings/keybinds" | "pages/settings/about"
             | "post" | "post-placeholder" | "toast" | "notification-like" | "folreq-user"
             | "modal/compose" | "modal/keybind" | "modal/update" | "modal/message" | "modal/following";

type Icons = "back"
           | "private" | "comment_arrow" | "comment" | "quote" | "like" | "like_active" | "hamburger" | "edit" | "pin" | "unpin" | "delete" | "share" | "embed"
           | "home_active" | "home" | "notifications_active" | "notifications" | "messages_active" | "messages" | "user_active" | "user" | "settings_active" | "settings" | "folreq_active" | "folreq" | "login" | "user_plus" | "search" | "plus";

type KeybindModifiers = "ctrl" | "shift" | "alt" | "nav";
type Themes = "light" | "dark" | "warm" | "gray" | "darker" | "oled" | "system";
type Method = "GET" | "POST" | "PATCH" | "DELETE";

type VersionData = {
  description: string,
  major_changes?: { icon?: Icons, info: string }[],
  changes: string[]
};

type SnippetData = {
  content: string,
  variables: (string | [string, number])[],
  processing: string[]
};

type Post = {
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
    pronouns: string | null,
    banner: [string, string]
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
      pronouns: string | null,
      banner: [string, string]
    },
  } | false | null
};

type MessageList = {
  group_id: number,
  timestamp: number,
  unread: boolean,
  recent_content: string | null,

  members: {
    count: number,
    names: string[]
  }
};

type Message = {
  timestamp: number,
  content: string,
  username: string,
  display_name: string
}

type TimelineConfig = {
  api: new (offset: number | null, forwards: boolean | "force", ...args: any) => _api_Base,
  args?: any[],
  // url: string,
  prependPosts: boolean | number,
  disablePolling?: true,
  disableCaching?: true,
  invertOffset?: true,
  customRender?: (posts: any[], end: boolean, updateCache: boolean, moreElementOverride?: HTMLElement | null) => void,
  customForward?: (posts: any[], end: boolean, expectedTlID: string, forceEvent: boolean) => void
};

type UserData = {
  display_name: string,
  pronouns: string | null,
  bio: string,
  color_one: string,
  color_two: string,
  following: boolean | "pending",
  blocking: boolean,
  num_following: number,
  num_followers: number,
  num_posts: number,
  pinned: number | null
};

type FollowRequestUserData = {
  username: string,
  pronouns: string | null,
  color_one: string,
  color_two: string,
  display_name: string,
  bio: string,
  id: number
};

type TimelineCache = {
  upperBound: number | null,
  lowerBound: number | null,
  posts: number[],
  pendingForward: number[] | false,
  end: boolean
};

type Replacement = {
  index: number,
  length: number,
  href: string,
  internalIntent?: intent,
  hiddenLink?: true
};

type SettingsExport = {
  autoShowPosts: boolean,
  complexTimestamps: boolean,
  cwCascading: string,
  expandCws: boolean,
  fontSize: string,
  hideChangelog: boolean,
  hideInteractions: boolean,
  noLikeGrouping: boolean,
  pfpShape: string,
  theme: Themes,

  homeTimeline: {
    comments: boolean,
    default: string
  },

  keybinds: {
    hamburgerDelete: string,
    hamburgerEdit: string,
    hamburgerEmbed: string,
    hamburgerPin: string,
    hamburgerShare: string,
    loadNewPosts: string,
    navAdmin: string,
    navHome: string,
    navModifier: string,
    navNotifications: string,
    navProfile: string,
    navSettings: string,
    newPost: string,
    topOfTimeline: string
  }
};

type I = HTMLInputElement;
type D = HTMLDivElement;
type B = HTMLButtonElement;

type el = HTMLElement | null;
type Iel = I | null;
type Del = D | null;
type Bel = B | null;

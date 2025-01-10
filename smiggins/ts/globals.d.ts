// Configuration options
declare const MAX_POST_LENGTH: number;
declare const MAX_POLL_OPTION_LENGTH: number;
declare const MAX_POLL_OPTIONS: number;
declare const MAX_CONTENT_WARNING_LENGTH: number;

declare const ENABLE_USER_BIOS: boolean;
declare const ENABLE_PRONOUNS: boolean;
declare const ENABLE_GRADIENT_BANNERS: boolean;
declare const ENABLE_BADGES: boolean;
declare const ENABLE_PRIVATE_MESSAGES: boolean;
declare const ENABLE_QUOTES: boolean;
declare const ENABLE_POST_DELETION: boolean;
declare const ENABLE_PINNED_POSTS: boolean;
declare const ENABLE_ACCOUNT_SWITCHER: boolean;
declare const ENABLE_POLLS: boolean;
declare const ENABLE_CONTENT_WARNINGS: boolean;
declare const ENABLE_EMAIL: boolean;
declare const ENABLE_DYNAMIC_FAVICON: boolean;
declare const ENABLE_NEW_ACCOUNTS: boolean | "otp";

declare const isAdmin: boolean;

declare const defaultPrivate: boolean;
declare const muted: [string, number][] | null;
declare const linkify;

// Global variables
declare const lang: { [key: string]: any };
declare const badges: { [key: string]: string } | undefined;
declare function linkifyHtml(text: string, settings: object): string;

// Types
type _postJSON = {
  creator: {
    badges: string[],
    color_one: string,
    color_two: string,
    display_name: string,
    gradient_banner: boolean
    pronouns: string,
    username: string,
  },

  private: boolean,
  can_delete: boolean,
  can_pin?: boolean,
  can_edit: boolean,
  can_view: boolean,
  comments: number,
  content: string,
  liked: boolean,
  likes: number,
  owner: boolean,
  parent_is_comment: boolean,
  parent: number,
  post_id: number,
  quote?: _postJSON,
  quotes: number,
  c_warning: string | null,
  timestamp: number,
  logged_in: boolean,
  edited: boolean,
  edited_at?: number,

  poll?: _pollJSON,

  // Quote-specific
  blocked?: boolean,
  deleted?: boolean,
  comment?: boolean,
  has_quote?: boolean,
  blocked_by_self?: boolean
};

type _pollJSON = {
  votes: number,
  voted: boolean,
  content: {
    value: string,
    votes: number,
    voted: boolean
  }[],
};

type _themeObject = {
  name: {
    default: string,
    [key: string]: string | null
  },
  id: string,
  light_theme: boolean,
  colors: {
    text: string,
    subtext: string,
    red: string,
    background: string,
    post_background: string,
    poll_voted_background: string,
    poll_no_vote_background: string,
    content_warning_background: string,
    input_background: string,
    checkbox_background: string,
    button_background: string,
    button_hover_background: string,
    button_inverted_background: string,
    input_border: string,
    checkbox_border: string,
    button_border: string,
    table_border: string,
    modal_backdrop: string,
    modal_background: string,
    modal_border: string,
    gray: string,
    accent: {
      rosewater: string,
      flamingo: string,
      pink: string,
      mauve: string,
      red: string,
      maroon: string,
      peach: string,
      yellow: string,
      green: string,
      teal: string,
      sky: string,
      sapphire: string,
      blue: string,
      lavender: string
    }
  }
};

type _actions = {
  success: boolean,
  message?: string | null,
  actions?: ({
    name: "populate_timeline",
    end: boolean,
    extra?: {
      type: "user",
      pinned: _postJSON | null,
      bio: string,
      followers: number,
      following: number
    },
    posts: _postJSON[]
  } | {
    name: "prepend_timeline",
    post: _postJSON,
    comment: boolean
  } | {
    name: "remove_from_timeline",
    post_id: number,
    comment: boolean
  } | {
    name: "reset_post_html",
    post_id: number,
    comment: boolean,
    post: _postJSON
  } | {
    name: "refresh_notifications"
  } | {
    name: "refresh_timeline",
    url_includes?: string[],
    special?: "notifications" | "pending" | "message" | null
  } | {
    name: "user_timeline",
    users: {
      username: string,
      display_name: string,
      badges: string[],
      color_one: string,
      color_two: string,
      gradient_banner: boolean,
      bio: string,
      timestamp?: number,
      unread?: boolean
    }[],
    more: boolean
    special?: "pending" | "messages" | null
  } | {
    name: "notification_list",
    notifications: {
      data: _postJSON,
      read: boolean,
      event_type: string
    }[],
  } | {
    name: "admin_info",
    username: string,
    user_id: number,
    bio: string,
    displ_name: string,
    token?: string | null
  } | {
    name: "admin_log",
    content: {
      type: string,
      by: string,
      target: string | null,
      info: string,
      timestamp: number
    }[]
  } | {
    name: "message_list",
    messages: {
      content: string,
      from_self: boolean,
      id: number,
      timestamp: number
    }[],
    more: boolean,
    forward: boolean
  } | {
    name: "set_auth",
    token: string
  } | {
    name: "localstorage",
    key: string,
    value: any
  } | {
    name: "reload"
  } | {
    name: "redirect",
    to: "message" | "home" | "logout",
    extra?: string
  } | {
    name: "set_theme",
    auto: boolean,
    theme: _themeObject | null
  } | {
    name: "update_element",
    query: string, // ex: "#posts" for the posts container
    all?: boolean, // Whether or not to use querySelectorAll instead of querySelector
    inc?: number, // Increments the innerHTML as if it's a number
    text?: string, // sets innerText
    html?: string, // sets innerHTML
    value?: string, // For inputs
    focus?: any,
    checked?: boolean, // For checkbox inputs
    disabled?: boolean,
    attribute?: { name: string, value: string | null }[],
    set_class?: { class_name: string, enable: boolean }[]
  } | {
    name: "refresh_poll",
    poll: _pollJSON | null,
    post_id: number
  })[]
};

type _keybind = {
  action: (event: KeyboardEvent) => void,
  requireNav?: boolean,
  requireCtrl?: boolean,
  allowInputs?: boolean,
  allowLoggedOut?: boolean,
  noPreventDefault?: boolean
};

declare const conf: {
  max_post_length: number,
  max_poll_option_length: number,
  max_poll_options: number,
  max_content_warning_length: number,
  max_bio_length: number,
  max_username_length: number,
  max_muted_words: number,
  max_muted_word_length: number,
  max_display_name_length: number,
  user_bios: boolean,
  pronouns: boolean,
  gradient_banners: boolean,
  badges: boolean,
  private_messages: boolean,
  quotes: boolean,
  post_deletion: boolean,
  pinned_posts: boolean,
  account_switcher: boolean,
  polls: boolean,
  content_warnings: boolean,
  email: boolean,
  dynamic_favicon: boolean,
  new_accounts: boolean | "otp",
  hashtags: boolean,
  site_name: string,
  version: string
};

declare const username: string | null;
declare const isAdmin: boolean;
declare const loggedIn: boolean;
declare let defaultPrivate: boolean;

declare const linkify;

// Global variables
declare function linkifyHtml(text: string, settings: object): string;

// Types
type _anyDict = { [key: string]: any };

type _postJSON = {
  visible: false,
  reason: "private" | "blocked" | "blocking",
  post_id: number,
  comment: boolean
} | {
  visible: true,
  post_id: number,

  comment: boolean,
  parent: {
    id: number | null,
    comment: boolean
  } | null,

  private: boolean,
  content_warning: string | null,
  content: string,
  timestamp: number,
  poll: _pollJSON | null,
  edited: number | null,

  quote: _postJSON | true | null,  

  interactions: {
    likes: number,
    liked: boolean,
    comments: number,
    quotes: number
  },

  can: {
    delete: boolean,
    pin: boolean,
    edit: boolean
  },

  creator: {
    display_name: string,
    username: string,
    badges: string[],
    pronouns: string,
    color_one: string,
    color_two: string,
    gradient: boolean
  }
}

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
    special?: "pending" | "messages" | "following" | "followers" | "blocking" | null
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

type _context = {
  page: string,
  strings: [string | null, string | null, string | null, number],
  share?: string,
  [key: string]: any
};

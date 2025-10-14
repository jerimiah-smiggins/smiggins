declare const loggedIn: boolean;
declare const isAdmin: boolean;
declare const username: string;
declare const pageTitle: string;
declare let currentPage: intent;
declare let defaultPostPrivate: boolean;
declare const limits: {
  username: number,
  post: number,
  cw: number
};

type intent = "index" | "login" | "signup"
            | "logout" | "404"
            | "home" | "user" | "hashtag" | "post" | "notifications"
            | "settings" | "settings/profile" | "settings/cosmetic" | "settings/account" | "settings/about";

type snippet = "pages/index" | "pages/login" | "pages/signup"
             | "pages/logout" | "pages/404"
             | "pages/home" | "pages/user" | "pages/hashtag" | "pages/post" | "pages/notifications"
             | "pages/settings" | "pages/settings/profile" | "pages/settings/cosmetic" | "pages/settings/account" | "pages/settings/about"
             | "post" | "post-placeholder" | "toast" | "compose-modal";

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

  interactions: {
    likes: number,
    liked: boolean,
    quotes: number,
    comments: number
  },

  user: {
    username: string,
    display_name: string
  },

  quote: {
    id: number,
    content: string,
    content_warning: string | null,
    timestamp: number,
    private: boolean,

    user: {
      username: string,
      display_name: string
    },
  } | undefined | null
};

type timelineConfig = {
  url: string,
  prependPosts: boolean | number,
  disablePolling?: true,
  disableCaching?: true
};

type userData = {
  display_name: string,
  bio: string,
  color_one: string,
  color_two: string,
  following: boolean | "pending",
  blocking: boolean,
  num_following: number,
  num_followers: number
}

type timelineCache = {
  upperBound: number | null,
  lowerBound: number | null,
  posts: number[],
  pendingForward: number[] | false,
  end: boolean
}

type replacement = {
  index: number,
  length: number,
  href: string,
  internalIntent?: intent,
  hiddenLink?: true
}

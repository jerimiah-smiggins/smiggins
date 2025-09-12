declare const loggedIn: boolean;
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
            | "home" | "user" | "hashtag" | "post"
            | "settings" | "settings/profile" | "settings/cosmetic" | "settings/account" | "settings/about";

type snippet = "pages/index" | "pages/login" | "pages/signup"
             | "pages/logout" | "pages/404"
             | "pages/home" | "pages/user" | "pages/hashtag" | "pages/post"
             | "pages/settings" | "pages/settings/profile" | "pages/settings/cosmetic" | "pages/settings/account" | "pages/settings/about"
             | "post" | "toast" | "compose-modal";

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

  interactions: {
    likes: number,
    liked: boolean,
    quotes: number,
    comments: number
  },

  user: {
    username: string,
    display_name: string
  }
};

type timelineConfig = {
  url: string,
  prependPosts: boolean,
  timelineCallback?: (json: api_timeline) => void,
  disablePolling?: true
};

type userData = {
  display_name: string,
  bio: string,
  color_one: string,
  color_two: string,
  following: boolean,
  blocking: boolean,
  num_following: number,
  num_followers: number
}

type timelineCache = {
  timestamp: number,
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

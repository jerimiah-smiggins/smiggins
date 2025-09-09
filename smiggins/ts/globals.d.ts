declare const loggedIn: boolean;
declare const username: string;
declare const pageTitle: string;
declare let currentPage: intent;
declare const limits: {
  username: number,
  post: number,
  cw: number
};

type intent = "index" | "login" | "signup"
            | "logout" | "404"
            | "home" | "user" | "hashtag" | "post"
            | "settings" | "settings/profile" | "settings/cosmetic" | "settings/account";

type snippet = "pages/index" | "pages/login" | "pages/signup"
             | "pages/logout" | "pages/404"
             | "pages/home" | "pages/user" | "pages/hashtag" | "pages/post"
             | "pages/settings" | "pages/settings/profile" | "pages/settings/cosmetic" | "pages/settings/account"
             | "post" | "toast";

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

type replacement = {
  index: number,
  length: number,
  href: string,
  internalIntent?: intent,
  hiddenLink?: true
}

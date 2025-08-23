declare const loggedIn: boolean;
declare const username: string;
declare let currentPage: intent;

type intent = "index" | "login" | "signup" | "logout" | "404" | "home" | "settings"
type snippet = "pages/index" | "pages/login" | "pages/signup" | "pages/logout" | "pages/404" | "pages/home" | "pages/settings" | "post" | "toast"

type snippetData = {
  content: string,
  variables: string[],
  processing: string[]
};

type post = {
  id: number,
  content: string,
  content_warning: string | null,
  timestamp: number,
  private: boolean,

  user: {
    username: string,
    display_name: string
  }
};

type timelineConfig = {
  url: string,
  prependPosts: boolean,
  timelineCallback?: (json: api_timeline) => void
};

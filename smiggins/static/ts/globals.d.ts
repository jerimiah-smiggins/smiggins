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

declare const defaultPrivate: boolean;

// Global variables
declare const lang: { [key: string]: any };
declare const badges: { [key: string]: string };
declare const linkifyHtml: CallableFunction;

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

  poll: {
    votes: number,
    voted: boolean,
    content: {
      value: string,
      votes: number,
      voted: boolean
    }[],
  } | boolean | null,

  // Quote-specific
  blocked?: boolean,
  deleted?: boolean,
  comment?: boolean,
  has_quote?: boolean,
  blocked_by_self?: boolean
};

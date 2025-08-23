type apiErrors = "BAD_USERNAME" | "USERNAME_USED" | "BAD_PASSWORD" | "RATELIMIT" | "INVALID_OTP" | "NOT_AUTHENTICATED" | "POLL_SINGLE_OPTION";

type GENERIC_API_FAILURE = {
  success: false,
  reason?: apiErrors
};

type api_login = {
  success: true,
  token: string
} | GENERIC_API_FAILURE;

type api_timeline = {
  success: true,
  posts: post[],
  end: boolean,
  extraData?: { [key: string]: any }
} | GENERIC_API_FAILURE;

type api_post = {
  success: true,
  post: post
} | GENERIC_API_FAILURE;

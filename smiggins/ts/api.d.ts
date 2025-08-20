type GENERIC_API_FAILURE = {
  success: false,
  reason?: "BAD_USERNAME" | "USERNAME_USED" | "BAD_PASSWORD" | "RATELIMIT" | "INVALID_OTP" | "NOT_AUTHENTICATED"
};

type api_login = {
  success: true,
  token: string
} | GENERIC_API_FAILURE;

type api_signup = api_login;

type api_timeline = {
  success: true,
  posts: post[],
  end: boolean,
  extraData?: { [key: string]: any }
} | GENERIC_API_FAILURE;

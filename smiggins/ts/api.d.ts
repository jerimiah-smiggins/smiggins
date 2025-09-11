type apiErrors = "BAD_USERNAME" | "USERNAME_USED" | "BAD_PASSWORD" | "RATELIMIT" | "INVALID_OTP" | "NOT_AUTHENTICATED" | "POLL_SINGLE_OPTION" | "CANT_INTERACT" | "BLOCKING";

type GENERIC_API_FAILURE = { success: false, reason?: apiErrors };
type GENERIC_API_RESPONSE = { success: true } | GENERIC_API_FAILURE;

type api_token = { success: true, token: string } | GENERIC_API_FAILURE;
type api_post = { success: true, post: post } | GENERIC_API_FAILURE;
type api_follow_add = { success: true, pending: boolean } | GENERIC_API_FAILURE;

type api_timeline = {
  success: true,
  posts: post[],
  end: boolean,
  extraData?: { [key: string]: any }
} | GENERIC_API_FAILURE;

type api_profile = {
  success: true,
  display_name: string,
  bio: string,
  gradient: boolean,
  color_one: string,
  color_two: string
} | GENERIC_API_FAILURE;

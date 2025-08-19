type GENERIC_API_FAILURE = {
  success: false,
  reason?: "BAD_USERNAME" | "USERNAME_USED" | "BAD_PASSWORD" | "RATELIMIT" | "INVALID_OTP"
};

type api_login = {
  success: true,
  token: string
} | GENERIC_API_FAILURE;

type api_signup = api_login;

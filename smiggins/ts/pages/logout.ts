function p_logout(element: D): void {
  document.cookie = "token=;Path=/;Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  location.href = "/";
}

declare const loggedIn: boolean;
declare let currentPage: intent;

type intent = "index" | "login" | "signup" | "logout" | "404" | "home"
type snippet = intent | "post" | "toast"

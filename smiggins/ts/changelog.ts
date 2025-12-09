const changes: { [key: string]: VersionData } = {
  "1.1.0": {
    description: "Changelog page and bug fixes",
    major_changes: [{
      info: "Added a page that shows changes from previous versions. You're looking at it now!",
      icon: "quote"
    }],
    changes: [
      "Added the changelogs page",
      "Fixed a bug that occasionally caused the username on user pages to temporairily show the username along with \"null\"",
      "Fixed escaping the backtick (<code>`</code>) character in certain circumstances",
      "Fixed a bug that caused some numbers (ex. 12.3) to be treated as links",
      "Added indicators for quotes that are quoting a post with a poll or another quote",
      "The timeline selection (global/following) on the home timeline is saved across sessions",
      "Added backend configuration for the frequency of frontend polling requests (timelines, notifications)"
    ]
  },
  "1.1.1": {
    description: "Banner PFPs and bug fixes",
    changes: [
      "User sections on posts now have a little \"profile picture\" using banner colors",
      "Fixed line wrapping for long words in most places",
      "Fixed a bug with links in numbers",
      "Fixed a bug that caused the \"Includes a quote\" text to show up when it shouldn't"
    ]
  },
  "1.1.2": {
    description: "Bug fixes and small improvements",
    changes: [
      "The changelog page loads properly again",
      "Added an option that lets you change the shape of the banner icons, or disable them all together",
      "Added an option that configures how content warnings are cascaded",
      "Added a versioning system to APIs to prevent an outdated client from interpreting data as garbage",
      "Added a post counter to profiles",
      "Added a share button on posts",
      "Clicking the \"<i>Includes a poll/quote</i>\" on quotes brings you to the quote"
    ]
  },
  "1.2.0": {
    description: "Logged out content and embeds",
    major_changes: [{
      info: "People who aren't logged in can view users and posts! This helps with ease of use for people who aren't sure if they want to make an account.",
      icon: "user"
    }],
    changes: [
      "People who aren't logged in can view users and post pages",
      "Data is now embedded into the base document for embeds on other platforms, ex. discord",
      "Like notifications now have a timestamp attached to them"
    ]
  },
  "1.3.0": {
    description: "Searching",
    major_changes: [{
      info: "You can now search for posts! There are seveal search filters that can be used, like whether or not it has a poll, or who created it.",
      icon: "search"
    }],
    changes: [
      "Added a search page",
      "The navbar on mobile has been rearranged to be less cluttered",
      "Fixed pagination for the \"oldest\" timeline on hashtags and comments"
    ]
  },
  "1.3.1": {
    description: "More secure password storage and IFrame support",
    major_changes: [{
      info: "You can now embed posts on other websites! By using an IFrame, you can make any post be visible on any of your websites.",
      icon: "embed"
    }],
    changes: [
      "Added IFrame support",
      "Password storage is more secure. This however does require everyone to log in again",
      "Added a backend setting to disable the <a href=\"/settings/about/\" data-internal-link=\"settings/about\">about page</a>",
      "Added a configuration to disable changelog popups",
      "Like notifications get grouped more often"
    ]
  },
  "1.3.2": {
    description: "Post interaction keybinds",
    changes: [
      "Added configurable keybinds for the options in hamburger menus on posts",
      "Added an import/export function for settings",
      "Added simple ratelimiting to api requests"
    ]
  }
};

const changes: { [key: string]: versionData } = {
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
      "Added a versioning system to APIs to prevent an outdated client from interpreting data as garbage",
      "Added a post counter to profiles",
      "Added a share button on posts",
      "Clicking the \"<i>Includes a poll/quote</i>\" on quotes brings you to the quote"
    ]
  }
};

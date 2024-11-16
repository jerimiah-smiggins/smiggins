## v0.13.5
1. Added a custom modal when leaving the settings page with unsaved changes
2. Added a way to delete your own account
3. Changed content warning previews
4. Commenting on posts now gives notifications properly again
5. Fixed a bug that caused banners to never be gradient on profiles
6. Moved changelogs from langs to a dedicated markdown file from langs
## v0.13.4
1. Rewrote the database structure
2. Rewrote how (almost all) api endpoints return data
3. Added a backend setting to disable dynamic favicons
4. You can now pin anyone's post to your profile, not just your own
5. Hashtags now get updated properly when editing a post
6. Mentions get automatically filled in when replying to a post
## v0.13.3
1. Embedded all javascript/css into the html files, should make webpages load faster
2. Rewrote css in less
3. Added support for opacity and accent colors in themes
4. Fixed a bug that caused editing posts to be completely broken
5. Fixed a bug with setting your email
6. Added an edited at timestamp that gets shown when you hover over the edit icon
## v0.13.2
1. Fixed links in /u/.../lists pages
2. Added links in admin logs on the by/for section
3. Fixed themes in emails
## v0.13.1
1. Made /api/docs slightly better
2. Content warnings now cover polls again, however quotes are no longer covered by content warnings
3. Added a way to add new custom themes in the backend configuration
4. Added two new default themes
## v0.13.0
1. Fixed a bug that caused content warnings to not be properly escaped
2. Added editing posts
3. Moved the delete and pin/unpin buttons to a menu
4. Rewrote the entire admin system
5. Added a system theme that's based on the device's preferred color scheme
6. Fixed the extended_isinstance function on python 3.11+
7. Moved the admin log to the database
## v0.12.4
1. Fixed an exploit that allowed anyone to inject arbitrary code into post pages
## v0.12.3
1. Made the website more accessible to screen readers
2. Added an easy way to overwrite static files for your instance
3. Added more caching
4. Added keyboard navigation for the share button and polls
5. Removed an extra hyphen on /u/.../lists/ pages
6. Decreased the resolution (and filesize) of the new favicons
## v0.12.2
1. Fixed a bug that prevented you from being able to comment on posts
## v0.12.1
1. When logged out, the user's preferred color scheme is respected
2. Fixed a bug that caused the user timeline to error when logged out
3. Made the quote number update immediately when quoting a post
## v0.12.0
1. Added an option to approve new followers
2. Expanded what blocking someone prevents you or them from doing
3. Added an option to make a post be followers-only. This replaces private accounts
4. Sitemaps no longer show private posts
5. Added a 'No Styles' setting which disables all CSS and slightly modifies page layout
6. Added a new favicon and variations for all color combinations, and a frontend setting to use the old one
7. Added an optional discord link in backend settings
## v0.11.0
1. Added changelogs for all legacy versions
2. Fixed an issue that caused read notifications/messages to not be colored gray
3. Added linking emails and resetting passwords with the emails
4. Added sitemaps and their respective toggles
5. Added a setting to change positioning of the icon bar
6. Rewrote the credits page
## v0.10.1
1. Added a credits page (and a backend toggle)
2. Deleting a post deletes any notifications caused by said post to prevent certain issues
3. Pinging someone from a quote now works properly
4. Creating a quote no longer reloads the timeline
5. Tweaks to frontend account management
6. Added an option backend to set the default global theme
7. Added optional content warnings for posts
8. Completely rewrote how backend settings are managed
9. Added a 'View poll results' button on polls you haven't yet voted on
10. Rewrote CSS using the nesting feature
## v0.10.0
1. Reverted tweaks to post box heights from v0.7.3
2. Added polls
3. Fixed a bug that caused some errors not appearing when quoting a post
4. Added an option to the backend to automatically post to webhooks for a specified user
5. Added several options to the backend to disable features such as the changelog and contact pages, pinned posts, the account switcher, polls, viewing content while logged out, and creating new accounts
## v0.9.3
1. Rewrote frontend with typescript
2. Completely remade how changelogs are stored
3. Fixed a bug that made you not be able to view certain pages while logged out
## v0.9.2
1. Added changelogs page
2. Added option backend to disallow scraping
3. Added an animation when liking a post
4. Added buttons to pages that previously didn't have them, like on the 404 page
5. Added links to the changelog and contact pages in settings
## v0.9.1
1. Added an option to cache languages
2. Badge names can now use the letter "w"
3. The server no longer errors when trying to log in to an account that doesn't exist
4. The maxlength parameter is properly set on the username section on sign up and log in pages
5. Updates to the Esperanto language
6. Buttons on posts on the notifications page function properly
7. Removed exclamation marks on 404 pages
## v0.9.0
1. Added support for multiple languages (currently there's only English US/UK and Esperanto created by Subroutine)
2. Fixed a bug with quotes
3. Other minor bugfixes
## v0.8.6
1. Added a fake profile picture next to your name. This is based off of your banner color
## v0.8.5
1. Added hashtags
## v0.8.4
1. Fixed an issue with the "hitboxes" of certain links on user pages
2. Added a lot of feature disabling options in the backend settings config
## v0.8.3
1. Clicking the refresh button quickly no longer loads duplicate posts
2. Max line limit on quotes is smaller
3. Added unsaved changes alert to settings page
4. Added text to title to signify unread notifications
5. Added badges to private messages
## v0.8.2
1. Fixed an issue with the text color of timestamps on message pages
## v0.8.1
1. The lock icon on private accounts on /u/... pages is properly styled
2. @ mentions in messages no longer break everything
3. The link color in messages you send has been changed to make them visible
## v0.8.0
1. Added private messages
## v0.7.4
1. You can now pin one of your posts to your profile. This makes it show up before all of your other posts
2. The delete and unpin buttons are both colored red by default. In the future, there may be a setting to disable this
## v0.7.3
1. You can change your password
2. Links on posts now open in new tab
3. Tweaks to post box heights
4. Changed the placeholder text on post boxes
5. Remade the top section of the post that has user info
6. Made quote and like buttons not work when logged out
## v0.7.2
1. Added an extra parameter to urls to hopefully prevent any unwanted caching between versions
## v0.7.1
1. Fixed the description on embeds for user profiles and added follower counts to it too
## v0.7.0
1. Added notifications. These are triggered when you @ someone, when you comment on someone else's post, or when you quote someone else's post
2. You can view the post that a comment was commented on now via the link
3. Pressing enter on the log in and sign up pages submits the form now
## v0.6.8
1. Administrative actions now get logged
2. The save button in settings stands out more
3. Post stats are now shown in embeds
4. Delete buttons now show on focused posts
## v0.6.7
1. Added pronouns
2. Renamed all themes
3. Added a new theme with a black base instead of a dark blueish color
## v0.6.6
1. Fixed a small oversight with blocking that still showed quoted posts from blocked accounts
## v0.6.5
1. Blocking accounts
2. Slight modification to post input boxes
3. Delete button on smaller screens should no longer wrap to the next line
## v0.6.4
1. Added caching for getting post lists to improve performance
## v0.6.3
1. You can now view who someone follows and who follows them by clicking on the followers/following text on their profile
## v0.6.2
1. Sending a request to create a badge that already exists now updates the svg content instead of 400-ing
## v0.6.1
1. Creating/deleting badges no longer requires a server restart to update frontend
## v0.6.0
1. Added account switcher
2. Added badges
3. Added post deletion
4. Added an admin page
5. Revamped the settings page
6. Bug fixes
## v0.5.2
1. Added user bios
2. Changed a couple variable and function names in the backend
## v0.5.1
1. Made the input box for posting/commenting/quoting a lot better to work with
## v0.5.0
1. Added quoting posts
## v0.4.3
1. Added documentation to the whole backend
2. Some small error handling changes
## v0.4.2
1. Private accounts now function properly
2. A lot of backend changes
3. Some small bugs have been fixed
## v0.4.1
1. Added gradient banners!
2. Added a shadow behind usernames in profiles
3. A couple of bugfixes
## v0.4.0
1. Switched to an actual database
2. Added an admin page
3. Added a confirm password box on the sign up page
4. Random like counts on the settings page can no longer be zero
5. The share button now has the correct cursor
6. Added a border radius to posts in the settings page
7. Quotation marks no longer show as `&amp;quo;` on posts
8. Added links to the home page on 404/500 pages
9. The recent tab is now the default tab for the home timeline
10. Removed the add/remove follower input
11. Remade all themes using the catppuccin color scheme
12. Comments that have an id more than the most recent post can now load
13. Added a width limit to private text info on the settings page
14. The robots.txt file is now treated as plain text instead of html
15. Links and pings can no longer conflict
16. Static files are now served from /static/... by default
17. Banners are now shown at 100% opacity
## v0.3.8
1. Added a profile button on the sidebar
## v0.3.7
1. Added themes
## v0.3.6
1. Added a share button on some pages
2. Changed how icons are displayed
3. Posts now have a maximum line count on timelines
## v0.3.5
1. Allows viewing user pages and posts when logged out
2. Added embeds for users and posts
3. Fonts work properly again
## v0.3.4
1. Fixed a bug that caused the following count to include yourself
2. Added settings to modify post/username/display name length, ratelimit timings, source code links, and posts per request
## v0.3.3
1. Added follower/following counts to user pages
## v0.3.2
1. Added private accounts
2. Fonts no longer rely on Google Fonts
3. Max display name length increased to 32 from 20
4. Likes get properly filled in on user pages
## v0.3.1
1. Added @ mentions
2. Fixed issues with loading a post causing a duplicate
## v0.3.0
1. Added replies
2. Extracted the backend into several files instead of one large file
## v0.2.0
1. Added liking posts
## v0.1.1
1. Fixed a couple bugs relating to escaping html
## v0.1.0
1. Improved link detection
2. Made banner color update when refreshing posts on a user profile
## v0.0.10
1. Improved link detection
2. Improved security in the backend
3. Added ratelimiting
## v0.0.9
1. Added profile banner color configuration
2. Links in posts now turn into real links
## v0.0.8
1. Added display names
2. Added robots.txt file
## v0.0.7
1. Added post pages
## v0.0.6
1. Added recent tab
## v0.0.5
1. Added settings page
2. Added light theme
## v0.0.4
1. Added user pages
2. Added icons (home and settings, with settings currently not working)
## v0.0.3
1. Rewrote data structure
2. Added following and unfollowing without needing to manually edit the storage
## v0.0.2
1. Added creating posts
2. Added a following timeline (currently only shows your own posts unless you manually follow someone else)
## v0.0.1
1. Added account signup/login pages
2. Added 404 and 500 pages

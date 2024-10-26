## How to help with translation
If you want to help translate into languages that don't yet exist:
1. Find out the language code that you want to translate it into. Use
[this table](http://www.lingoes.net/en/translator/langcode.htm) to help find it.
2. Make a new file with the name in the format `{{ LANG_CODE }}.json`. If the
translation needs to remake the entire website, then you can use the `en-US`
file as a template. If you are only making a dialect or something of another
language (for example making a canadian french translation when a french one
already exists), then you don't need to do that, instead using the fallback
feature and only defining the words that need changing
3. Set the meta area:
   - `fallback`: This is where you define which languages it should use in case
there's some text that hasn't been translated yet. If you are making a new one
that doesn't have any existing fallbacks that would make sense, set it to
`en-US` because that is the one that will be always updated. Multiple fallbacks
may be specified. (Make sure each one is in quotes)
   - `name`: The name of the language. This should use the name of the language
in the language itself, with a region in parenthesis. For example, canadian
french would be Français (Canadien)
   - `version`: The latest version of the language spec that the specified
language was created for. This should be used to indicate which translations,
if any, need to be updated. The updates for each version are listed at the
bottom of this document.
   - `maintainers`: The github usernames of the maintainers of the language. If
the language needs to be updated, these are the people to do so. If you are
willing to, you can put your github username there. Make sure each username is
in quotation marks
   - `past_maintainers`: The github usernames of any past maintainers of the
language. You can put your username here if you don't want to continue
maintaining a language.
4. Start translating. Go through the file and add any translations needed. Note
that for the colors (like rosewater), you can just describe them (like "dull
pink" or "yellowish orange"). If you have any questions, feel free to ask about
it in [the discord server](https://discord.gg/tH7QnHApwu). Note that
**translating the changelogs is OPTIONAL.** You should do the title, however
other than that, the rest of the changelogs don't need to be done for a language
to be considered complete.
5. When you're done, fork the git repository, add the file, and make a pull
request **to the `dev` branch**. Your changes will likely be added to production
by the next update.

If you want to fix translations or update an existing translation:
1. Fork the repository
2. Make any changes
3. If you want to become a maintainer of that language, add your github username
to the `maintainers` section
4. Make a pull request **to the `dev` branch**

---
## Version changes
Updates for each language version are listed below:

<details>
<summary>v1.8.3</summary>
embedding into html and theme update

```diff
+ changelog.changes.v0.13.3 {1, 2, 3}
```
</details>

<details>
<summary>v1.8.2</summary>
email theme fix

```diff
+ changelog.changes.v0.13.2 {1, 2, 3}
```
</details>

<details>
<summary>v1.8.1</summary>
custom themes

```diff
+ settings.cosmetic_themes.warm
+ settings.cosmetic_themes.purple
+ changelog.changes.v0.13.1 {1, 2, 3, 4}
# Fix spelling
post.comment_id_does_not_exist
post.invalid_username
settings.cosmetic_theme_invalid
```
</details>

<details>
<summary>v1.8.0</summary>
admin rewrite

```diff
- admin.level
- settings.cosmetic_no_css
- settings.cosmetic_no_css_warning
+ admin.permissions.title
+ admin.permissions.error
+ admin.permissions.invalid
+ admin.permissions.label
+ admin.permissions.set
+ admin.permissions.load
+ admin.permissions.descriptions {0, 1, 2, 3, 4, 5, 6, 7, 8}
+ admin.permissions.descriptions_extra {5, 6, 7}
+ admin.logs.who_format
+ admin.logs.who_format_single
+ post.more
+ post.edit
+ settings.cosmetic_themes.auto
+ changelogs.changes.v0.13.0 {1, 2, 3, 4, 5, 6, 7}
admin.post_deletion_title -> admin.post_deletion.title
admin.post_deletion_button -> admin.post_deletion.button
admin.post_deletion_error -> admin.post_deletion.error
admin.account_deletion_title -> admin.account_deletion.title
admin.account_deletion_button -> admin.account_deletion.button
admin.account_deletion_error -> admin.account_deletion.error
admin.badge_name_placeholder -> admin.badge.name_placeholder
admin.badge_name_label -> admin.badge.name_label
admin.badge_data_placeholder -> admin.badge.data_placeholder
admin.badge_manage_title -> admin.badge.manage_title
admin.badge_manage_empty -> admin.badge.manage_empty
admin.badge_manage_add_button -> admin.badge.manage_add_button
admin.badge_manage_add_error -> admin.badge.manage_add_error
admin.badge_manage_remove_button -> admin.badge.manage_remove_button
admin.badge_manage_remove_error -> admin.badge.manage_remove_error
admin.badge_manage_add_protected -> admin.badge.manage_add_protected
admin.badge_manage_remove_protected -> admin.badge.manage_remove_protected
admin.badge_create_title -> admin.badge.create_title
admin.badge_create_button -> admin.badge.create_button
admin.badge_create_invalid_data_size -> admin.badge.create_invalid_data_size
admin.badge_create_success -> admin.badge.create_success
admin.badge_delete_title -> admin.badge.delete_title
admin.badge_delete_button -> admin.badge.delete_button
admin.badge_delete_protected -> admin.badge.delete_protected
admin.badge_invalid_name_size -> admin.badge.invalid_name_size
admin.badge_invalid_name -> admin.badge.invalid_name
admin.badge_not_found -> admin.badge.not_found
admin.modify_title -> admin.modify.title
admin.modify_get_button -> admin.modify.get_button
admin.modify_current -> admin.modify.current
admin.modify_save -> admin.modify.save
admin.modify_switcher -> admin.modify.switcher
admin.modify_invalid_bio_size -> admin.modify.invalid_bio_size
admin.modify_invalid_display_name_long -> admin.modify.invalid_display_name_long
admin.modify_invalid_display_name_short -> admin.modify.invalid_display_name_short
admin.modify_id -> admin.modify.id
admin.logs_button -> admin.logs.button
admin.logs_error -> admin.logs.error
admin.logs_timestamp -> admin.logs.timestamp
admin.logs_action -> admin.logs.action
admin.logs_who -> admin.logs.who
admin.logs_more_info -> admin.logs.more_info
settings.cometic_theme_light -> settings.cosmetic_themes.light
settings.cometic_theme_gray -> settings.cosmetic_themes.gray
settings.cometic_theme_dark -> settings.cosmetic_themes.dark
settings.cometic_theme_black -> settings.cosmetic_themes.black
settings.cometic_theme_oled -> settings.cosmetic_themes.oled
```
</details>

<details>
<summary>v1.7.0</summary>

Caching, accessibility, custom static files

```diff
+ generic.version
+ admin.badge_name_label
+ admin.level_label
+ home.c_warning_label
+ post.private_post
+ post.unlike
+ settings.cosmetic_bar_position
+ settings.cosmetic_bar_direction
+ changelog.changes.v0.12.3 {1, 2, 3, 4, 5, 6}
```
</details>

<details>
<summary>v1.6.2</summary>

Small bugfixes

```diff
+ changelog.changes.v0.12.2 {1}
```
</details>

<details>
<summary>v1.6.1</summary>

Small bugfixes

```diff
+ changelog.changes.v0.12.1 {1, 2, 3}
```
</details>

<details>
<summary>v1.6.0</summary>

Reworked private accounts

```diff
- settings.profile_private
- settings.profile_private_description
- user_page.private_warning
+ account.follow_blocked
+ post.invalid_poll
+ post.type_public
+ post.type_followers_only
+ post.no_posts
+ post.like
+ post.comment
+ post.quote
+ post.delete
+ post.pin
+ post.unpin
+ settings.profile_default_post
+ settings.profile_followers_approval
+ settings.cosmetic_checkboxes
+ settings.cosmetic_no_css
+ settings.cosmetic_no_css_warning
+ settings.cosmetic_old_favicon
+ user_page.follows
+ user_page.pending_title
+ user_page.pending_accept
+ user_page.pending_deny
+ changelog.changes.v0.12.0 {1, 2, 3, 4, 5, 6, 7}
home.quote_private
```
</details>

<details>
<summary>v1.5.0</summary>

Added emails and legacy changelogs

```diff
- credits.credits
+ account.forgot_password
+ settings.cosmetic_bar
+ settings.cosmetic_bar_ur
+ settings.cosmetic_bar_lr
+ settings.cosmetic_bar_ul
+ settings.cosmetic_bar_ll
+ settings.cosmetic_bar_h
+ settings.cosmetic_bar_v
+ settings.account_email
+ settings.account_email_update
+ settings.account_email_verify
+ settings.account_email_check
+ credits.lead
+ credits.contributors
+ credits.fontawesome
+ credits.current
+ credits.past
+ credits.main_title
+ credits.lang_title
+ credits.other_title
+ email.generic.greeting
+ email.generic.link
+ email.generic.expire
+ email.pwd_fm.email_changed
+ email.verify.confirmation
+ email.verify.title
+ email.verify.block_1
+ email.verify.block_2
+ email.verify.block_3
+ email.remove.confirmation
+ email.change.title
+ email.change.block_1
+ email.change.block_2
+ email.change.block_3
+ email.reset.title
+ email.reset.html_title
+ email.reset.no_email
+ email.reset.block_1
+ email.reset.block_2
+ email.reset.block_3
+ changelog.changes.v0.11.0 {1, 2, 3, 4, 5, 6}
+ changelog.changes.v0.3.6 {1, 2, 3}
+ changelog.changes.v0.3.5 {1, 2, 3}
+ changelog.changes.v0.3.4 {1, 2}
+ changelog.changes.v0.3.3 {1}
+ changelog.changes.v0.3.2 {1, 2, 3, 4}
+ changelog.changes.v0.3.1 {1, 2}
+ changelog.changes.v0.3.0 {1, 2}
+ changelog.changes.v0.2.0 {1}
+ changelog.changes.v0.1.1 {1}
+ changelog.changes.v0.1.0 {1, 2}
+ changelog.changes.v0.0.10 {1, 2, 3}
+ changelog.changes.v0.0.9 {1, 2}
+ changelog.changes.v0.0.8 {1, 2}
+ changelog.changes.v0.0.7 {1}
+ changelog.changes.v0.0.6 {1}
+ changelog.changes.v0.0.5 {1, 2}
+ changelog.changes.v0.0.4 {1, 2}
+ changelog.changes.v0.0.3 {1, 2}
+ changelog.changes.v0.0.2 {1, 2}
+ changelog.changes.v0.0.1 {1, 2}
settings.profile_display_name_invalid_length
```
</details>

<details>
<summary>1.4.0</summary>

Added polls

```diff
+ noscript.title
+ noscript.subtitle
+ noscript.tutorial_title
+ noscript.tutorial_ff
+ noscript.tutorial_chrome
+ home.c_warning_placeholder
+ home.poll_view_results
+ credits.title
+ credits.credits
+ changelog.changes.v0.10.1 {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
```
</details>

<details>
<summary>1.3.0</summary>

Added polls

```diff
+ home.quote_private
+ home.quote_poll
+ home.poll
+ home.poll_option
+ home.poll_optional
+ home.poll_total_plural
+ home.poll_total_singular
+ account.no_new
+ post.invalid_poll
+ changelog.changes.v0.10.0 {1, 2, 3, 4, 5}
changelog.v0.9.1 {2}
```
</details>

<details>
<summary>1.2.0</summary>

Rewrote how changelogs are stored to make translating bit-by-bit easier

```diff
- changelog.logs
+ changelog.changes.v0.9.3 {1, 2, 3}
+ changelog.changes.v0.9.2 {1, 2, 3, 4, 5}
+ changelog.changes.v0.9.1 {1, 2, 3, 4, 5, 6, 7}
+ changelog.changes.v0.9.0 {1, 2, 3}
+ changelog.changes.v0.8.6 {1}
+ changelog.changes.v0.8.5 {1}
+ changelog.changes.v0.8.4 {1, 2}
+ changelog.changes.v0.8.3 {1, 2, 3, 4, 5}
+ changelog.changes.v0.8.2 {1}
+ changelog.changes.v0.8.1 {1, 2, 3}
+ changelog.changes.v0.8.0 {1}
+ changelog.changes.v0.7.4 {1, 2}
+ changelog.changes.v0.7.3 {1, 2, 3, 4, 5, 6}
+ changelog.changes.v0.7.2 {1}
+ changelog.changes.v0.7.1 {1}
+ changelog.changes.v0.7.0 {1, 2, 3}
+ changelog.changes.v0.6.8 {1, 2, 3, 4}
+ changelog.changes.v0.6.7 {1, 2, 3}
+ changelog.changes.v0.6.6 {1}
+ changelog.changes.v0.6.5 {1, 2, 3}
+ changelog.changes.v0.6.4 {1}
+ changelog.changes.v0.6.3 {1}
+ changelog.changes.v0.6.2 {1}
+ changelog.changes.v0.6.1 {1}
+ changelog.changes.v0.6.0 {1, 2, 3, 4, 5, 6}
+ changelog.changes.v0.5.2 {1, 2}
+ changelog.changes.v0.5.1 {1}
+ changelog.changes.v0.5.0 {1}
+ changelog.changes.v0.4.3 {1, 2}
+ changelog.changes.v0.4.2 {1, 2, 3}
+ changelog.changes.v0.4.1 {1, 2, 3}
+ changelog.changes.v0.4.0 {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17}
+ changelog.changes.v0.3.8 {1}
+ changelog.changes.v0.3.7 {1}
+ changelog.changes.v0.0.1 - v0.3.6
```
</details>

<details>
<summary>1.1.0</summary>

Added changelogs

```diff
+ changelog.title
+ changelog.unknown
+ changelog.logs v0.9.2
+ changelog.logs v0.9.1
+ changelog.logs v0.9.0
+ changelog.logs v0.8.6
+ changelog.logs v0.8.5
+ changelog.logs v0.8.4
+ changelog.logs v0.8.3
+ changelog.logs v0.8.2
+ changelog.logs v0.8.1
+ changelog.logs v0.8.0
+ changelog.logs v0.7.4
+ changelog.logs v0.7.3
+ changelog.logs v0.7.2
+ changelog.logs v0.7.1
+ changelog.logs v0.7.0
+ changelog.logs v0.6.8
+ changelog.logs v0.6.7
+ changelog.logs v0.6.6
+ changelog.logs v0.6.5
+ changelog.logs v0.6.4
+ changelog.logs v0.6.3
+ changelog.logs v0.6.2
+ changelog.logs v0.6.1
+ changelog.logs v0.6.0
+ changelog.logs v0.5.2
+ changelog.logs v0.5.1
+ changelog.logs v0.5.0
+ changelog.logs v0.4.3
+ changelog.logs v0.4.2
+ changelog.logs v0.4.1
+ changelog.logs v0.4.0
+ changelog.logs v0.3.8
+ changelog.logs v0.3.7
+ changelog.logs v0.0.1 - v0.3.6
```
</details>

<details>
<summary>1.0.0</summary>

Initial commit

```diff
+ http.404.post_title
+ http.404.post_description
+ http.404.standard_title
+ http.404.standard_description
+ http.404.user_title
+ http.404.user_description
+ http.500.title
+ http.500.description
+ http.500.alt_description
+ http.home
+ generic.success
+ generic.something_went_wrong
+ generic.something_went_wrong_x
+ generic.try_again
+ generic.ratelimit_verbose
+ generic.ratelimit
+ generic.refresh
+ generic.load_more
+ generic.post
+ generic.cancel
+ generic.source_code
+ generic.save
+ generic.none
+ generic.reason
+ generic.user_not_found
+ generic.share
+ generic.copied
+ generic.see_more
+ generic.pronouns.a
+ generic.pronouns.o
+ generic.pronouns.v
+ generic.pronouns.aa
+ generic.pronouns.af
+ generic.pronouns.ai
+ generic.pronouns.am
+ generic.pronouns.an
+ generic.pronouns.ao
+ generic.pronouns.ax
+ generic.pronouns.fa
+ generic.pronouns.ff
+ generic.pronouns.fi
+ generic.pronouns.fm
+ generic.pronouns.fn
+ generic.pronouns.fo
+ generic.pronouns.fx
+ generic.pronouns.ma
+ generic.pronouns.mf
+ generic.pronouns.mi
+ generic.pronouns.mm
+ generic.pronouns.mn
+ generic.pronouns.mo
+ generic.pronouns.mx
+ generic.pronouns.na
+ generic.pronouns.nf
+ generic.pronouns.ni
+ generic.pronouns.nm
+ generic.pronouns.nn
+ generic.pronouns.no
+ generic.pronouns.nx
+ generic.pronouns.oa
+ generic.pronouns.of
+ generic.pronouns.oi
+ generic.pronouns.om
+ generic.pronouns.on
+ generic.pronouns.oo
+ generic.pronouns.ox
+ generic.colors.rosewater
+ generic.colors.flamingo
+ generic.colors.pink
+ generic.colors.mauve
+ generic.colors.red
+ generic.colors.maroon
+ generic.colors.peach
+ generic.colors.yellow
+ generic.colors.green
+ generic.colors.teal
+ generic.colors.sky
+ generic.colors.sapphire
+ generic.colors.blue
+ generic.colors.lavender
+ generic.time.months
+ generic.time.second_singular
+ generic.time.second_plural
+ generic.time.minute_singular
+ generic.time.minute_plural
+ generic.time.hour_singular
+ generic.time.hour_plural
+ generic.time.day_singular
+ generic.time.day_plural
+ generic.time.month_singular
+ generic.time.month_plural
+ generic.time.year_singular
+ generic.time.year_plural
+ generic.time.ago
+ admin.title
+ admin.level
+ admin.is_comment_label
+ admin.use_id_label
+ admin.post_id_placeholder
+ admin.user_id_placeholder
+ admin.post_deletion_title
+ admin.post_deletion_button
+ admin.post_deletion_error
+ admin.account_deletion_title
+ admin.account_deletion_button
+ admin.account_deletion_error
+ admin.badge_name_placeholder
+ admin.badge_data_placeholder
+ admin.badge_manage_title
+ admin.badge_manage_empty
+ admin.badge_manage_add_button
+ admin.badge_manage_add_error
+ admin.badge_manage_remove_button
+ admin.badge_manage_remove_error
+ admin.badge_manage_add_protected
+ admin.badge_manage_remove_protected
+ admin.badge_create_title
+ admin.badge_create_button
+ admin.badge_create_invalid_data_size
+ admin.badge_create_success
+ admin.badge_delete_title
+ admin.badge_delete_button
+ admin.badge_delete_protected
+ admin.badge_invalid_name_size
+ admin.badge_invalid_name
+ admin.badge_not_found
+ admin.modify_title
+ admin.modify_get_button
+ admin.modify_current
+ admin.modify_save
+ admin.modify_switcher
+ admin.modify_invalid_bio_size
+ admin.modify_invalid_display_name_long
+ admin.modify_invalid_display_name_short
+ admin.modify_id
+ admin.level_title
+ admin.level_zero
+ admin.level_one
+ admin.level_two
+ admin.level_three
+ admin.level_four
+ admin.level_five
+ admin.level_button
+ admin.level_invalid
+ admin.level_error
+ admin.logs_button
+ admin.logs_error
+ admin.logs_timestamp
+ admin.logs_action
+ admin.logs_who
+ admin.logs_more_info
+ contact.title
+ contact.subtitle
+ hashtag.post_singular
+ hashtag.post_plural
+ home.title
+ home.post_input_placeholder
+ home.switch_recent
+ home.switch_following
+ home.quote_blocked
+ home.quote_deleted
+ home.quote_private
+ home.quote_recursive
+ home.quote_placeholders
+ account.log_in_title
+ account.log_in_instead
+ account.log_in_failure
+ account.sign_up_title
+ account.sign_up_instead
+ account.sign_up_failure
+ account.password_match_failure
+ account.log_out_title
+ account.log_out_description
+ account.username_placeholder
+ account.password_placeholder
+ account.confirm_placeholder
+ account.toggle_password
+ account.bad_password
+ account.username_taken
+ account.invalid_username_chars
+ account.invalid_username_length
+ account.username_does_not_exist
+ account.follow_blocking
+ account.block_self
+ account.password_empty
+ messages.title
+ messages.error
+ messages.input_placeholder
+ messages.no_messages
+ messages.list_title
+ messages.list_subtitle
+ messages.yourself
+ messages.blocking
+ messages.blocked
+ messages.blocking_blocked
+ messages.invalid_size
+ notifications.title
+ notifications.read
+ notifications.error
+ notifications.comment
+ notifications.quote
+ notifications.ping_p
+ notifications.ping_c
+ post_page.likes
+ post_page.comments
+ post_page.quotes
+ post_page.comment_parent
+ post_page.comment_input_placeholder
+ post.invalid_length
+ post.invalid_comment_id
+ post.comment_id_does_not_exist
+ post.invalid_quote_post
+ post.invalid_quote_comment
+ post.invalid_username
+ settings.title
+ settings.username_load_failure
+ settings.unload
+ settings.profile_title
+ settings.profile_basic_title
+ settings.profile_display_name_placeholder
+ settings.profile_display_name_invalid_length
+ settings.profile_bio_placeholder
+ settings.profile_pronouns_title
+ settings.profile_pronouns_primary
+ settings.profile_pronouns_secondary
+ settings.profile_pronouns_invalid
+ settings.profile_pronouns_unset
+ settings.profile_pronouns_inherit
+ settings.profile_banner_title
+ settings.profile_banner_invalid_color
+ settings.profile_gradient
+ settings.profile_private
+ settings.profile_private_description
+ settings.cosmetic_title
+ settings.cosmetic_theme
+ settings.cosmetic_theme_light
+ settings.cosmetic_theme_gray
+ settings.cosmetic_theme_dark
+ settings.cosmetic_theme_black
+ settings.cosmetic_theme_oled
+ settings.cosmetic_theme_invalid
+ settings.cosmetic_language
+ settings.cosmetic_language_invalid
+ settings.cosmetic_color
+ settings.cosmetic_example_post_display_name
+ settings.cosmetic_example_post_username
+ settings.cosmetic_example_post_content
+ settings.account_title
+ settings.account_password
+ settings.account_password_current
+ settings.account_password_new
+ settings.account_password_success
+ settings.account_password_failure
+ settings.account_switcher
+ settings.account_switcher_switch
+ settings.account_switcher_remove
+ settings.account_switcher_remove_error
+ settings.account_switcher_add
+ settings.admin
+ settings.logout
+ user_page.followers
+ user_page.following
+ user_page.user_on_smiggins
+ user_page.follow
+ user_page.unfollow
+ user_page.block
+ user_page.unblock
+ user_page.message
+ user_page.private_warning
+ user_page.lists_blocks
+ user_page.lists_following
+ user_page.lists_followers
+ user_page.lists_no_bio
```
</details>

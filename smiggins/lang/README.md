# lang
For contributing, read [this document](/docs/contributing.md#translating).

## Version changes
Updates for each language version are listed below:

<details>
<summary>v1.10.2</summary>

```diff
+ messages.muted
+ notifications.delete
+ post.muted
+ settings.cosmetic_compact
+ settings.mute.title
+ settings.mute.placeholder
+ settings.mute.post_blocked
+ settings.mute.long
+ settings.mute.too_many
+ settings.mute.description
```
</details>

<details>
<summary>v1.10.1</summary>

```diff
# The entire pronoun system has been reworked
- generic.pronouns.*
- home.switch_recent
- home.switch_following
- settings.profile_pronouns_invalid
- settings.profile_pronouns_unset
- settings.profile_pronouns_inherit
settings.profile_pronouns_title -> generic.pronouns.title
settings.profile_pronouns_primary -> generic.pronouns.primary_label
settings.profile_pronouns_secondary -> generic.pronouns.secondary_label
+ generic.close
+ generic.keybinds.title
+ generic.keybinds.plus
+ generic.keybinds.dash
+ generic.keybinds.ctrl
+ generic.keybinds.enter
+ generic.keybinds.navigation.title
+ generic.keybinds.navigation.admin
+ generic.keybinds.navigation.home
+ generic.keybinds.navigation.messages
+ generic.keybinds.navigation.notifications
+ generic.keybinds.navigation.profile
+ generic.keybinds.navigation.settings
+ generic.keybinds.other.title
+ generic.keybinds.other.help
+ generic.keybinds.other.post
+ generic.keybinds.other.jump
+ generic.keybinds.other.refresh
+ hashtag.timeline.random
+ hashtag.timeline.recent
+ hashtag.timeline.liked
+ hashtag.home.global
+ hashtag.home.following
+ hashtag.post_page.newest
+ hashtag.post_page.oldest
+ hashtag.post_page.liked
+ hashtag.post_page.random
+ settings.cosmetic_expand
```
</details>

<details>
<summary>v1.10.0</summary>

```diff
# Remove HTML tag
account.log_out_description
# Remove capitalization from "all"
settings.logout
+ admin.permissions.descriptions.9
+ admin.otp.generate
+ admin.otp.generate_button
+ admin.otp.all
+ admin.otp.all_button
+ admin.disabled.generic
+ admin.disabled.badge
+ admin.disabled.otp
+ account.invite_code
+ account.invite_code_info
+ account.invite_code_invalid
+ settings.logout_singular
```
</details>

<details>
<summary>v1.9.0</summary>

```diff
home.c_warning_placeholder
changelog.title -> settings.changelogs
- settings.unload
- changelog
+ settings.account_deletion_warning
+ settings.account_deletion_confirm
+ settings.account_deletion_password
+ settings.unload.title
+ settings.unload.content
+ settings.unload.leave
+ post.chars_singular
+ post.chars_plural
```
</details>

<details>
<summary>v1.8.4</summary>

```diff
admin.modify.invalid_bio_size
- generic.something_went_wrong_x
- generic.try_again
- generic.ratelimit_verbose
- generic.reason
- admin.post_deletion.error
- admin.account_deletion.error
- admin.badge.manage_add_error
- admin.badge.manage_remove_error
- admin.modify.invalid_display_name_long
- admin.modify.invalid_display_name_short
- admin.permissions.error
- admin.permissions.invalid
- admin.logs.error
- home.c_warning_label
- account.log_in_failure
- account.sign_up_failure
- messages.error
- notifications.error
- post.comment_id_does_not_exist
- settings.username_load_failure
- settings.profile_banner_invalid_color
- settings.cosmetic_language_invalid
- settings.account_password_failure
+ admin.modify.invalid_display_name
```
</details>

<details>
<summary>v1.8.1</summary>

```diff
+ settings.cosmetic_themes.warm
+ settings.cosmetic_themes.purple
# Fix spelling
post.comment_id_does_not_exist
post.invalid_username
settings.cosmetic_theme_invalid
```
</details>

<details>
<summary>v1.8.0</summary>

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

```diff
+ generic.version
+ admin.badge_name_label
+ admin.level_label
+ home.c_warning_label
+ post.private_post
+ post.unlike
+ settings.cosmetic_bar_position
+ settings.cosmetic_bar_direction
```
</details>

<details>
<summary>v1.6.0</summary>

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
home.quote_private
```
</details>

<details>
<summary>v1.5.0</summary>

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
settings.profile_display_name_invalid_length
```
</details>

<details>
<summary>v1.4.0</summary>

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
```
</details>

<details>
<summary>v1.3.0</summary>

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
```
</details>

<details>
<summary>v1.0.0</summary>

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

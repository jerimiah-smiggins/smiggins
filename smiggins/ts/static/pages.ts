let hasHistoryBeenUsedYet: boolean = false;
let contextLoading: boolean = false;
const pageNotFound: "404" = "404";

const pages: { [key: string]: [() => string, (() => void) | null] } = {
  "404": [(): string => `<h1>${lang.http["404"].standard_title}</h1>${lang.http["404"].standard_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404-user": [(): string => `<h1>${lang.http["404"].user_title}</h1>${lang.http["404"].user_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  "404-post": [(): string => `<h1>${lang.http["404"].post_title}</h1>${lang.http["404"].post_description}<br><a data-link href="/">${lang.http.home}</a>`, null],
  index: [(): string => `
    <h1>${escapeHTML(conf.site_name)}</h1>
    <h3>${escapeHTML(conf.version)}</h3>
    ${conf.new_accounts === false ? lang.account.no_new + "<br>" : `<a data-link href='/signup/'>${lang.account.sign_up_title}</a> -`}
    <a data-link href='/login/'>${lang.account.log_in_title}</a>
    ${context.source ? `<br><br>
      <a href="https://github.com/jerimiah-smiggins/smiggins" target="_blank">${lang.generic.source_code}</a>` : ""}
    ${context.discord ? `<br>${context.source ? "" : "<br>"}
      <a href="https://discord.gg/${context.discord}" target="_blank">${lang.generic.discord}</a>` : ""}
  `, null],
  login: [(): string => `
    <h1>${ lang.account.log_in_title }</h1>
    <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
    <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br><br>
    <button id="submit">${lang.account.log_in_title}</button><br><br>
    <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    <a data-link href="/signup/">${lang.account.sign_up_instead}</a>
    ${conf.email ? `<br><a data-link href="/reset-password/">${lang.account.forgot_password}</a>` : ""}
  `, loggedIn ? null : loginInit],
  signup: [(): string => `
    <h1>${lang.account.sign_up_title}</h1>
    ${conf.new_accounts === false ? escapeHTML(lang.account.no_new) + "<br><br>" : `
      <input id="username" maxlength="${conf.max_username_length}" placeholder="${lang.account.username_placeholder}"><br>
      <input id="password" placeholder="${lang.account.password_placeholder}" type="password"><br>
      <input id="confirm" placeholder="${lang.account.confirm_placeholder}" type="password"><br><br>
      ${conf.new_accounts === "otp" ? `
        <div>${lang.account.invite_code_info}</div>
        <input id="otp" placeholder="${lang.account.invite_code}" maxlength="32"><br>
      ` : ""}
      <button id="submit">${lang.account.sign_up_title}</button><br><br>
      <button id="toggle-password">${lang.account.toggle_password}</button><br><br>
    `}

    <a data-link href="/login/">${lang.account.log_in_instead}</a>
  `, loggedIn ? null : signupInit],
  logout: [(): string => `<a href="/">${lang.account.log_out_description}</a>`, logoutInit],
  home: [(): string => `
    <label for="default-private">${lang.post.type_followers_only}:</label>
    <input id="default-private" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
    ${conf.content_warnings ? `<input id="c-warning" data-create-post maxlength="${conf.max_content_warning_length}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
    <textarea id="post-text" data-create-post maxlength="${conf.max_post_length}" placeholder="${lang.home.post_input_placeholder}"></textarea><br>
    <button id="post" class="inverted">${lang.generic.post}</button><br>
    ${conf.polls ? `
      <button id="toggle-poll" class="inverted">${lang.home.poll}</button><br>
      <div hidden id="poll">
        ${inlineFor([...Array(conf.max_poll_options).keys()], (i: number): string => `
          <input data-create-post placeholder="${(i + 1 > 2 ? lang.home.poll_optional : lang.home.poll_option).replaceAll("%s", i + 1)}" maxlength="${conf.max_poll_option_length}"></br>
        `)}
      </div>
    ` : ""}
    <p id="switch">
      <a data-timeline="following" data-storage-id="home-page" href="javascript:void(0);">${lang.home.timeline.following}</a> -
      <a data-timeline="recent" data-storage-id="home-page" href="javascript:void(0);">${lang.home.timeline.global}</a>
    </p>
    <button id="refresh" onclick="refresh()">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button>
    <div id="posts"></div>
    <button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button>
  `, loggedIn ? (): void => { homeInit(); timelineInit(); } : null],
  settings: [(): string => `
    <h1>${lang.settings.title}</h1>
    <hr><br>
    <button class="big-button primary" id="save">${lang.generic.save}</button>
    <div class="settings-container">
      <div class="settings-side">
        <h2>${lang.settings.profile_title}</h2>
        ${lang.settings.profile_basic_title}<br>

        <input id="displ-name" autocomplete="off" placeholder="${lang.settings.profile_display_name_placeholder}" value="${escapeHTML(context.display_name)}" maxlength="${conf.max_display_name_length}"><br>
        ${conf.user_bios ? `<textarea id="bio" placeholder="${lang.settings.profile_bio_placeholder}" maxlength="${conf.max_bio_length}">${escapeHTML(context.bio)}</textarea><br>` : ""}<br>

        ${conf.pronouns && lang.generic.pronouns.enable_pronouns ? `
          ${lang.generic.pronouns.title}<br>
          ${lang.generic.pronouns.enable_secondary ? `
          <table class="center">
              <tr>
                <td class="right"><label for="pronouns-primary">${lang.generic.pronouns.primary_label}</label></td>
                <td class="left">
          ` : ""}
                  <select id="pronouns-primary">
                    ${inlineFor(
                      lang.generic.pronouns.primary,
                      ((noun: { key: string, special: string, name: string }): string => `<option value="${noun.key}" data-special="${noun.special}" ${noun.key == context.pronouns.primary ? "selected" : ""}>${noun.name}</option>`)
                    )}
                  </select>
            ${lang.generic.pronouns.enable_secondary ? `
                </td>
              </tr>

              <tr id="pronouns-secondary-container">
                <td class="right"><label for="pronouns-secondary">${lang.generic.pronouns.secondary_label}</label></${lang.generic.pronouns.enable_secondary ? "td" : "span"}>
                <td class="left">
                  <select id="pronouns-secondary">
                    ${inlineFor(
                      lang.generic.pronouns.secondary,
                      ((noun: { key: string, special: string, name: string }): string => `<option value="${noun.key}" data-special="${noun.special}" ${noun.key == context.pronouns.secondary ? "selected" : ""}>${noun.name}</option>`)
                    )}
                  </select>
                </td>
              </tr>
            </table>
            ` : ""}<br>
        ` : ""}

        ${lang.settings.profile_banner_title}<br>
        <div id="banner"></div><br>
        <input aria-label="${lang.settings.profile_banner_title}" id="banner-color" value="${context.banner_color_one}" type="color">
        ${conf.gradient_banners ? `
          <input aria-label="${lang.settings.profile_banner_title}" ${context.gradient ? "" : "hidden"} id="banner-color-two" value="${context.banner_color_two}" type="color"><br>
          <label for="banner-is-gradient">${lang.settings.profile_gradient}</label>
          <input id="banner-is-gradient" ${context.gradient ? "checked" : ""} type="checkbox">
        ` : ""}<br><br>

        <label for="default-post">${lang.settings.profile_default_post}</label><br>
        <select id="default-post">
          <option value="public" ${context.default_post_private ? "" : "selected"}>${lang.post.type_public}</option>
          <option value="followers" ${context.default_post_private ? "selected" : ""}>${lang.post.type_followers_only}</option>
        </select><br><br>

        <label for="followers-approval">${lang.settings.profile_followers_approval}</label>
        <input type="checkbox" id="followers-approval" ${context.verify_followers ? "checked" : ""}>
      </div>

      <div>
        <h2>${lang.settings.cosmetic_title}</h2>
        <label for="theme">${lang.settings.cosmetic_theme}:</label><br>
        <select id="theme">
          <option ${context.theme == "auto" ? "selected" : ""} value="auto">${lang.settings.cosmetic_themes.auto}</option>
          ${inlineFor(
            context.themes,
            ((theme: { id: string, name: string }): string => `<option ${context.theme == theme.id ? "selected" : ""} value="${theme.id}">${escapeHTML(theme.name)}</option>`)
          )}
        </select><br><br>

        <label for="lang">${lang.settings.cosmetic_language}:</label><br>
        <select id="lang">
          ${inlineFor(
            context.languages,
            ((language: string): string => `<option value="${language}" ${language == context.language ? "selected" : ""}>${getLanguageName(language)}</option>`)
          )}
        </select><br><br>

        <label>
          ${lang.settings.cosmetic_checkboxes}
          <input id="disable-checkboxes" type="checkbox">
        </label><br><br>

        <label for="expand-cws">${lang.settings.cosmetic_expand}</label>
        <input id="expand-cws" type="checkbox"><br><br>

        <label for="compact">${lang.settings.cosmetic_compact}</label>
        <input id="compact" type="checkbox"><br><br>

        ${lang.settings.cosmetic_bar}:<br>
        <table class="center">
          <tr>
            <td class="right"><label for="bar-pos">${lang.settings.cosmetic_bar_position}</label></td>
            <td class="left">
              <select id="bar-pos">
                <option value="ur">${lang.settings.cosmetic_bar_ur}</option>
                <option value="lr">${lang.settings.cosmetic_bar_lr}</option>
                <option value="ul">${lang.settings.cosmetic_bar_ul}</option>
                <option value="ll">${lang.settings.cosmetic_bar_ll}</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="right"><label for="bar-dir">${lang.settings.cosmetic_bar_direction}</label></td>
            <td class="left">
              <select id="bar-dir">
                <option value="h">${lang.settings.cosmetic_bar_h}</option>
                <option value="v">${lang.settings.cosmetic_bar_v}</option>
              </select>
            </td>
          </tr>
        </table><br><br>

        ${conf.dynamic_favicon ? `
          <label for="old-favi">${lang.settings.cosmetic_old_favicon}</label>
          <input type="checkbox" id="old-favi"><br><br>
        ` : ""}

        <label for="color">${lang.settings.cosmetic_color}:</label><br>
        <div id="color-selector"><select id="color">
          ${inlineFor(validColors, (col: string): string => `
            <option ${localStorage.getItem("color") == col || (!localStorage.getItem("color") && col == "mauve") ? "selected" : ""} value="${col}">${lang.generic.colors[col]}</option>
          `)}
        </select></div>
        <div id="post-example">${getPostHTML({
          visible: true,
          post_id: 0,

          comment: false,
          parent: null,

          private: false,
          content_warning: null,
          content: lang.settings.cosmetic_example_post_content,
          timestamp: Date.now() / 1000 - Math.random() * 86400,
          poll: null,
          edited: null,
          quote: null,

          interactions: {
            likes: Math.floor(Math.random() * 99) + 1,
            liked: true,
            comments: Math.floor(Math.random() * 100),
            quotes: Math.floor(Math.random() * 100)
          },

          can: {
            delete: false,
            pin: false,
            edit: false
          },

          creator: {
            display_name: lang.settings.cosmetic_example_post_display_name,
            username: lang.settings.cosmetic_example_post_username,
            badges: ["administrator"],
            pronouns: null,
            color_one: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
            color_two: "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0"),
            gradient: true
          }
        }, false, false, false, true)}</div>
      </div>

      <div class="settings-side">
        <h2>${lang.settings.account_title}</h2>
        ${lang.settings.account_password}<br>
        <input type="password" autocomplete="off" placeholder="${lang.settings.account_password_current}" id="current"><br>
        <input type="password" autocomplete="off" placeholder="${lang.settings.account_password_new}" id="password"><br>
        <input type="password" autocomplete="off" placeholder="${lang.account.confirm_placeholder}" id="confirm"><br>
        <button id="toggle-password">${lang.account.toggle_password}</button>
        <button id="set-password">${lang.generic.save}</button><br><br>

        <h3>${lang.settings.mute.title}</h3>
        <div>${lang.settings.mute.soft}</div>
        <textarea id="soft-mute" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(muted.filter((i: [string, number, boolean]): boolean => (!i[2])).map((val: [string, number, boolean]): string => (val[0])).join("\n"))}</textarea>
        <div>${lang.settings.mute.hard}</div>
        <textarea id="hard-mute" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(muted.filter((i: [string, number, boolean]): boolean => (i[2])).map((val: [string, number, boolean]): string => (val[0])).join("\n"))}</textarea><br>
        <small>${lang.settings.mute.hard_description}</small><br>
        <button id="save-muted">${lang.generic.save}</button><br>
        <small>${lang.settings.mute.description.replaceAll("%m", String(conf.max_muted_words)).replaceAll("%c", String(conf.max_muted_word_length))}</small>

        ${conf.email ? `
          <label for="email">${lang.settings.account_email}</label><br>
          <input ${context.email && context.email_valid ? "disabled" : ""} value="${escapeHTML(context.email)}" id="email" type="email" placeholder="email@example.com"></br>
          <input type="password" autocomplete="off" placeholder="${lang.account.password_placeholder}" id="email-password"><br>
          <button id="email-submit">${context.email && context.email_valid ? lang.settings.account_email_update : lang.generic.save}</button>
          <div id="email-output">${context.email && !context.email_valid ? lang.settings.account_email_verify : ""}</div><br><br>
        ` : ""}

        ${lang.admin.account_deletion.title}<br>
        <button id="delete-account">${lang.admin.account_deletion.button}</button>

        ${conf.account_switcher ? `
          <br><br>
          <div id="switcher">
            <label for="accs">${lang.settings.account_switcher}</label><br>
            <select id="accs"></select><br>
            <button id="acc-switch">${lang.settings.account_switcher_switch}</button>
            <button id="acc-remove">${lang.settings.account_switcher_remove}</button><br><br>
            <a data-link href="/logout/?from=switcher">${lang.settings.account_switcher_add}</a>
          </div>
        ` : ""}
      </div>
    </div>

    <a data-link href="/logout/">${conf.account_switcher ? lang.settings.logout : lang.settings.logout_singular}</a><br><br>

    ${isAdmin ? `<a data-link href='/admin/'>${lang.settings.admin}</a><br>` : ""}
    ${context.source ? `<a href="https://github.com/jerimiah-smiggins/smiggins" target="_blank">${lang.generic.source_code}</a><br>` : ""}
    ${context.discord ? `<a href="https://discord.gg/${context.discord}" target="_blank">${lang.generic.discord}</a><br>` : ""}

    ${isAdmin || context.source || context.discord ? "<br>" : ""}
    <hr><br>

    ${conf.site_name} ${conf.version}
    ${context.source ? `<br><a href="https://github.com/jerimiah-smiggins/smiggins/tree/main/CHANGELOG.md" target="_blank">${lang.settings.changelogs}</a>` : ""}
    ${context.contact ? `<br><a data-link href="/contact/">${lang.contact.title}</a>` : ""}
    ${context.credits ? `<br><a data-link href="/credits/">${lang.credits.title}</a>` : ""}
  `, loggedIn ? settingsInit : null],
  contact: [(): string => `
    <h1>${lang.contact.subtitle}</h1>
    <h2>${conf.site_name} ${conf.version}</h2>
    <ul>
      ${
        inlineFor(
          context.contact,
          ((contact: string): string => `<li>
            ${contact[0] == "email" ?
              `<a href="mailto:${encodeURIComponent(contact[1])}">${escapeHTML(contact[1])}</a>`
            : contact[0] == "url" ?
              `<a href="${encodeURIComponent(contact[1])}">${escapeHTML(contact[1])}</a>`
            : escapeHTML(contact[1])}
          </li>`)
        )
      }
    </ul>
  `, null],
  credits: [(): string => `
    <h1>${lang.credits.title}</h1>
    <h2>${conf.site_name} ${conf.version}</h2>

    <h3>${lang.credits.main_title}</h3>
    <ul>
      <li>${lang.credits.lead} <a href="https://github.com/${context.credits.lead[0]}/" target="_blank">${context.credits.lead[0]}</a></li>
      <li>
        ${lang.credits.contributors}<br>
        <ul>
          ${inlineFor(
            context.credits.contributors,
            "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>",
            `<li><i>${lang.generic.none}</i></li>`
          )}
        </ul>
      </li>
    </ul>
    ${context.cache_langs ? `
      <h3>${lang.credits.lang_title}</h3>
      <ul>
        ${inlineFor(
          context.langs,
          ((l: { code: string, maintainers: string[], past_maintainers: string[] }): string => `
            <li>
              ${getLanguageName(l.code)}:<br>
              <ul>
                <li>
                  ${lang.credits.current}<br>
                  <ul>
                    ${inlineFor(
                      l.maintainers,
                      "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>",
                      `<li><i>${lang.generic.none}</i></li>`
                    )}
                  </ul>
                </li>
                ${l.past_maintainers.length ? `
                  <li>
                    ${lang.credits.past}<br>
                    <ul>
                      ${inlineFor(
                        l.past_maintainers,
                        "<li><a href=\"https://github.com/%s/\" target=\"_blank\">%s</a></li>"
                      )}
                    </ul>
                  </li>
                ` : ""}
              </ul>
            </li>
          `)
        )}
      </ul>
    ` : ""}
    <h3>${lang.credits.other_title}</h3>
    <ul>
      <li>${lang.credits.fontawesome.replaceAll("%s", "<a href=\"https://fontawesome.com/\" target=\"_blank\">Font Awesome</a>")}</li>
    </ul>
  `, null],
  admin: [(): string => `
    <h1>${lang.admin.title}</h1>
    <hr>

    <div class="actions-container">
      ${testMask(Mask.DeletePost) ? (conf.post_deletion ? `
        <div>
          <h3><label for="post-id">${lang.admin.post_deletion.title}</label></h3>
          <div id="post-deletion">
            <input id="post-id" placeholder="${lang.admin.post_id_placeholder}"><br>
            <label for="comment-toggle">${lang.admin.is_comment_label}</label>
            <input id="comment-toggle" type="checkbox"><br>
            <button id="post-delete">${lang.admin.post_deletion.button}</button>
          </div>
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.deletion}</h3>`) : ""}

      ${testMask(Mask.DeleteUser) ? `
        <div>
          <h3><label for="account-del-identifier">${lang.admin.account_deletion.title}</label></h3>
          <div>
            <input id="account-del-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
            <label for="delete-id-toggle">${lang.admin.use_id_label}</label>
            <input id="delete-id-toggle" type="checkbox"><br>
            <button id="account-delete">${lang.admin.account_deletion.button}</button>
          </div>
        </div>
      ` : ""}

      ${testMask(Mask.CreateBadge) || testMask(Mask.DeleteBadge) || testMask(Mask.GiveBadges) ? (conf.badges ? `
        <div>
          ${testMask(Mask.GiveBadges) ? `
            <h3><label for="badge-identifier">${lang.admin.badge.manage_title}</label></h3>
            <input id="badge-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
            <label for="badge-use-id">${ lang.admin.use_id_label}</label>
            <input id="badge-use-id" type="checkbox"><br>
            <label for="badge-name">${lang.admin.badge.name_label}</label>
            <select id="badge-name">
              ${inlineFor(
                Object.keys(badges).filter((val: string): boolean => (val !== "administrator")),
                "<option value=\"%s\">%s</option>",
                `<option value="">${lang.admin.badge.manage_empty}</option>`
              )}
            </select><br>
            <button id="badge-add">${lang.admin.badge.manage_add_button}</button>
            <button id="badge-remove">${lang.admin.badge.manage_remove_button}</button>
          ` : ""}

          ${testMask(Mask.CreateBadge) ? `
            <h3><label for="badge-create-name">${lang.admin.badge.create_title}</label></h3>
            <input id="badge-create-name" placeholder="${lang.admin.badge.name_placeholder}" maxlength="64"><br>
            <textarea id="badge-create-data" placeholder="${lang.admin.badge.data_placeholder}" maxlength="65536"></textarea><br>
            <button id="badge-create">${lang.admin.badge.create_button}</button>
          ` : ""}

          ${testMask(Mask.DeleteBadge) ? `
            <h3><label for="badge-delete-name">${lang.admin.badge.delete_title}</label></h3>
            <input id="badge-delete-name" placeholder="${lang.admin.badge.name_placeholder}"><br>
            <button id="badge-delete">${lang.admin.badge.delete_button}</button>
          ` : ""}
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.badge}</h3>`) : ""}

      ${testMask(Mask.ModifyAccount) ? `
        <div>
          <h3><label for="data-identifier">${lang.admin.modify.title}</label></h3>
          <input id="data-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
          <label for="data-use-id">${lang.admin.use_id_label}</label>
          <input type="checkbox" id="data-use-id"><br>
          <button id="data-get">${lang.admin.modify.get_button}</button><br><br>
          <div id="data-section"></div>
        </div>
      ` : ""}

      ${testMask(Mask.AdminLevel) ? `
        <div>
          <h3><label for="level-identifier">${lang.admin.permissions.title}</label></h3>
          <input id="level-identifier" placeholder="${lang.admin.user_id_placeholder}"><br>
          <label for="level-use-id">${lang.admin.use_id_label}</label>
          <input id="level-use-id" type="checkbox"><br><br>

          <b>${lang.admin.permissions.label}</b><br>
          <div id="level-selection">
            ${inlineFor(
              [...Array(context.max_level).keys()],
              ((lv: number): string => `
                <p>
                  <input type="checkbox" id="level-${lv}"><label for="level-${lv}">
                  ${lang.admin.permissions.descriptions[String(lv)]}
                  ${context.permissions_disabled[String(lv)] ? `
                    <span class="red">(${lang.admin.disabled.generic})</span>
                  ` : ""}
                  ${lang.admin.permissions.descriptions_extra[String(lv)] ? `
                    <small>${lang.admin.permissions.descriptions_extra[String(lv)]}</small>
                  ` : ""}
                </label>
              </p>
              `)
            )}
          </div>

          <button id="level-set">${lang.admin.permissions.set}</button>
          <button id="level-load">${lang.admin.permissions.load}</button>
        </div>
      ` : ""}

      ${testMask(Mask.GenerateOTP) ? (conf.new_accounts === "otp" ? `
        <div>
          <h3>${lang.admin.otp.generate}</h3>
          <button id="otp-create">${lang.admin.otp.generate_button}</button>
          <div id="otp-generated"></div>
          <h3>${lang.admin.otp.all}</h3>
          <button id="otp-load">${lang.admin.otp.all_button}</button>
          <div id="otp-all"></div>
        </div>
      ` : `<h3 class="red">${lang.admin.disabled.otp}</h3>`) : ""}

      ${testMask(Mask.ChangeMutedWords) ? `
        <div>
          <h3>${lang.settings.mute.title}</h3>
          <textarea id="muted" placeholder="${lang.settings.mute.placeholder}">${escapeHTML(context.muted)}</textarea><br>
          <button id="save-muted">${lang.generic.save}</button><br>
          <small>${lang.settings.mute.description.replaceAll("%m", String(conf.max_muted_words)).replaceAll("%c", String(conf.max_muted_word_length))}</small>
        </div>
      ` : ""}
    </div>

    ${testMask(Mask.ReadLogs) ? `
      <br><br>
      <button id="load-logs">${lang.admin.logs.button}</button>
      <div id="admin-logs"></div>
    ` : ""}
  `, isAdmin ? adminInit : null],
  reset: [(): string => `
    <h1><label for="username">${lang.email.reset.html_title}</label></h1>
    <input placeholder="${lang.account.username_placeholder}" id="username"><br>
    <button id="submit">Submit</button><br><br>
    <a href="/login/">${lang.http.home}</a><br><br>
  `, loggedIn || !conf.email ? null : resetPasswordInit],
  notifications: [(): string => `
    <h1>${lang.notifications.title}</h1>
    <button id="refresh" onclick="refresh()">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button>
    <button id="read">${lang.notifications.read}</button>
    <button id="delete-unread">${lang.notifications.delete}</button><br><br>
    <div id="posts"></div>
    <button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button>
  `, loggedIn ? (): void => { notificationsInit(); timelineInit(); } : null],
  messages: [(): string => `
    <h1>${lang.messages.list_subtitle}</h1>
    <button id="refresh" onclick="refreshMessageList(true);">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button><br><br>
    <div id="user-list"></div>
    <button id="more" onclick="refreshMessageList();" hidden>${lang.generic.load_more}</button>
  `, loggedIn && conf.private_messages ? messageListInit : null],
  message: [(): string => `
    <label for="your-mom" class="pre-wrap header-container"><h1 style="margin-bottom: 0;">${escapeHTML(lang.messages.title.replaceAll("%s", context.display_name))}${inlineFor(
      context.badges,
      ((badge: string): string => ` <span aria-hidden='true' class='user-badge'>${badges[badge]}</span>`)
    )}</h1></label>
    <div class="messages-container">
      <div id="messages-go-here-btw" class="messages"></div>
      <textarea id="your-mom" maxlength="${conf.max_post_length}" placeholder="${escapeHTML(lang.messages.input_placeholder.replaceAll("%s", context.display_name))}"></textarea>
    </div>
  `, loggedIn && conf.private_messages ? messageInit : null],
  user: [(): string => `
    <div id="banner" ${context.gradient ? "class='gradient'" : ""}></div>
    <div>
      <div class="pre-wrap" id="username-main">${escapeHTML(context.display_name)}${inlineFor(
        context.badges,
        ((badge: string): string => ` <span aria-hidden='true' class='user-badge'>${badges[badge]}</span>`)
      )}</div>
    </div>
    <div id="secondary-username-container">
      <a data-link href="/u/${context.username}/lists/" class="no-underline text">
        <div id="username-lower">
          @${context.username}
          ${conf.pronouns && context.pronouns ? `<span id="pronouns">- ${context.pronouns}</span>` : ""}
        </div><br>
        <div id="follow">
          ${lang.user_page.followers.replaceAll("%s", String(context.followers))} -
          ${lang.user_page.following.replaceAll("%s", String(context.following))}
        </div>
      </a>
      <div>${context.is_.blocked ? lang.account.follow_blocked : context.is_.followed ? lang.user_page.follows : ""}</div>
    </div>

    ${conf.user_bios ? `<div class="pre-wrap" id="user-bio"></div>` : ""}

    <button ${context.is_.blocked ? "hidden" : ""} id="refresh" onclick="refresh()">
      ${lang.generic.refresh}
    </button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button>
    <button ${context.is_.blocked || context.is_.self ? "hidden" : ""} id="toggle" data-followed="${+(context.is_.following || context.is_.pending)}" onclick="toggleFollow()">
      ${context.is_.following ? lang.user_page.unfollow : context.is_.pending ? lang.user_page.pending : lang.user_page.follow}
    </button>
    <button ${context.is_.self ? "hidden" : ""} id="block" data-blocked="${+context.is_.blocking}" onclick="toggleBlock()">
      ${context.is_.blocking ? lang.user_page.unblock : lang.user_page.block}
    </button>
    ${conf.private_messages ? `
      <button id="message" ${context.is_.self ? "hidden" : ""} onclick="createMessage()">
        ${lang.user_page.message}
      </button>
    ` : ""}

    <div id="pinned"></div>
    <div id="posts"></div>
    <div id="more-container"><button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button></div>
  `, (): void => { userInit(); !context.is_.blocked && timelineInit(); }],
  "user-lists": [(): string => `
    <div id="banner" ${context.gradient ? "class='gradient'" : ""}></div>
    <div>
      <div class="pre-wrap" id="username-main">${escapeHTML(context.display_name)}${inlineFor(
        context.badges,
        ((badge: string): string => ` <span aria-hidden='true' class='user-badge'>${badges[badge]}</span>`)
      )}</div>
    </div>
    <div id="secondary-username-container">
      <a data-link href="/u/${context.username}/" class="no-underline text">
        <div id="username-lower">
          @${context.username}
          ${conf.pronouns && context.pronouns ? `<span id="pronouns">- ${context.pronouns}</span>` : ""}
        </div><br>
        <div id="follow">
          ${lang.user_page.followers.replaceAll("%s", String(context.followers))} -
          ${lang.user_page.following.replaceAll("%s", String(context.following))}
        </div>
      </a>
      <div>${context.is_.blocked ? lang.account.follow_blocked : context.is_.followed ? lang.user_page.follows : ""}</div>
    </div>

    ${conf.user_bios ? `<div class="pre-wrap" id="user-bio">${linkifyHtml(escapeHTML(context.bio), {
      formatHref: {
        mention: (href: string): string => "/u/" + href.slice(1),
        hashtag: (href: string): string => "/hashtag/" + href.slice(1)
      }
    })}</div>` : ""}

    <div class="lists-container">
      ${context.is_.self ? `
        <div>
          <h2>${lang.user_page.lists_blocks}</h2>
          <button id="blocking-refresh" onclick="loadList('blocking', true);">${lang.generic.refresh}</button><br><br>
          <div id="blocking"></div>
          <button hidden id="blocking-more" onclick="loadList('blocking');">${lang.generic.load_more}</button>
        </div>
      ` : ""}

      ${context.is_.blocked ? "" : `
        <div>
          <h2>${lang.user_page.lists_following}</h2>
          <button id="following-refresh" onclick="loadList('following', true);">${lang.generic.refresh}</button><br><br>
          <div id="following"></div>
          <button hidden id="following-more" onclick="loadList('following');">${lang.generic.load_more}</button>
        </div>

        <div>
          <h2>${lang.user_page.lists_followers}</h2>
          <button id="followers-refresh" onclick="loadList('followers', true);">${lang.generic.refresh}</button><br><br>
          <div id="followers"></div>
          <button hidden id="followers-more" onclick="loadList('followers');">${lang.generic.load_more}</button>
        </div>
      `}
    </div>
  `, userListsInit],
  hashtag: [(): string => `
    <h1>#${context.hashtag}</h1>
    ${context.count} ${context.count == 1 ? lang.hashtag.post_singular : lang.hashtag.post_plural}
    <p id="switch">
      <a data-timeline="random">${lang.hashtag.timeline.random}</a> -
      <a data-timeline="recent" href="javascript:void(0);">${lang.hashtag.timeline.recent}</a> -
      <a data-timeline="liked" href="javascript:void(0);">${lang.hashtag.timeline.liked}</a>
    </p>
    <button id="refresh" onclick="refresh();">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button><br><br>
    <div id="posts"></div>
    <button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button>
  `, (): void => { hashtagInit(); timelineInit(); }],
  pending: [(): string => `
    <h1>${lang.user_page.pending_title}</h1>
    <button id="refresh" onclick="refreshPendingList(true);">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button><br><br>
    <div id="user-list"></div>
    <button id="more" onclick="refreshPendingList();" hidden>${lang.generic.load_more}</button>
  `, loggedIn ? pendingInit : null],
  post: [(): string => `
    ${context.post.parent && context.post.parent.id > 0 ? `<div id="parent"><a data-link id="parent-link" href="/${context.post.parent.comment ? "c" : "p"}/${context.post.parent.id}/">${lang.post_page.comment_parent}</a></div>` : ""}
    <div id="top">${getPostHTML(context.post, context.comment, true, false, false, true)}</div>

    ${loggedIn ? `
      <label for="default-private">${lang.post.type_followers_only}:</label>
      <input id="default-private" type="checkbox" ${defaultPrivate ? "checked" : ""}><br>
      ${conf.content_warnings ? `<input id="c-warning" data-create-post ${context.post.c_warning ? `value="${((context.post.c_warning.startsWith("re: ") ? "" : "re: ") + context.post.c_warning).slice(0, conf.max_content_warning_length)}"` : ""} maxlength="${conf.max_content_warning_length}" placeholder="${lang.home.c_warning_placeholder}"><br>` : ""}
      <textarea autofocus id="post-text" data-create-post maxlength="${conf.max_post_length}" placeholder="${lang.post_page.comment_input_placeholder}">${context.mentions}</textarea><br>
      <button id="post" class="inverted">${lang.generic.post}</button><br>
    ` : ""}

    <p id="switch">
      <a data-timeline="random" href="javascript:void(0);">${lang.post_page.timeline.random}</a> -
      <a data-timeline="newest">${lang.post_page.timeline.newest}</a> -
      <a data-timeline="oldest" href="javascript:void(0);">${lang.post_page.timeline.oldest}</a> -
      <a data-timeline="liked" href="javascript:void(0);">${lang.post_page.timeline.liked}</a>
    </p>

    <button id="refresh" onclick="refresh()">${lang.generic.refresh}</button>
    <button id="load-new" hidden onclick="loadNew()">${lang.generic.show_new.replaceAll("%n", "<span id='load-new-number'>0</span>")}</button><br><br>
    <div id="posts"></div>
    <div id="more-container"><button id="more" onclick="refresh(true)" hidden>${lang.generic.load_more}</button></div>
  `, (): void => { postInit(); timelineInit(); }]
};

function inlineFor(
  iter: any[],
  callback: ((obj: any) => string) | string,
  empty: string=""
): string {
  let out: string = "";

  for (const item of iter) {
    if (typeof callback == "string") {
      out += callback.replaceAll("%s", String(item));
    } else {
      out += callback(item);
    }
  }

  if (out === "") {
    out = empty;
  }

  return out;
}

function registerLinks(element: HTMLElement): void {
  for (const el of element.querySelectorAll("a[data-link]")) {
    el.addEventListener("click", linkEventHandler);
    el.removeAttribute("data-link");
  }
}

function linkEventHandler(event: MouseEvent): void {
  // allow using ctrl to open in a new tab
  if (event.ctrlKey) { return; }

  event.preventDefault();

  // the element.href property automatically adds the whole url (ex. http://localhost:8000/login/ instead of /login/), which is why this is needed
  let path: string = (event.currentTarget as HTMLAnchorElement).getAttribute("href");

  if (location.href == path || location.pathname == path) {
    return;
  }

  redirect(path);
}

function renderPage(): void {
  document.title = `${titleNotificationIndicator ? "[ ! ]" : ""} ${context.strings[0] ? `${context.strings[0]} - ` : ""}${conf.site_name} ${conf.version}`;
  dom("content").dataset.page = context.page;

  for (const interval of killIntervals) {
    clearInterval(interval);
  }

  pageCounter++;
  killIntervals = [];
  profile = null;
  share = null;
  type = null;
  includeUserLink = null;
  includePostLink = null;
  inc = null;
  c = null;
  redirectConfirmation = null;
  lostCause = false;
  timelineConfig = {
    vars: { offset: null, page: 0, first: null, forwardOffset: 0, forwardsCache: []},
    timelines: {},
    url: null,
    disableTimeline: false,
    usePages: false,
    enableForwards: false,
    forwardsHandler: null
  };

  let page;
  if (pages[context.page]) {
    page = pages[context.page];
  } else {
    page = pages[pageNotFound];
  }

  dom("content").innerHTML = page[0]();
  registerLinks(dom("content"));

  if (page[1]) {
    page[1]();
  }

  updateIconBar();
}

function loadContext(url: string, postFunction: () => void=renderPage): void {
  if (contextLoading) {
    return;
  }

  contextLoading = true;

  fetch(`/api/init/context?url=${encodeURIComponent(url.split("?")[0])}`)
    .then((response) => (response.json()))
    .then((json: {
      success: boolean,
      context: _context,
      message?: string,
      set_url?: string
    }) => {
      if (json.success) {
        context = json.context;
        let args: [_context, "", string?] = [context, ""];

        if (json.set_url) {
          args.push(json.set_url);
        } else if (url !== location.pathname) {
          args.push(url);
        }

        if (!hasHistoryBeenUsedYet) {
          history.replaceState(...args);
          hasHistoryBeenUsedYet = true;
        } else {
          history.pushState(...args);
        }

        console.log(context);
        contextLoading = false;
        postFunction();
      } else {
        // This should only happen if ratelimiting occurs
        contextLoading = false;
        toast(`${somethingWentWrong} ${json.message || ""}`, true);
      }
    })
    .catch((err: any) => {
      contextLoading = false;
      toast(`${somethingWentWrong} ${err}`, true);
      throw err;
    })
}

addEventListener("popstate", (e: PopStateEvent): void => {
  if (e.state) {
    context = e.state;
    renderPage();
  }
});

if (typeof initContextLoaded == "undefined") {
  javascriptLoaded = true;
} else {
  init();
}

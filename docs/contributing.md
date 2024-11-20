# Contributing
## Suggesting a feature
If there is a specific thing you want to do, you can make an issue (if an
existing doesn't already exist).

## Getting your code added
Once you finish the feature, you can create a new fork with your code. Then, you
can make a pull request with your new code **into the dev branch**. It will go
through a review process, and may then get pushed into main in a new release,
assuming all of the code works as intended.

## How to compile TypeScript/Less
First, you need to install three npm packages:
`npm i -g less typescript less-plugin-clean-css`

To compile typescript, you can run `tsc` anywhere inside this project.

To compile less, you can run `python compile-less.py` in the root directory of
this project.

## Translating
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
it in [the discord server](https://discord.gg/tH7QnHApwu).
5. When you're done, fork the git repository, add the file, and make a pull
request **to the `dev` branch**. Your changes will likely be added to production
by the next update.

If you want to fix translations or update an existing translation:
1. Fork the repository
2. Make any changes
3. If you want to become a maintainer of that language, add your github username
to the `maintainers` section
4. Make a pull request **to the `dev` branch**

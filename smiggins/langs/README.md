# how to translate
## creating a new translation:
1. make a new yaml file with the abbreviated language name (ex. `fr.yaml` for
   french). you can probably find a language code here: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes

   if the language is a regional language, you can append the country code. (ex.
   `en_GB` for british english).

2. in the meta.yaml file, add the new language code used in the filename to
   the `languages` array.

3. in the newly created language yaml file, add the following:
   - a schema header, for validation:
     `# yaml-language-server: $schema=lang.schema.json`
   - a meta section, with the localized name of the language and any fallback
     languages to use when this language is missing a specific string.

4. continue reading the next section for more information and specifics.

## adding on to an existing translation:
1. start translating any strings that need it. **You are responsible for
   escaping HTML** (ex. `&lt;` instead of `<`).

2. by running the `generator.py` file, you should be able to make sure you
   have a valid language file, and be able to test it out on a local development
   smiggins instance. when using a proper code editor, ex. Visual Studio Code
   (you may need to install the YAML Language Server extension), you should be
   able to have autocompletion features and validation to ensure you have a
   properly formatted language file.

3. if you want to continue to help translate, add your github username to the
   `maintainers` section. if not, you can add your gitub username to the
   `past_maintainers` section to get credit for your work.

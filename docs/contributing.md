# Contributing
## Suggesting a feature
If there is a specific feature you would like to be added, you can make an issue
(if an existing doesn't already exist). **No, I will not be adding images.**

## Getting your code added
> [!WARNING]
> AI-Generated code will not be accepted. If you want to contribute to Smiggins,
> avoid using AI coding tools.

If you want to contrinbute to smiggins, you can create a new fork with your
code. Once you finish writing any changes you made, you can make a pull request
with your new code **into the dev branch** (not main). It will go through a
manual review process, and may then get pushed into main in a new release,
assuming all of your code works as intended.

Note that if you create a pull request, you may be requested to make some
changes to your code, or fix any issues. Don't rely on us to do it for you.

## How to compile TypeScript/Less
First, you need to install three npm packages:
`npm i -g less typescript uglify-js uglifycss`

To compile less and/or typescript, you can run the `compile.sh` script. If you
only want to compile less or typescript, you can run `./compile.sh less` or
`./compile.sh ts` respectively. If for some reason you don't want minified
outputs, you can also run `./compile.sh uncompressed`.

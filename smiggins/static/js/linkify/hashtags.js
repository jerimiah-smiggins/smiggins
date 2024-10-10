(function (linkifyjs) {
    const HashtagToken = linkifyjs.createTokenClass("hashtag", {
        isLink: true
    });
    linkifyjs.registerPlugin("hashtag", function (_ref) {
        let { scanner, parser } = _ref;
        const { POUND, UNDERSCORE } = scanner.tokens;
        const alphanumeric = scanner.tokens.groups.alphanumeric;
        const hash = parser.start.tt(POUND);
        const hashtag = new linkifyjs.State(HashtagToken);
        hash.ta(alphanumeric, hashtag);
        hash.tt(UNDERSCORE, hashtag);
        hashtag.ta(alphanumeric, hashtag);
        hashtag.tt(UNDERSCORE, hashtag);
    });
})(linkify);

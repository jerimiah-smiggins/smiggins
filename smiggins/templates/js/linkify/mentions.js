(function (linkifyjs) {
    const MentionToken = linkifyjs.createTokenClass("mention", {
        isLink: true
    });
    linkifyjs.registerPlugin("mention", function (_ref) {
        let { scanner, parser } = _ref;
        const { HYPHEN, UNDERSCORE, AT } = scanner.tokens;
        const alphanumeric = scanner.tokens.groups.alphanumeric;
        const at = parser.start.tt(AT);
        const mention = new linkifyjs.State(MentionToken);
        at.ta(alphanumeric, mention);
        at.tt(UNDERSCORE, mention);
        at.tt(HYPHEN, mention);
        mention.ta(alphanumeric, mention);
        mention.tt(UNDERSCORE, mention);
        mention.tt(HYPHEN, mention);
    });
})(linkify);

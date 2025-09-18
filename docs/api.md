<style>
  code {
    overflow: scroll;
    white-space: nowrap;
  }
</style>

# API Formats
The API for Smiggins uses a custom format for sending data instead of JSON or
another format, in order to help reduce bandwidth. The format is explained
below:

## Basic Formatting
All responses that use this formatting scheme will have the `Content-Type`
header set to `application/smiggins+octet-stream`.

The first byte of any response are going to be the identifier for what is being
done. For example, any time the first byte of a response starts with a number
from 0x60 - 0x6f, the response is going to be data for posts from a timeline.

Any time a response has an error, the first bit of the identifier byte will be
set to 1, so if something normally has a response code of 0x12 but instead
throws an error, the response code would be 0x92, with the following byte
describing what type of error it is.

Requests to the server will not have a byte like this, as the url already
determines what the request data should be.

Any text fields will be prefixed by one or two bytes (depending on the max
length of the field) to display the length of the text. Any number will be sent
using **big endian**, meaning the number 0x123 would be sent in two bytes, those
being 0x01 0x23, with the most significant bits coming first.

## All response formats
### **/api/user/login**:
### **/api/user/signup**:
`ID XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX`

where:
* ID = the response code (0x01 for login, 0x02 for signup)
* X = the user's token (32 bytes). Should be converted into the hexadecmial
  representation when used for the "token" cookie.

## Error codes
Code|Description
-:|-
`0x00`|No reason specified / Bad request
`0x10`|Invalid username
`0x11`|Username in use
`0x12`|Invalid password
`0x13`|Invalid invite code (when enabled in settings.yaml)
`0x20`|You can't interact with this user
`0x21`|You're blocking this user
`0x30`|Post not found
`0x31`|Can't have a poll with only one option
`0xfe`|Not authenticated
`0xff`|Ratelimited

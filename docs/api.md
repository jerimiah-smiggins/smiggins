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

## Request formats
**POST /api/user/signup**:  
`UL UU... PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP IL IC...`

where:
- `UL` is the length of the username
- `UU...` is the username
- `P` is the sha256 hash of the password as bytes
- `IL` is the length of the invite code (0 if disabled)
- `IC...` is the invite code
---
**POST /api/user/login**:  
`UL UU... PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP`

where:
- `UL` is the length of the username
- `UU...` is the username
- `P` is the sha256 hash of the password as bytes
---
**PATCH /api/user/default_post**:  
**PATCH /api/user/verify_followers**:  
`0000000b`

where:
- `b` is whether or not default post is private or manually verify followers,
  depending on the route.
---
**DELETE /api/user**:  
`PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP`

---
**PATCH /api/user/password**:  
`PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP PP NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN NN`

where:
- `P` is the sha256 hash of the current password as bytes
- `N` is the sha256 hash of the new password as bytes
---
**POST /api/user/follow**:  
**DELETE /api/user/follow**:  
**POST /api/user/block**:  
**DELETE /api/user/block**:  
`UU...`

where:
- `U` is the username
---
**POST /api/post**:  
`fqpc0000 CL CL CC... WL CW... PL [IL PP...]... QI QI QI QI CI CI CI CI`

where:
- `f` is whether or not the post is followers only
- `q` is whether or not there is a quote
- `p` is whether or not there is a poll
- `c` is whether or not there is a comment
- `CL` is the content length (uint16)
- `CC...` is the content
- `WL` is the length of the content warning (uint8), 0 if there is no cw
- `CW` is the content warning
- **if p is true:**
  - `PL` is the number of options in the poll
  - `IL` is the length of each poll option (uint8)
  - `PP...` is the content of each poll option
- `QI` is the quote id (uint32), only if q is true
- `CI` is the comment id (uint32), only if c is true
---
**PATCH /api/user**
`g0000000 DL DN... BL BL BB... R1 G1 B1 R2 G2 B2`

where:
- `g` is whether or not the banner is gradient
- `DL` is the length of the display name (uint8)
- `DN...` is the display name
- `BL` is the length of the bio (int16)
- `BB...` is the bio
- `R1/G1/B1` is the RGB of the first banner color
- `R2/G2/B2` is the RGB of the second banner color
## Successful response formats
**Posts**
This isn't for a specific route, instead this is the format for a post.

`PP PP PP PP TT TT TT TT TT TT TT TT pcqvlu00 CC CC CC CC LL LL QQ QQ MM MM CL CL CO... WL CW... UL UU... DL DD... QI QI QI QI QT QT QT QT QT QT QT QT QL QL QC... QWL QW... QUL QU... QDL QD...`

where:
- `P` is the post id (uint32)
- `T` is the timestamp (uint64)
- `p` is whether or not the post is private
- `c` is whether or not this is a comment (bool)
- `q` is whether or not there is a quote (bool)
- `v` is whether or not you can view the quote (bool)
- `l` is whether or not you've liked the post (bool)
- `u` is whether or not the quote is private (assuming there is a quote)
- `C` is the comment id (uint32), **only if c is true**
- `L` is the number of likes (uint16)
- `Q` is the number of quotes (uint16)
- `M` is the number of comments (uint16)
- `CL` is the length of the content (uint16)
- `CO...` is the content
- `WL` is the length of the content warning (uint8), 0 if there is none
- `CW...` is the content warning
- `UL` is the length of the username (uint8)
- `UU...` is the username
- `DL` is the length of the display name (uint8)
- `DD...` is the display name
- **if q and v are true:**
  - `QI` is the quote id (uint32)
  - `QT` is the quote timestamp (uint64)
  - `QL` is the length of the quote content
  - `QC...` is the quote content
  - `QWL` is the quote content warning length (uint8), 0 if there is none
  - `QW...` is the quote content warning
  - `QUL` is the quote creator username length (uint8)
  - `QU...` is the quote creator username
  - `QDL` is the quote creator display name length (uint8)
  - `QD...` is the quote creator display name
---
**POST /api/user/login**:  
**POST /api/user/signup**:  
**PATCH /api/user/password**:  
`ID XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX XX`

where:
- `ID` is the response code (0x01 for login, 0x02 for signup, 0x23 for change
  password)
- `X` is the user's token (32 bytes). Should be converted into the hexadecmial
  representation when used for the "token" cookie.
---
**POST /api/user/follow**:  
`10 p0000000`

where:
- `p` is whether or not it's pending approval (bool)
---
**GET /api/user**:  
`20 DL DD... BL BL BB... R1 G1 B1 R2 G2 B2 gv000000`

where:
- `DL` is the length of the display name (uint8)
- `DD...` is the display name
- `BL` is the length of the bio (uint16)
- `BB...` is the bio
- `R1/G1/B1` is the RGB of your first banner color
- `R2/G2/B2` is the RGB of your second banner color
- `g` is whether or not the banner is a gradient (bool)
- `v` is whether or not you require followers to be verified (bool)
---
**GET /api/timeline/global**:  
**GET /api/timeline/following**:  
`ID ef00000 PP posts...`

where:
- `ID` is the response code (0x60 for global, 0x61 for following)
- `e` is whether or not it's the end of the timeline
- `f` is whether or not the timeline was requested to be forward
- `P` is the number of posts
---
**GET /api/timeline/user/{username}**:  
`62 DL DD... R1 G1 B1 R2 G2 B2 FL FL FG FG erfbp00 PP posts...`

where:
- `ID` is the response code (0x60 for global, 0x61 for following)
- `DL` is the length of the display name (uint8)
- `DD...` is the display name
- `R1/G1/B1` is the RGB of this user's first banner color
- `R2/G2/B2` is the RGB of this user's second banner color
- `FL` is the number of followers this user has (uint16)
- `FG` is the number of people this user is following (uint16)
- `e` is whether or not it's the end of the timeline
- `r` is whether or not the timeline was requested to be forward
- `f` is whether or not you are blocking this user
- `f` is whether or not you have a pending follow request
- `b` is whether or not you are following this user
- `P` is the number of posts
---
**GET /api/timeline/post/{post_id}**:  
`63 main_post 00 ef00000 PP posts...`

where:
- `e` is whether or not it's the end of the timeline
- `f` is whether or not the timeline was requested to be forward
- `P` is the number of posts
---
**DELETE /api/user/follow**: `11`  
**POST /api/user/block**: `12`  
**DELETE /api/user/block**: `13`  
**PATCH /api/user**: `21`  
**DELETE /api/user**: `22`  
**PATCH /api/user/default_post**: `24`  
**PATCH /api/user/verify_followers**: `25`  
**POST /api/post/like/{post_id}**: `31`  
**DELETE /api/post/like/{post_id}**: `32`
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

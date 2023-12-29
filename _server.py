# Non-default library dependencies:
# - flask (pip install flask)

from _server_module import *

# Make sure all required files for saving exist
ensure_file(   ABSOLUTE_SAVING_PATH,            folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}users",     folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}posts",     folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}tokens",    folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}usernames", folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}posts/comments", folder=True)
ensure_file(f"{ABSOLUTE_SAVING_PATH}next_post.txt", default_value="1")
ensure_file(f"{ABSOLUTE_SAVING_PATH}next_user.txt", default_value="1")
ensure_file(f"{ABSOLUTE_SAVING_PATH}next_comment.txt", default_value="1")

# Initialize flask app
app = flask.Flask(__name__)

# Create basic routes
app.route("/", methods=["GET"])(create_html_serve("index.html", logged_in_redir=True))
app.route("/login", methods=["GET"])(create_html_serve("login.html", logged_in_redir=True))
app.route("/signup", methods=["GET"])(create_html_serve("signup.html", logged_in_redir=True))
app.route("/settings", methods=["GET"])(get_settings_page)

# Create app routes
app.route("/home", methods=["GET"])(create_html_serve("home.html", logged_out_redir=True))
app.route("/logout", methods=["GET"])(create_html_serve("logout.html"))
app.route("/u/<path:user>", methods=["GET"])(get_user_page)
app.route("/p/<path:post_id>", methods=["GET"])(get_post_page)
app.route("/c/<path:post_id>", methods=["GET"])(get_comment_page)

# Create static routes
app.route("/css/<path:filename>", methods=["GET"])(create_folder_serve("css"))
app.route("/js/<path:filename>", methods=["GET"])(create_folder_serve("js"))
app.route("/img/<path:filename>", methods=["GET"])(create_folder_serve("img"))
app.route("/robots.txt", methods=["GET"])(create_html_serve("robots.txt"))

# Create account api routes
app.route("/api/account/signup", methods=["POST"])(api_account_signup)
app.route("/api/account/login", methods=["POST"])(api_account_login)

# Create user api routes
app.route("/api/user/follower/add", methods=["POST"])(api_user_follower_add)
app.route("/api/user/follower/remove", methods=["DELETE"])(api_user_follower_remove)
app.route("/api/user/settings/theme", methods=["POST"])(api_user_settings_theme)
app.route("/api/user/settings/color", methods=["POST"])(api_user_settings_color)
app.route("/api/user/settings/display-name", methods=["POST"])(api_user_settings_display_name)

# Create post api routes
app.route("/api/post/create", methods=["PUT"])(api_post_create)
app.route("/api/post/following", methods=["GET"])(api_post_list_following)
app.route("/api/post/recent", methods=["GET"])(api_post_list_recent)
app.route("/api/post/like/add", methods=["POST"])(api_post_like_add)
app.route("/api/post/like/remove", methods=["DELETE"])(api_post_like_remove)
app.route("/api/post/user/<path:user>", methods=["GET"])(api_post_list_user)

# Create comment api routes
app.route("/api/comments", methods=["GET"])(api_comment_list)
app.route("/api/comment/create", methods=["PUT"])(api_comment_create)
app.route("/api/comment/like/add", methods=["POST"])(api_comment_like_add)
app.route("/api/comment/like/remove", methods=["DELETE"])(api_comment_like_remove)

# Create routes for forcing all http response codes
for i in [
    100, 101, 102, 103,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 305, 306, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
            411, 412, 413, 414, 415, 416, 417, 418, 421, 422,
            423, 424, 425, 426, 428, 429, 431, 451,
    500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511
]:
    app.route(f"/{i}")(create_error_serve(i))

# What to do on certain errors
@app.errorhandler(500)
def error_500(err): return create_html_serve("500.html")(), 500

@app.errorhandler(404)
def error_404(err): return create_html_serve("404.html")(), 404

# Start the flask server if the program is the main program
# running and not imported from another program
if __name__ == "__main__":
    app.run(port=80, debug=DEBUG)

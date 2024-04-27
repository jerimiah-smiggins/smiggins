import backend.helper as helper

from django.http import HttpResponse

# These two functions are referenced in smiggins/urls.py
def _404(request, exception) -> HttpResponse:
    response = helper.get_HTTP_response(request, "posts/404.html")
    response.status_code = 404
    return response

def _500(request) -> HttpResponse:
    response = helper.get_HTTP_response(request, "posts/500.html")
    response.status_code = 500
    return response

from .variables import ALLOW_SCRAPING, CUSTOM_HEADERS


class CustomHeaders:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        response["TDM-Reservation"] = int(not ALLOW_SCRAPING)

        for header, contents in CUSTOM_HEADERS.items():
            if header not in response:
                response[header] = str(contents)

        return response

from .variables import ALLOW_SCRAPING

class AddTDMReservation:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["TDM-Reservation"] = int(not ALLOW_SCRAPING)
        return response

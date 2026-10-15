from django.conf import settings


def site_info(request):
    return {
        'CONTACT_EMAIL': getattr(settings, 'CONTACT_EMAIL', ''),
        'CONTACT_PHONE': getattr(settings, 'CONTACT_PHONE', ''),
        'CONTACT_LOCATION': getattr(settings, 'CONTACT_LOCATION', ''),
    }

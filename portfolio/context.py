import os
from django.conf import settings


def site_info(request):
    email = getattr(settings, 'CONTACT_EMAIL', '')
    path = getattr(request, 'path', '') or ''
    if path == '/en' or path.startswith('/en/'):
        email = os.environ.get('CONTACT_EMAIL_EN') or email
    return {
        'CONTACT_EMAIL': email,
        'CONTACT_PHONE': getattr(settings, 'CONTACT_PHONE', ''),
        'CONTACT_LOCATION': getattr(settings, 'CONTACT_LOCATION', ''),
    }

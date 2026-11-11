from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def cf_img(url, width, q=72):
    """Miniatura przez Cloudflare Image Transformations.

    Działa tylko wtedy, gdy R2_CUSTOM_DOMAIN jest proxowany przez Cloudflare,
    włączone są Transformations i ustawiono USE_CF_IMAGES=1. W każdym innym
    przypadku zwraca oryginalny adres, więc nic się nie psuje.
    """
    dom = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)
    if not (url and dom and getattr(settings, 'USE_CF_IMAGES', False) and dom in url):
        return url
    return f"https://{dom}/cdn-cgi/image/width={width},quality={q},format=auto{url.split(dom, 1)[1]}"

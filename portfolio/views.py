from django.shortcuts import render
from .models import Media

def home(request, lang='pl'):
    top_level_media = Media.objects.filter(parent_album__isnull=True).order_by('order')
    all_media = Media.objects.all()
    return render(request, 'home.html', {
        'top_level_media': top_level_media,
        'media_items': all_media,
        'lang': lang
    })

def galeria(request, lang='pl'):
    media_items = Media.objects.exclude(media_type='album').order_by('order')
    return render(request, 'galeria.html', {'media_items': media_items, 'lang': lang})

def kontakt(request, lang='pl'):
    return render(request, 'kontakt.html', {'lang': lang})
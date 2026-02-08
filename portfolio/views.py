from django.shortcuts import render
from .models import Media, Album

def home(request, lang='pl'):
    albums = Album.objects.all()
    standalone_media = Media.objects.filter(album__isnull=True)
    all_media = Media.objects.all()
    return render(request, 'home.html', {
        'albums': albums, 
        'standalone_media': standalone_media, 
        'media_items': all_media, 
        'lang': lang
    })

def galeria(request, lang='pl'):
    media_items = Media.objects.all()
    return render(request, 'galeria.html', {'media_items': media_items, 'lang': lang})

def kontakt(request, lang='pl'):
    return render(request, 'kontakt.html', {'lang': lang})
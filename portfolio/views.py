from django.shortcuts import render
from .models import Media

def home(request, lang='pl'):
    media_items = Media.objects.all()
    return render(request, 'home.html', {'media_items': media_items, 'lang': lang})

def galeria(request, lang='pl'):
    media_items = Media.objects.all()
    return render(request, 'galeria.html', {'media_items': media_items, 'lang': lang})

def kontakt(request, lang='pl'):
    return render(request, 'kontakt.html', {'lang': lang})
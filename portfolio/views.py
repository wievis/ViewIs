from django.shortcuts import render
from django.core.mail import send_mail
from django.http import JsonResponse
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
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        message = request.POST.get('message')

        full_message = f"Od: {first_name} {last_name} <{email}>\n\nTreść:\n{message}"
        
        send_mail(
            f"Nowa wiadomość od {first_name} {last_name}",
            full_message,
            email,
            ['wielgoszviz@gmail.com'],
            fail_silently=False,
        )
        return JsonResponse({'status': 'success'})

    return render(request, 'kontakt.html', {'lang': lang})
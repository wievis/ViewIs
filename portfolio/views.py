import os
from django.shortcuts import render
from django.http import JsonResponse
from django.core.mail import send_mail
from .models import Media

def home(request, lang='pl'):
    top_level_media = Media.objects.filter(parent_album__isnull=True).order_by('order').prefetch_related('children')
    media_items = Media.objects.filter(file__isnull=False).exclude(file='').order_by('parent_album__order', 'order')
    return render(request, 'home.html', {'top_level_media': top_level_media, 'media_items': media_items, 'lang': lang})

def galeria(request, lang='pl'):
    media_items = Media.objects.filter(file__isnull=False).exclude(file='').order_by('order')
    return render(request, 'galeria.html', {'media_items': media_items, 'lang': lang})

def kontakt(request, lang='pl'):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        email = request.POST.get('email', '')
        message = request.POST.get('message', '')
        full_message = f"Od: {first_name} {last_name} <{email}>\n\n{message}"
        try:
            send_mail(
                subject=f"Kontakt: {first_name} {last_name}",
                message=full_message,
                from_email=os.environ.get('EMAIL_HOST_USER'),
                recipient_list=['wielgoszviz@gmail.com'],
                fail_silently=False,
            )
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return render(request, 'kontakt.html', {'lang': lang})

def custom_404(request, exception):
    lang = 'en' if '/en/' in request.path else 'pl'
    return render(request, '404.html', {'lang': lang}, status=404)
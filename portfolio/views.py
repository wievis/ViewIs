import os
import base64
import json
from django.shortcuts import render
from django.http import JsonResponse
from .models import Media
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText

def send_gmail_api(subject, body, to_email):
    token_data = os.environ.get('GMAIL_TOKEN')
    creds_data = json.loads(token_data)
    creds = Credentials.from_authorized_user_info(creds_data)
    service = build('gmail', 'v1', credentials=creds)
    message = MIMEText(body)
    message['to'] = to_email
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(userId='me', body={'raw': raw}).execute()

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
            send_gmail_api(f"Kontakt: {first_name}", full_message, 'wielgoszviz@gmail.com')
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return render(request, 'kontakt.html', {'lang': lang})

def custom_404(request, exception):
    lang = 'en' if '/en/' in request.path else 'pl'
    return render(request, '404.html', {'lang': lang}, status=404)
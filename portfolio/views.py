import os
import json
import logging
import urllib.request
import boto3
from botocore.config import Config
from django.conf import settings
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.core.validators import validate_email

logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'home.html')

def custom_404(request, exception=None):
    return render(request, '404.html', status=404)

def ows(request):
    return render(request, 'ows.html')

def get_upload_url(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Niedozwolona metoda'}, status=405)
    
    filename = request.POST.get('filename')
    if not filename:
        return JsonResponse({'status': 'error', 'message': 'Brak nazwy pliku'}, status=400)
    
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4')
    )
    
    key = f"uploads/{os.urandom(8).hex()}_{filename}"
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': key},
        ExpiresIn=3600
    )
    
    file_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}" if settings.AWS_S3_CUSTOM_DOMAIN else key
    return JsonResponse({'status': 'ok', 'upload_url': presigned_url, 'file_url': file_url})

def kontakt(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        phone = request.POST.get('phone', '').strip()
        message = request.POST.get('message', '').strip()
        tender_deadline = request.POST.get('tender_deadline', '').strip()
        files_link = request.POST.get('files_link', '').strip()
        uploaded_file_url = request.POST.get('uploaded_file_url', '').strip()
        services = request.POST.getlist('services')

        if not email or (not message and not files_link and not uploaded_file_url):
            return JsonResponse({'status': 'error', 'message': 'Podaj adres e-mail oraz opisz zadanie lub dodaj pliki.'})

        try:
            validate_email(email)
        except Exception:
            return JsonResponse({'status': 'error', 'message': 'Niepoprawny adres e-mail.'})

        resend_api_key = os.environ.get('RESEND_API_KEY', '')
        if not resend_api_key:
            return JsonResponse({'status': 'error', 'message': 'Błąd konfiguracji poczty.'})

        services_str = ", ".join(services) if services else "Nie określono"
        full_body = (
            f"Nowe zapytanie ofertowe ViewIs:\n"
            f"E-mail: {email}\n"
            f"Telefon: {phone}\n"
            f"Termin składania ofert: {tender_deadline}\n"
            f"Wybrane usługi: {services_str}\n"
            f"Link do dokumentacji: {files_link}\n"
            f"Plik w R2: {uploaded_file_url}\n\n"
            f"Opis zadania:\n{message}"
        )

        payload = {
            "from": "ViewIs Zapytania <kontakt@viewis.pl>",
            "to": [getattr(settings, 'CONTACT_EMAIL', 'kontakt@viewis.pl')],
            "reply_to": email,
            "subject": f"Zapytanie ofertowe: {email}",
            "text": full_body
        }

        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {resend_api_key.strip()}",
                "Content-Type": "application/json",
                "User-Agent": "ViewIs-Website"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return JsonResponse({'status': 'ok', 'message': 'Zapytanie zostało przesłane. Wycenę otrzymasz w ciągu 3 godzin.'})
        except Exception as err:
            logger.error(f"Błąd wysyłki e-mail: {err}")
            return JsonResponse({'status': 'error', 'message': 'Błąd serwera. Spróbuj ponownie lub napisz bezpośrednio na e-mail.'})

    return redirect('/#kontakt')

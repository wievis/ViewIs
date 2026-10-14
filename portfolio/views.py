import os
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, FileResponse
from django.core.mail import send_mail
from django.views.decorators.clickjacking import xframe_options_exempt
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

def mep_landing(request, lang='pl'):
    return render(request, 'mep.html', {'lang': lang})

@xframe_options_exempt
def mep_panel(request):
    return render(request, 'mep_panel.html')

@xframe_options_exempt
def mep_viewer(request):
    return render(request, 'mep_viewer.html')

def mep_manifest(request):
    manifest_path = os.path.join(os.path.dirname(__file__), 'templates', 'mep_manifest.xml')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        content = f.read()
    response = HttpResponse(content, content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="viewis-mep-manifest.xml"'
    return response

def mep_download_zip(request):
    zip_path = os.path.join(os.path.dirname(__file__), 'static', 'viewis-mep-link.zip')
    return FileResponse(open(zip_path, 'rb'), as_attachment=True, filename='viewis-mep-link.zip')

def custom_404(request, exception):
    lang = 'en' if '/en/' in request.path else 'pl'
    return render(request, '404.html', {'lang': lang}, status=404)

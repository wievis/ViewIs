import os
import logging
from django.conf import settings
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse, FileResponse
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.views.decorators.clickjacking import xframe_options_exempt
from .models import Media, Article

logger = logging.getLogger(__name__)

CATEGORY_EN = {
    'viz': 'Visualizations', 'anim': 'Animations', 'env': 'Environments & mockups',
    'model': '3D models', 'other': 'Other',
}


def _localize(a, lang):
    en = lang == 'en'
    a.d_title = (a.title_en if en and a.title_en else a.title)
    a.d_lead = (a.lead_en if en and a.lead_en else a.lead)
    a.d_content = (a.content_en if en and a.content_en else a.content)
    return a


def home(request, lang='pl'):
    featured = []
    try:
        base = Media.objects.filter(media_type='image', file__isnull=False).exclude(file='')
        featured = list(base.filter(featured=True)[:6]) or list(base[:6])
    except Exception:
        logger.exception('home: nie udalo sie pobrac realizacji')
    return render(request, 'home.html', {'featured': featured, 'lang': lang, 'section': 'home'})


def portfolio(request, lang='pl'):
    top_level_media = list(Media.objects.filter(parent_album__isnull=True).order_by('order').prefetch_related('children'))
    media_items = Media.objects.filter(file__isnull=False).exclude(file='').select_related('hdr_setting').order_by('parent_album__order', 'order')
    present = {m.category for m in top_level_media if m.category}
    categories = []
    for key, label in Media.CATEGORIES:
        if key in present:
            categories.append((key, CATEGORY_EN[key] if lang == 'en' else label))
    return render(request, 'portfolio.html', {
        'top_level_media': top_level_media, 'media_items': media_items,
        'categories': categories, 'lang': lang, 'section': 'portfolio',
    })


def about(request, lang='pl'):
    return render(request, 'about.html', {'lang': lang, 'section': 'about'})


def _clean(s, n=100):
    return ' '.join((s or '').split())[:n]


def kontakt(request, lang='pl'):
    if request.method == 'POST':
        if request.POST.get('website'):  # honeypot
            return JsonResponse({'status': 'success'})
        first_name = _clean(request.POST.get('first_name'))
        last_name = _clean(request.POST.get('last_name'))
        email = _clean(request.POST.get('email'), 200)
        message = (request.POST.get('message') or '').strip()[:5000]
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'status': 'error', 'message': 'invalid email'}, status=400)
        if not message:
            return JsonResponse({'status': 'error', 'message': 'empty message'}, status=400)
        full_message = f"Od: {first_name} {last_name} <{email}>\n\n{message}"
        try:
            EmailMessage(
                subject=f"Kontakt: {first_name} {last_name}".strip(),
                body=full_message,
                from_email=os.environ.get('EMAIL_HOST_USER'),
                to=[getattr(settings, 'CONTACT_EMAIL', 'wielgoszviz@gmail.com')],
                reply_to=[email],
            ).send(fail_silently=False)
            return JsonResponse({'status': 'success'})
        except Exception:
            logger.exception('kontakt: blad wysylki')
            return JsonResponse({'status': 'error'}, status=500)
    return render(request, 'kontakt.html', {'lang': lang, 'section': 'kontakt'})


def mep_landing(request, lang='pl'):
    return render(request, 'mep.html', {'lang': lang, 'section': 'mep'})


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


def sitemap(request):
    names = ['home', 'home_en', 'portfolio', 'portfolio_en', 'articles', 'articles_en',
             'about', 'about_en', 'mep_landing', 'mep_landing_en', 'kontakt', 'kontakt_en']
    urls = [request.build_absolute_uri(reverse(n)) for n in names]
    try:
        for a in Article.objects.filter(published=True):
            urls.append(request.build_absolute_uri(reverse('article_detail', args=[a.slug])))
            urls.append(request.build_absolute_uri(reverse('article_detail_en', args=[a.slug])))
    except Exception:
        pass
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n'
    return HttpResponse(xml, content_type='application/xml')


def custom_404(request, exception):
    lang = 'en' if '/en/' in request.path else 'pl'
    return render(request, '404.html', {'lang': lang}, status=404)


from .articles_data import get_articles, get_article_by_slug
from django.http import Http404

def articles_list(request):
    articles = get_articles()
    return render(request, 'articles_list.html', {'articles': articles})


from .articles_data import get_articles, get_article_by_slug
from django.http import Http404

def article_list(request):
    articles = get_articles()
    return render(request, 'articles_list.html', {'articles': articles})

def articles_list(request):
    return article_list(request)




def article_detail(request, slug):
    article = get_article_by_slug(slug)
    if not article:
        raise Http404("Artykuł nie został odnaleziony")
    
    ctx = {'article': article}
    static_lsp = os.path.join(os.path.abspath(os.getcwd()), "portfolio", "static", "lsp")
    
    if slug == "autocad-lisp-narzedzia-przyspieszajace-prace":
        p = os.path.join(static_lsp, "viewis-cad-tools.lsp")
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                ctx['unified_code'] = f.read()
    elif slug == "autolisp-pierwsze-kroki-automatyczne-ladowanie":
        p = os.path.join(static_lsp, "viewis-autolisp-loader.lsp")
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                ctx['loader_code'] = f.read()
    
    return render(request, article['template'], ctx)
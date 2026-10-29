import os
import json
from django.conf import settings
from django.templatetags.static import static
from django.urls import reverse
from .articles_data import get_article_by_slug

SITE = 'https://www.viewis.pl'
NAME = 'ViewIs'
PERSON = 'Maciej Wielgosz'

PAIRS = {
    'home': 'home_en',
    'portfolio': 'portfolio_en',
    'articles': 'articles_en',
    'article_detail': 'article_detail_en',
    'about': 'about_en',
    'kontakt': 'kontakt_en',
    'mep_landing': 'mep_landing_en',
}
EN_TO_PL = {v: k for k, v in PAIRS.items()}

SEO = {
    'home': {
        'pl': ('ViewIs | Inżynieria Danych BIM/CAD i Przedmiary IFC',
               'Przedmiary z IFC i DWG, delta rewizji, automatyzacja Excela. Wycena w 1–2 h, gotowy arkusz z formułami w 24–48 h. Prześlij pliki do analizy.'),
        'en': ('ViewIs | BIM/CAD Data Engineering & IFC Takeoffs',
               'Quantity takeoffs from IFC and DWG, revision deltas, Excel automation. Quote in 1–2 h, finished workbook in 24–48 h. Send your files for analysis.'),
    },
    'portfolio': {
        'pl': ('Portfolio 3D: Wizualizacje Architektoniczne i Makiety | ViewIs',
               'Wybrane realizacje: fotorealistyczne wizualizacje, animacje, interaktywne makiety i modele 3D w przeglądarce. Zobacz portfolio Macieja Wielgosza.'),
        'en': ('3D Portfolio: Architectural Visualization & Mockups | ViewIs',
               'Selected work: photorealistic visualizations, animations, interactive mockups and 3D models in the browser. Browse the portfolio of Maciej Wielgosz.'),
    },
    'articles': {
        'pl': ('Artykuły: Automatyzacja CAD, AutoLISP i MAXScript | ViewIs',
               'Praktyczne poradniki i gotowy kod: AutoLISP w AutoCAD, MAXScript w 3ds Max, automatyzacja CAD/BIM i Excela. Konfiguracja krok po kroku.'),
        'en': ('Articles: CAD Automation, AutoLISP & MAXScript | ViewIs',
               'Practical guides and ready-to-use code: AutoLISP for AutoCAD, MAXScript for 3ds Max, CAD/BIM and Excel automation. Step-by-step setup.'),
    },
    'about': {
        'pl': ('O mnie: Maciej Wielgosz, BIM/CAD, 3D i Automatyzacja | ViewIs',
               'Łączę metodykę BIM, grafikę 3D i programowanie narzędzi: przedmiary z IFC, Unreal Engine, Python, AutoLISP, Web 3D. Łódź, praca zdalna.'),
        'en': ('About: Maciej Wielgosz, BIM/CAD, 3D & Automation | ViewIs',
               'I combine BIM, 3D graphics and custom tool development: IFC takeoffs, Unreal Engine, Python, AutoLISP, Web 3D. Based in Łódź, working remotely.'),
    },
    'kontakt': {
        'pl': ('Kontakt i Wycena Przedmiaru z IFC/DWG w 1–2 h | ViewIs',
               'Prześlij pliki IFC, DWG lub XLSX i opisz zadanie. Odpowiedź i wycena w 1–2 godziny, wynik w 24–48 h. NDA na życzenie. Łódź, praca zdalna.'),
        'en': ('Contact & IFC/DWG Takeoff Quote in 1–2 h | ViewIs',
               'Send your IFC, DWG or XLSX files and describe the task. Reply and quote within 1–2 hours, results in 24–48 h. NDA on request. Łódź, remote work.'),
    },
    'mep_landing': {
        'pl': ('Przedmiary z IFC i DWG, Delta Rewizji, Excel | ViewIs',
               'Przedmiary kanałów, rurociągów i armatury z modeli IFC i rysunków DWG. Aktywne formuły, bilans 1:1 z modelem 3D, naddatki montażowe. Wynik w 24–48 h.'),
        'en': ('Takeoffs from IFC & DWG, Revision Delta, Excel | ViewIs',
               'Takeoffs of ducts, pipework and fittings from IFC models and DWG drawings. Live formulas, 1:1 balance with the 3D model, installation allowances. Delivered in 24–48 h.'),
    },
}

ARTICLE_TITLES = {
    'maxscript-hot-reload-automatyczne-ladowanie': {
        'pl': 'Jak używać MAXScript: macroScript i hot-reload w 3ds Max | ViewIs',
        'en': 'How to use MAXScript: macroScript & Hot-Reload in 3ds Max | ViewIs',
    },
    'autocad-lisp-narzedzia-przyspieszajace-prace': {
        'pl': 'Funkcje, których brakuje w AutoCAD: AutoLISP, DWT, pola | ViewIs',
        'en': 'Features AutoCAD Is Missing: AutoLISP, DWT, Area Totals | ViewIs',
    },
    'autolisp-pierwsze-kroki-automatyczne-ladowanie': {
        'pl': 'Jak używać AutoLISP: Trusted Paths i auto-ładowanie .lsp | ViewIs',
        'en': 'How to use AutoLISP: Trusted Paths & Auto-Loading .lsp | ViewIs',
    },
}

CRUMBS = {
    'articles': ('Artykuły', 'Articles'),
    'portfolio': ('Portfolio', 'Portfolio'),
    'about': ('O mnie', 'About'),
    'kontakt': ('Kontakt', 'Contact'),
    'mep_landing': ('Przedmiary', 'Quantity takeoffs'),
}

PAGE_TYPES = {
    'home': 'WebPage',
    'portfolio': 'CollectionPage',
    'articles': 'CollectionPage',
    'about': 'AboutPage',
    'kontakt': 'ContactPage',
    'mep_landing': 'WebPage',
}

SERVICES = {
    'pl': ['Przedmiary instalacji (MEP) z IFC i DWG', 'Audyt i naprawa modeli IFC', 'Rejestr zmian i delta rewizji',
           'Działki i teren 3D', 'Narzędzia i automatyzacja Excela', 'Makiety cyfrowe i 3D'],
    'en': ['MEP takeoffs from IFC and DWG', 'IFC model audit and repair', 'Change register and revision delta',
           'Parcels and 3D terrain', 'Excel tools and automation', 'Digital and 3D mockups'],
}

KNOWS = ['BIM', 'IFC', 'AutoCAD', 'Revit', 'Unreal Engine', '3ds Max', 'Python', 'AutoLISP',
         'MAXScript', 'Three.js', 'Django', 'Microsoft Excel']


def _trim(text, limit=155):
    text = ' '.join((text or '').split())
    if len(text) <= limit:
        return text
    cut = text[:limit - 1].rsplit(' ', 1)[0].rstrip(' ,.;:-–')
    return cut + '…'


def _email(en):
    email = getattr(settings, 'CONTACT_EMAIL', '')
    if en:
        email = os.environ.get('CONTACT_EMAIL_EN') or email
    return email


def _build(request):
    match = getattr(request, 'resolver_match', None)
    if not match or not match.url_name:
        return {}
    name = match.url_name
    key = EN_TO_PL.get(name, name)
    if key not in PAIRS:
        return {}
    en = name in EN_TO_PL
    lang = 'en' if en else 'pl'
    i = 1 if en else 0

    slug = match.kwargs.get('slug') if key == 'article_detail' else None
    kwargs = {'slug': slug} if slug else {}
    url_pl = SITE + reverse(key, kwargs=kwargs)
    url_en = SITE + reverse(PAIRS[key], kwargs=kwargs)
    canonical = url_en if en else url_pl

    article = get_article_by_slug(slug, lang) if slug else None
    if slug and not article:
        return {}

    if article:
        title = ARTICLE_TITLES.get(slug, {}).get(lang) or (article['title'] + ' | ViewIs')
        description = _trim(article['lead'])
    else:
        title, description = SEO[key][lang]
        description = _trim(description)

    image = SITE + static('CEO-background-1200-630.jpg')
    image_alt = 'ViewIs – BIM/CAD data engineering' if en else 'ViewIs – inżynieria danych BIM/CAD'
    email = _email(en)
    phone = getattr(settings, 'CONTACT_PHONE', '')

    person_id = SITE + '/#person'
    service_id = SITE + '/#service'
    site_id = SITE + '/#website'
    address = {'@type': 'PostalAddress', 'addressLocality': 'Łódź', 'addressCountry': 'PL'}

    person = {
        '@type': 'Person',
        '@id': person_id,
        'name': PERSON,
        'url': SITE + '/',
        'image': SITE + static('image/viewis-portrait.jpeg'),
        'jobTitle': 'Computer Designer',
        'description': ('BIM/CAD data engineer: IFC and DWG takeoffs, 3D visualization and pipeline automation.' if en
                        else 'Inżynier danych BIM/CAD: przedmiary z IFC i DWG, wizualizacje 3D i automatyzacja procesów.'),
        'address': address,
        'knowsAbout': KNOWS,
        'knowsLanguage': ['pl', 'en'],
        'worksFor': {'@id': service_id},
    }

    service = {
        '@type': 'ProfessionalService',
        '@id': service_id,
        'name': NAME,
        'url': SITE + '/',
        'description': SEO['home'][lang][1],
        'image': image,
        'logo': {'@type': 'ImageObject', 'url': SITE + static('image/icon.png')},
        'founder': {'@id': person_id},
        'address': address,
        'areaServed': [{'@type': 'Country', 'name': 'Poland' if en else 'Polska'}],
        'availableLanguage': ['Polish', 'English'],
        'serviceType': SERVICES[lang],
        'knowsAbout': KNOWS,
        'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': 'ViewIs services' if en else 'Usługi ViewIs',
            'itemListElement': [
                {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': s}} for s in SERVICES[lang]
            ],
        },
    }
    if email:
        service['email'] = email
        service['contactPoint'] = {
            '@type': 'ContactPoint',
            'contactType': 'sales',
            'email': email,
            'availableLanguage': ['Polish', 'English'],
        }
    if phone:
        service['telephone'] = phone

    website = {
        '@type': 'WebSite',
        '@id': site_id,
        'url': SITE + '/',
        'name': NAME,
        'inLanguage': ['pl', 'en'],
        'publisher': {'@id': service_id},
    }

    if article:
        page = {
            '@type': 'TechArticle',
            '@id': canonical + '#article',
            'headline': article['title'],
            'description': description,
            'inLanguage': lang,
            'url': canonical,
            'mainEntityOfPage': canonical,
            'image': image,
            'articleSection': article.get('category', ''),
            'keywords': ', '.join(article.get('tags', [])),
            'author': {'@id': person_id},
            'publisher': {'@id': service_id},
            'isPartOf': {'@id': site_id},
        }
    else:
        page = {
            '@type': PAGE_TYPES[key],
            '@id': canonical + '#webpage',
            'url': canonical,
            'name': title,
            'description': description,
            'inLanguage': lang,
            'isPartOf': {'@id': site_id},
            'primaryImageOfPage': {'@type': 'ImageObject', 'url': image},
        }
        if key == 'about':
            page['mainEntity'] = {'@id': person_id}
        if key == 'home':
            page['about'] = {'@id': service_id}

    graph = [person, service, website, page]

    crumbs = [('Home' if en else 'Strona główna', SITE + ('/en/' if en else '/'))]
    if article:
        crumbs.append((CRUMBS['articles'][i], SITE + reverse('articles_en' if en else 'articles')))
        crumbs.append((article['title'], canonical))
    elif key != 'home':
        crumbs.append((CRUMBS[key][i], canonical))
    if len(crumbs) > 1:
        graph.append({
            '@type': 'BreadcrumbList',
            'itemListElement': [
                {'@type': 'ListItem', 'position': n + 1, 'name': label, 'item': url}
                for n, (label, url) in enumerate(crumbs)
            ],
        })

    jsonld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)
    jsonld = jsonld.replace('<', '\\u003c')

    return {
        'title': title,
        'og_title': title,
        'description': description,
        'canonical': canonical,
        'url_pl': url_pl,
        'url_en': url_en,
        'image': image,
        'image_alt': image_alt,
        'og_type': 'article' if article else 'website',
        'jsonld': jsonld,
    }


def site_info(request):
    path = getattr(request, 'path', '') or ''
    en = path == '/en' or path.startswith('/en/')
    email = getattr(settings, 'CONTACT_EMAIL', '')
    if en:
        email = os.environ.get('CONTACT_EMAIL_EN') or email
    try:
        seo = _build(request)
    except Exception:
        seo = {}
    return {
        'CONTACT_EMAIL': email,
        'CONTACT_PHONE': getattr(settings, 'CONTACT_PHONE', ''),
        'CONTACT_LOCATION': getattr(settings, 'CONTACT_LOCATION', ''),
        'seo': seo,
    }

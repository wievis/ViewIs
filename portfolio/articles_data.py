ARTICLES = [
    {
        "slug": "maxscript-hot-reload-automatyczne-ladowanie",
        "title": "Jak używać MAXScript",
        "title_en": "How to use MAXScript",
        "category": "Workflow",
        "category_en": "Workflow",
        "tags": ["3ds Max", "MAXScript"],
        "lead": "Kompletny przewodnik po konfiguracji środowiska i pisaniu skryptów w 3ds Max bez restartu programu: jak stworzyć własny macroScript, przypisać go do paska narzędzi i automatycznie przeładowywać kod w locie.",
        "lead_en": "A complete guide to setting up your environment and writing scripts in 3ds Max without restarting the program: how to create your own macroScript, assign it to a toolbar and automatically reload code on the fly.",
        "template": "articles/maxscript_getting_started.html"
    },
    {
        "slug": "autocad-lisp-narzedzia-przyspieszajace-prace",
        "title": "Funkcje jakich brakuje w AutoCAD",
        "title_en": "Functions AutoCAD is missing",
        "category": "Automatyzacja",
        "category_en": "Automation",
        "tags": ["AutoCAD", "AutoLISP"],
        "lead": "Czyli moje efektywne narzędzia bez których nawet nie zaczynam pracy. Odwracanie zaznaczenia, zliczanie powierzchni wielu konturów oraz zapis własnego szablonu.",
        "lead_en": "My most effective tools, the ones I do not start work without: reversing a selection, summing the area of many contours and saving your own template.",
        "template": "articles/autocad_lisp_tools.html"
    },
    {
        "slug": "autolisp-pierwsze-kroki-automatyczne-ladowanie",
        "title": "Jak używać AutoLISP",
        "title_en": "How to use AutoLISP",
        "category": "Workflow",
        "category_en": "Workflow",
        "tags": ["AutoCAD", "AutoLISP"],
        "lead": "Kompletny przewodnik po konfiguracji środowiska LISP: jak poprawnie załadować swój pierwszy plik .lsp, skonfigurować zaufane ścieżki Trusted Paths w AutoCADzie i automatycznie przeładowywać kod podczas pracy jednym poleceniem.",
        "lead_en": "A complete guide to setting up the LISP environment: how to load your first .lsp file correctly, configure Trusted Paths in AutoCAD and reload code with a single command while you work.",
        "template": "articles/autolisp_getting_started.html"
    }
]


def _localize(a, lang):
    d = dict(a)
    if lang == 'en':
        for k in ('title', 'category', 'lead'):
            if a.get(k + '_en'):
                d[k] = a[k + '_en']
    return d


def get_articles(lang='pl'):
    return [_localize(a, lang) for a in ARTICLES]


def get_article_by_slug(slug, lang='pl'):
    for a in ARTICLES:
        if a["slug"] == slug:
            return _localize(a, lang)
    return None

ARTICLES = [
    {
        "slug": "autocad-lisp-narzedzia-przyspieszajace-prace",
        "title": "Funkcje jakich brakuje w AutoCAD",
        "category": "Automatyzacja",
        "tags": ["AutoCAD", "AutoLISP"],
        "lead": "Czyli moje efektywne narzędzia bez których nawet nie zaczynam pracy. Odwracanie zaznaczenia, zliczanie powierzchni wielu konturów oraz zapis własnego szablonu.",
        "template": "articles/autocad_lisp_tools.html"
    },
    {
        "slug": "autolisp-pierwsze-kroki-automatyczne-ladowanie",
        "title": "Jak używać AutoLISP",
        "category": "Workflow",
        "tags": ["AutoCAD", "AutoLISP"],
        "lead": "Kompletny przewodnik po konfiguracji środowiska LISP: jak poprawnie załadować swój pierwszy plik .lsp, skonfigurować zaufane ścieżki Trusted Paths w AutoCADzie i automatycznie przeładowywać kod podczas pracy jednym poleceniem.",
        "template": "articles/autolisp_getting_started.html"
    }
]

def get_articles():
    return ARTICLES

def get_article_by_slug(slug):
    for a in ARTICLES:
        if a["slug"] == slug:
            return a
    return None

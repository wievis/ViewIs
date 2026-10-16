ARTICLES = [
    {
        "slug": "autolisp-pierwsze-kroki-automatyczne-ladowanie",
        "title": "AutoLISP od zera: Pierwsze uruchomienie, Trusted Paths i automatyczne odświeżanie skryptów w locie",
        "date": "2026-10-16",
        "category": "AutoCAD / Workflow",
        "read_time": "5 min",
        "lead": "Kompletny przewodnik po konfiguracji środowiska LISP: jak poprawnie załadować swój pierwszy plik .lsp, skonfigurować zaufane ścieżki Trusted Paths w AutoCADzie i automatycznie przeładowywać kod podczas pracy jednym poleceniem.",
        "template": "articles/autolisp_getting_started.html"
    },
    {
        "slug": "autocad-lisp-narzedzia-przyspieszajace-prace",
        "title": "Trzy funkcje AutoLISP, których brakuje w podstawowym AutoCADzie",
        "date": "2026-10-16",
        "category": "CAD / Automatyzacja",
        "read_time": "4 min",
        "lead": "Odwracanie zaznaczenia, błyskawiczna suma powierzchni wielu konturów i natychmiastowy eksport szablonu DWT. Zbiór gotowych procedur w jednym pliku eliminujących powtarzalne czynności w codziennym kreśleniu.",
        "template": "articles/autocad_lisp_tools.html"
    }
]

def get_articles():
    return ARTICLES

def get_article_by_slug(slug):
    for a in ARTICLES:
        if a["slug"] == slug:
            return a
    return None

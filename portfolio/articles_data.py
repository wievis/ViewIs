# Rejestr artykulow hardcoded
ARTICLES = [
    {
        "slug": "autocad-lisp-narzedzia-przyspieszajace-prace",
        "title": "Trzy funkcje AutoLISP, których brakuje w podstawowym AutoCADzie",
        "date": "2026-10-16",
        "category": "CAD / Automatyzacja",
        "read_time": "4 min",
        "lead": "Odwracanie zaznaczenia, błyskawiczna suma powierzchni wielu konturów i natychmiastowy eksport szablonu DWT. Zbiór gotowych skryptów LISP eliminujących powtarzalne czynności w codziennej pracy projektowej.",
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

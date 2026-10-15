from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('en/', views.home, {'lang': 'en'}, name='home_en'),

    path('portfolio/', views.portfolio, name='portfolio'),
    path('en/portfolio/', views.portfolio, {'lang': 'en'}, name='portfolio_en'),

    path('artykuly/', views.article_list, name='articles'),
    path('artykuly/<slug:slug>/', views.article_detail, name='article_detail'),
    path('en/articles/', views.article_list, {'lang': 'en'}, name='articles_en'),
    path('en/articles/<slug:slug>/', views.article_detail, {'lang': 'en'}, name='article_detail_en'),

    path('o-mnie/', views.about, name='about'),
    path('en/about/', views.about, {'lang': 'en'}, name='about_en'),

    path('kontakt/', views.kontakt, name='kontakt'),
    path('en/contact/', views.kontakt, {'lang': 'en'}, name='kontakt_en'),

    path('mep/', views.mep_landing, name='mep_landing'),
    path('en/mep/', views.mep_landing, {'lang': 'en'}, name='mep_landing_en'),
    path('mep/panel/', views.mep_panel, name='mep_panel'),
    path('mep/viewer/', views.mep_viewer, name='mep_viewer'),
    path('mep/manifest.xml', views.mep_manifest, name='mep_manifest'),
    path('mep/download/', views.mep_download_zip, name='mep_download_zip'),

    path('sitemap.xml', views.sitemap, name='sitemap'),
]

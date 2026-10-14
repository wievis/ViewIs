from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('en/', views.home, {'lang': 'en'}, name='home_en'),
    path('kontakt/', views.kontakt, name='kontakt'),
    path('en/contact/', views.kontakt, {'lang': 'en'}, name='kontakt_en'),
    path('galeria/', views.galeria, name='galeria'),
    path('en/gallery/', views.galeria, {'lang': 'en'}, name='galeria_en'),
    path('mep/', views.mep_landing, name='mep_landing'),
    path('en/mep/', views.mep_landing, {'lang': 'en'}, name='mep_landing_en'),
    path('mep/panel/', views.mep_panel, name='mep_panel'),
    path('mep/viewer/', views.mep_viewer, name='mep_viewer'),
    path('mep/manifest.xml', views.mep_manifest, name='mep_manifest'),
]

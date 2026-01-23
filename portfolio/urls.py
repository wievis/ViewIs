# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('en/', views.home, {'lang': 'en'}, name='home_en'),
    path('kontakt/', views.kontakt, name='kontakt'),
    path('en/contact/', views.kontakt, {'lang': 'en'}, name='kontakt_en'),
    path('galeria/', views.galeria, name='galeria'),
    path('en/gallery/', views.galeria, {'lang': 'en'}, name='galeria_en'),
]
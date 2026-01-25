from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from portfolio import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('robots.txt', TemplateView.as_view(template_name="robots.txt", content_type="text/plain")),
    path('', views.home, name='home'),
    path('en/', views.home, {'lang': 'en'}, name='home_en'),
    path('kontakt/', views.kontakt, name='kontakt'),
    path('en/contact/', views.kontakt, {'lang': 'en'}, name='kontakt_en'),
    path('galeria/', views.galeria, name='galeria'),
    path('en/gallery/', views.galeria, {'lang': 'en'}, name='galeria_en'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
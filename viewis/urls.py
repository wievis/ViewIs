from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import RedirectView
from portfolio import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('kontakt/', views.kontakt, name='kontakt'),
    path('upload-url/', views.get_upload_url, name='get_upload_url'),
    re_path(
        r'^(?:artykuly|mep|procedury|o-mnie|en)(?:/.*)?$',
        RedirectView.as_view(pattern_name='home', permanent=True),
    ),
]

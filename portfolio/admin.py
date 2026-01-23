from django.contrib import admin
from .models import Media, HDRSetting

@admin.register(HDRSetting)
class HDRSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'media_type', 'order', 'created']
    list_editable = ['order']
    readonly_fields = ['created', 'media_type'] 
    
    fieldsets = (
        ('Media', {'fields': ('file', 'media_type', 'thumbnail', 'hdr_setting')}),
        ('Ustawienia', {'fields': ('order', 'created')}),
    )
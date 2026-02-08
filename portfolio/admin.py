from django.contrib import admin
from .models import Media, HDRSetting, Album

class MediaInline(admin.TabularInline):
    model = Media
    extra = 1
    fields = ['file', 'order', 'media_type']
    readonly_fields = ['media_type']

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'created']
    list_editable = ['order']
    inlines = [MediaInline]

@admin.register(HDRSetting)
class HDRSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'media_type', 'album', 'order', 'created']
    list_editable = ['order', 'album']
    readonly_fields = ['created', 'media_type'] 
    
    fieldsets = (
        ('Media', {'fields': ('file', 'album', 'media_type', 'thumbnail', 'hdr_setting')}),
        ('Ustawienia', {'fields': ('order', 'created')}),
    )
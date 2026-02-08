from django.contrib import admin
from .models import Media, HDRSetting

class MediaInline(admin.TabularInline):
    model = Media
    extra = 0
    fields = ['file', 'order', 'media_type', 'hdr_setting']
    readonly_fields = ['media_type']
    fk_name = 'parent_album'

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'media_type', 'order', 'created']
    list_editable = ['order', 'media_type']
    inlines = [MediaInline]

    def get_queryset(self, request):
        return super().get_queryset(request).filter(parent_album__isnull=True)

@admin.register(HDRSetting)
class HDRSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']
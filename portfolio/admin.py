from django.contrib import admin
from .models import Media, HDRSetting

class MediaInline(admin.TabularInline):
    model = Media
    extra = 0
    fields = ['file', 'order', 'media_type', 'hdr_setting']
    fk_name = 'parent_album'

@admin.register(HDRSetting)
class HDRSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'media_type', 'order', 'created']
    list_editable = ['order']
    inlines = [MediaInline]

    def display_name(self, obj):
        return f"📁 {obj.name}" if obj.media_type == 'album' else f"📄 {obj.file.name.split('/')[-1] if obj.file else obj.id}"
    display_name.short_description = 'Element'

    def get_queryset(self, request):
        return super().get_queryset(request).filter(parent_album__isnull=True)
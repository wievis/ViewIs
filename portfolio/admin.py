from django.contrib import admin
from django.utils.html import format_html
from .models import Media, HDRSetting

class MediaInline(admin.TabularInline):
    model = Media
    extra = 0
    fields = ['file', 'preview_image', 'order', 'media_type', 'hdr_setting']
    readonly_fields = ['media_type', 'preview_image']
    fk_name = 'parent_album'

    def preview_image(self, obj):
        if obj.file:
            return format_html('<img src="{}" style="height: 50px; width: auto; border-radius: 4px;" />', obj.file.url)
        return "-"

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['get_preview', 'id', 'name', 'media_type', 'order', 'created']
    list_editable = ['order']
    inlines = [MediaInline]
    readonly_fields = ['get_preview']

    def get_preview(self, obj):
        if obj.media_type == 'album':
            children = obj.children.all().only('file')
            html = '<div style="display: flex; gap: 5px; flex-wrap: wrap; max-width: 400px;">'
            for child in children:
                if child.file:
                    html += f'<img src="{child.file.url}" style="height: 40px; width: auto; border-radius: 2px; border: 1px solid #ddd;" />'
            html += '</div>'
            return format_html(html)
        
        if obj.file:
            return format_html('<img src="{}" style="height: 60px; width: auto; border-radius: 4px; border: 1px solid #ccc;" />', obj.file.url)
        
        return "Brak podglądu"

    get_preview.short_description = 'Podgląd'

    def get_queryset(self, request):
        return super().get_queryset(request).filter(parent_album__isnull=True).prefetch_related('children')

@admin.register(HDRSetting)
class HDRSettingAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']
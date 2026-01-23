# admin
from django.contrib import admin
from .models import Media

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'media_type', 'order', 'created']
    list_editable = ['order']
    readonly_fields = ['created', 'media_type'] 
    
    fieldsets = (
        ('Główne (OBJ/GLB)', {'fields': ('file', 'media_type', 'thumbnail')}),
        ('Mapy PBR (Tylko OBJ)', {'fields': ('mtl_file', 'texture_file', 'roughness_map', 'metalness_map', 'alpha_map')}),
        ('Ustawienia', {'fields': ('order', 'created')}),
    )
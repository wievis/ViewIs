from django.db import models

class HDRSetting(models.Model):
    name = models.CharField(max_length=100)
    file = models.FileField(upload_to='hdr/')
    def __str__(self): return self.name

class Media(models.Model):
    MEDIA_TYPES = [('image', 'Image'), ('video', 'Video'), ('model3d', 'Model 3D'), ('album', 'Album')]
    
    name = models.CharField(max_length=200, blank=True)
    file = models.FileField(upload_to='media/', null=True, blank=True)
    parent_album = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    hdr_setting = models.ForeignKey(HDRSetting, on_delete=models.SET_NULL, blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    order = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created']

    def save(self, *args, **kwargs):
        if self.file:
            ext = self.file.name.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']: self.media_type = 'image'
            elif ext in ['mp4', 'webm', 'mov']: self.media_type = 'video'
            elif ext in ['glb', 'gltf']: self.media_type = 'model3d'
        elif not self.parent_album:
            self.media_type = 'album'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name if self.media_type == 'album' else f"{self.media_type} {self.id}"
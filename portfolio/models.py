# models
from django.db import models

class Media(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('model3d', 'Model 3D'),
    ]
    
    file = models.FileField(upload_to='media/')
    mtl_file = models.FileField(upload_to='media/', blank=True, null=True)
    texture_file = models.ImageField(upload_to='textures/', blank=True, null=True)
    
    roughness_map = models.ImageField(upload_to='textures/', blank=True, null=True)
    metalness_map = models.ImageField(upload_to='textures/', blank=True, null=True)
    alpha_map = models.ImageField(upload_to='textures/', blank=True, null=True)
    
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, editable=False)
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    order = models.IntegerField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created']
    
    def save(self, *args, **kwargs):
        if self.file:
            ext = self.file.name.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                self.media_type = 'image'
            elif ext in ['mp4', 'webm', 'mov']:
                self.media_type = 'video'
            elif ext in ['obj', 'glb', 'gltf']:
                self.media_type = 'model3d'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.media_type} {self.id}"
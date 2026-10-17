from django.db import models
from django.utils import timezone
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFit


class HDRSetting(models.Model):
    name = models.CharField(max_length=100)
    file = models.FileField(upload_to='hdr/')
    def __str__(self): return self.name


class Media(models.Model):
    TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('model3d', 'Model 3D'),
        ('album', 'Album'),
    ]
    CATEGORIES = [
        ('viz', 'Wizualizacje'),
        ('anim', 'Animacje'),
        ('env', 'Środowiska i makiety'),
        ('model', 'Modele 3D'),
        ('other', 'Inne'),
    ]

    name = models.CharField(max_length=200, blank=True)
    file = models.FileField(upload_to='media/', null=True, blank=True)
    compressed_image = ImageSpecField(
        source='file',
        processors=[ResizeToFit(2500, 2500)],
        format='WEBP',
        options={'quality': 85}
    )
    media_type = models.CharField(max_length=10, choices=TYPES, default='image')
    category = models.CharField(max_length=10, choices=CATEGORIES, blank=True, default='')
    featured = models.BooleanField(default=False, help_text='Pokaż na stronie głównej')
    parent_album = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    hdr_setting = models.ForeignKey(HDRSetting, on_delete=models.SET_NULL, blank=True, null=True)
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
        elif not self.file and not self.parent_album:
            self.media_type = 'album'
        super().save(*args, **kwargs)

    @property
    def display_url(self):
        if not self.file:
            if self.media_type == 'album':
                first_child = self.children.filter(file__isnull=False).first()
                if first_child:
                    return first_child.display_url
            return ''
        if self.media_type == 'image':
            try:
                return self.compressed_image.url
            except Exception:
                pass
        return self.file.url

    def __str__(self):
        return self.name if self.name else f"{self.media_type} {self.id}"


class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=80, blank=True)
    lead = models.TextField(blank=True, help_text='Krótki wstęp na kartę')
    content = models.TextField(help_text='Markdown. Kod: ```python ... ```')
    title_en = models.CharField(max_length=200, blank=True)
    lead_en = models.TextField(blank=True)
    content_en = models.TextField(blank=True)
    cover = models.ImageField(upload_to='articles/', blank=True, null=True)
    date = models.DateField(default=timezone.localdate)
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date', '-id']

    @property
    def reading_time(self):
        return max(1, round(len(self.content.split()) / 200))

    def __str__(self):
        return self.title

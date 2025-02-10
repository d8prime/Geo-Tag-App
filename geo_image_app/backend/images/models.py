from django.db import models

# Create your models here.

class CapturedImage(models.Model):
    image = models.ImageField(upload_to='captured_images/')
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image at ({self.latitude}, {self.longitude})"


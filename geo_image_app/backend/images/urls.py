from django.urls import path
from .views import upload_image, get_images

urlpatterns = [
    path('upload/', upload_image, name='upload_image'),
    path('images/', get_images, name='get_images'),
]

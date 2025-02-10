from rest_framework import serializers
from .models import CapturedImage

class CapturedImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapturedImage
        fields = '__all__'

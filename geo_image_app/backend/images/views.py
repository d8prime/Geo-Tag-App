from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import CapturedImage
from .serializers import CapturedImageSerializer
from django.core.files.base import ContentFile
import base64
from django.utils.timezone import now

@api_view(['POST'])
def upload_image(request):
    try:
        data = request.data
        if 'image' not in data or 'latitude' not in data or 'longitude' not in data:
            return Response({"error": "Missing required fields"}, status=400)

        try:
            format, imgstr = data['image'].split(';base64,')
            ext = format.split('/')[-1]
        except ValueError:
            return Response({"error": "Invalid image format"}, status=400)

        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        timestamp_str = now().strftime("%Y%m%dT%H%M%S")

        # Generate a filename with lat, lon, and full timestamp
        filename = f"captured_{latitude:.6f}_{longitude:.6f}_{timestamp_str}.{ext}"

        # Decode the base64 image
        image_content = ContentFile(base64.b64decode(imgstr), name=filename)

        # Save the image with the new filename
        captured_image = CapturedImage.objects.create(
            image=image_content,
            latitude=latitude,
            longitude=longitude
        )

        return Response(CapturedImageSerializer(captured_image).data, status=201)

    except Exception as e:
        print("Error:", str(e))  # Log in terminal
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
def get_images(request):
    images = CapturedImage.objects.all().order_by('-timestamp')
    serializer = CapturedImageSerializer(images, many=True)
    return Response(serializer.data)

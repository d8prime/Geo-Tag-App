# Geo-Tag App  

A simple web app that lets you capture images and embed geolocation data. Built with React on the frontend and Django on the backend.  

## How It Works  

### Start Capturing  
- The React app turns on the camera and starts taking pictures at your chosen time interval.  
- Each image is stored in an array on the frontend.  
- The app adds latitude and longitude text directly onto the image.  

### Stop Capturing  
- When you hit "Stop," all stored images are sent to the Django backend.
- The captured images are displayed in a gallery view with a download. 

### Backend Stores Images  
- The backend only receives images and saves them with the geolocation data included.  

## Code Structure

### Frontend (React)  
- **Main App Logic:** [`frontend/src/App.js`](frontend/src/App.js)  
  - Handles the camera feed, captures images, and overlays geolocation data.  
  - Stores images in an array and sends them to the backend when you stop.    

### Backend (Django)  
- **API & Image Processing:** [`geo_image_app/backend/images/views.py`](geo_image_app/backend/images/views.py)  
  - Receives images and saves them with location data. 

## Tech Stack  
- **Frontend:** React, HTML, CSS, JavaScript  
- **Backend:** Django, Django REST Framework  
- **Database:** SQLite (default)  
- **Other Tools:** OpenCV (for image processing), ExifTool (for geotagging)  

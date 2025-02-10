import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [images, setImages] = useState([]);
  const [capturedImages, setCapturedImages] = useState([]); // cache
  const [intervalTime, setIntervalTime] = useState(5);
  const [intervalUnit, setIntervalUnit] = useState("seconds");
  const [showImages, setShowImages] = useState(false);
  const [coordFormat, setCoordFormat] = useState("DD");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  function toDMS(dd, isLatitude) {
    const direction = dd >= 0 ? (isLatitude ? "N" : "E") : (isLatitude ? "S" : "W");
    const absDd = Math.abs(dd);
    const deg = Math.floor(absDd);
    const minFloat = (absDd - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(2);
    return `${deg}° ${min}' ${sec}" ${direction}`;
  }

  function toDDM(dd, isLatitude) {
    const direction = dd >= 0 ? (isLatitude ? "N" : "E") : (isLatitude ? "S" : "W");
    const absDd = Math.abs(dd);
    const deg = Math.floor(absDd);
    const min = ((absDd - deg) * 60).toFixed(4);
    return `${deg}° ${min}' ${direction}`;
  }

  const formatCoordinates = useCallback((latitude, longitude) => {
    switch (coordFormat) {
      case "DMS":
        return { lat: toDMS(latitude, true), lon: toDMS(longitude, false) };
      case "DDM":
        return { lat: toDDM(latitude, true), lon: toDDM(longitude, false) };
      default:
        return {
          lat: `${Math.abs(latitude).toFixed(6)}° ${latitude >= 0 ? "N" : "S"}`,
          lon: `${Math.abs(longitude).toFixed(6)}° ${longitude >= 0 ? "E" : "W"}`,
        };
    }
  }, [coordFormat]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const formattedCoords = formatCoordinates(latitude, longitude);
      const timestamp = new Date().toLocaleString();
      // OVerlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
      ctx.font = "18px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(`Time: ${timestamp}`, canvas.width / 2, canvas.height - 50);
      ctx.fillText(`Lat: ${formattedCoords.lat} | Lon: ${formattedCoords.lon}`, canvas.width / 2, canvas.height - 20);

      const imageData = canvas.toDataURL("image/jpeg");

      // Send to Django Backend
      try {
        await axios.post("http://127.0.0.1:8000/api/upload/", {
          image: imageData,
          latitude,
          longitude,
          timestamp,
        });
        
        setCapturedImages((prev) => [
          ...prev,
          { image: imageData, latitude: formattedCoords.lat, longitude: formattedCoords.lon, timestamp },
        ]);
      } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);
      }
    });
  }, [formatCoordinates]);

  useEffect(() => {
    let interval;
    if (capturing) {
      const intervalMs = intervalUnit === "seconds" ? intervalTime * 1000 : intervalTime * 60000;
      interval = setInterval(captureImage, intervalMs);
    }
    return () => clearInterval(interval);
  }, [capturing, intervalTime, intervalUnit, captureImage]);

  const handleStart = () => {
    setCapturedImages([]);
    setImages([]);
    setShowImages(false);
    setCapturing(true);
  };

  const handleStop = () => {
    setCapturing(false);
    setImages(capturedImages);
    setTimeout(() => setShowImages(true), 200);
  };

  const downloadImageWithGeoTags = (imageData) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = "captured_image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <div className="camera-section">
        <video ref={videoRef} autoPlay></video>
        <div className="controls">
          <button onClick={handleStart} disabled={capturing} style={{ opacity: capturing ? 0.5 : 1 }}>
            Start
          </button>
          <button onClick={handleStop} disabled={!capturing} style={{ opacity: capturing ? 1 : 0.5 }}>
            Stop
          </button>

          <div className="interval-input">
            <label>Interval: </label>
            <input 
              type="number" 
              min="1" 
              value={intervalTime} 
              onChange={(e) => setIntervalTime(Number(e.target.value))} 
              disabled={capturing}
            />
            <select 
              value={intervalUnit} 
              onChange={(e) => setIntervalUnit(e.target.value)} 
              disabled={capturing}
            >
              <option value="seconds">{intervalTime === 1 ? "Second" : "Seconds"}</option>
              <option value="minutes">{intervalTime === 1 ? "Minute" : "Minutes"}</option>
            </select>
          </div>

          <div className="format-selector">
            <label>Format: </label>
            <select 
              value={coordFormat} 
              onChange={(e) => setCoordFormat(e.target.value)} 
              disabled={capturing}
            >
              <option value="DD">Decimal Degrees (DD)</option>
              <option value="DMS">Degrees, Minutes, Seconds (DMS)</option>
              <option value="DDM">Degrees Decimal Minutes (DDM)</option>
            </select>
          </div>
        </div>
        {capturing && <p className="capturing-text">Capturing images...📸</p>}
      </div>

      <div className={`image-gallery ${showImages ? "slide-in" : "hidden"}`}>
        <h3>Captured Images</h3>
        <div className="image-list">
          {images.length > 0 ? (
            images.map((img, index) => (
              <div key={index} className="image-item">
                <img src={img.image} alt="Captured" />
                <p>Time: {img.timestamp}</p>
                <p>Latitude: {img.latitude} <br /> Longitude: {img.longitude}</p>
                <button className="download-btn" onClick={() => downloadImageWithGeoTags(img.image)}>
                  Download
                </button>
              </div>
            ))
          ) : (
            <p className="no-images-text">No images captured</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

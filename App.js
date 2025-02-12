import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import "./App.css";
import "./style.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file upload
  const handleFileChange = (event) => setFile(event.target.files[0]);

  // Handle file upload to server
  const handleUpload = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else if (canvasRef.current) {
      // If using live camera, capture image from canvas
      const imageBlob = await new Promise((resolve) => {
        canvasRef.current.toBlob(resolve, "image/jpeg");
      });
      formData.append("file", imageBlob, "captured.jpg");
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPrediction(response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file.");
    }
  };

  // Initialize live camera feed
  const startCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          alert("Error accessing camera.");
        });
    } else {
      alert("Camera not supported in this browser.");
    }
  };

  // Capture an image from the video feed
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  // Stop the camera when component unmounts
  useEffect(() => {
    return () => {
      if (isCameraActive && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  return (
    <div className="app-container">
      {/* Background Section */}
      <div className="background-overlay">
        <h1 className="title">Privio</h1>
        <h2 className="subtitle">Traffic Signal Violation Detection System</h2>
      </div>

      {/* Camera Section */}
      <div className="camera-box">
        {!isCameraActive ? (
          <motion.button whileHover={{ scale: 1.1 }} onClick={startCamera}>
            Start Camera
          </motion.button>
        ) : (
          <div>
            <video ref={videoRef} autoPlay playsInline></video>
            <motion.button whileHover={{ scale: 1.1 }} onClick={captureImage}>
              Capture Photo
            </motion.button>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      </div>

      {/* Upload Section */}
      <div className="upload-box">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        <motion.button whileHover={{ scale: 1.1 }} onClick={handleUpload}>
          Upload File
        </motion.button>
      </div>

      {/* Display Prediction */}
      {prediction && (
        <motion.div
          className="prediction-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Result:</h2>
          <p>Prediction: {prediction.message}</p>
          <p>Email Status: {prediction.value}</p>
        </motion.div>
      )}
    </div>
  );
};

export default App;

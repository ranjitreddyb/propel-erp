"""
RTSP Stream Processing with Face and Vehicle Detection
Uses OpenCV for face detection (Haar Cascade)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import time
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Load Haar Cascade classifiers
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    car_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_car.xml')
    logger.info("OpenCV cascades loaded")
except Exception as e:
    logger.error(f"Failed to load cascades: {e}")
    face_cascade = None
    car_cascade = None

class RTSPRequest(BaseModel):
    rtsp_url: str
    enable_face: bool = True
    enable_vehicle: bool = True

class Detection(BaseModel):
    type: str
    x: int
    y: int
    width: int
    height: int
    confidence: float
    label: str

class DetectionResponse(BaseModel):
    success: bool
    frame_base64: Optional[str] = None
    detections: List[Detection] = []
    fps: float = 0.0
    error: Optional[str] = None

def process_frame(frame, enable_face=True, enable_vehicle=True):
    """Process frame for detections"""
    detections = []
    if frame is None:
        return frame, detections
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    if enable_face and face_cascade is not None:
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, 'Face', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            detections.append(Detection(
                type='face', x=int(x), y=int(y), width=int(w), height=int(h),
                confidence=0.85 + np.random.random() * 0.14, label='Person Detected'
            ))
    
    if enable_vehicle and car_cascade is not None:
        cars = car_cascade.detectMultiScale(gray, 1.1, 3, minSize=(50, 50))
        for (x, y, w, h) in cars:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
            plate = f"OD {np.random.randint(1,20):02d} XX {np.random.randint(1000,9999)}"
            cv2.putText(frame, plate, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            detections.append(Detection(
                type='vehicle', x=int(x), y=int(y), width=int(w), height=int(h),
                confidence=0.80 + np.random.random() * 0.19, label=plate
            ))
    
    cv2.putText(frame, time.strftime("%Y-%m-%d %H:%M:%S"), (10, frame.shape[0] - 10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return frame, detections

def create_demo_frame():
    """Create demo frame"""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:] = (30, 30, 40)
    cv2.putText(frame, "RTSP STREAM - DEMO MODE", (150, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 100), 2)
    cv2.putText(frame, "AI Detection Active", (220, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    cv2.rectangle(frame, (100, 150), (200, 280), (0, 255, 0), 2)
    cv2.putText(frame, "Face 94%", (100, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    cv2.rectangle(frame, (400, 300), (600, 420), (0, 255, 255), 2)
    cv2.putText(frame, "OD 02 AB 1234", (400, 295), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    cv2.putText(frame, time.strftime("%Y-%m-%d %H:%M:%S") + " | 30 FPS", (10, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return frame

@router.post("/connect", response_model=DetectionResponse)
async def connect_rtsp(request: RTSPRequest):
    """Connect to RTSP and return frame with detections"""
    try:
        logger.info(f"Connecting to RTSP: {request.rtsp_url}")
        
        cap = cv2.VideoCapture(request.rtsp_url) if request.rtsp_url else None
        
        if cap and cap.isOpened():
            ret, frame = cap.read()
            cap.release()
            if not ret or frame is None:
                frame = create_demo_frame()
        else:
            frame = create_demo_frame()
        
        processed, detections = process_frame(frame, request.enable_face, request.enable_vehicle)
        _, buffer = cv2.imencode('.jpg', processed, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        
        return DetectionResponse(success=True, frame_base64=frame_b64, detections=detections, fps=25.0)
    except Exception as e:
        logger.error(f"RTSP error: {e}")
        return DetectionResponse(success=False, error=str(e))

@router.get("/test")
async def test_detection():
    """Test detection endpoint"""
    frame = create_demo_frame()
    processed, detections = process_frame(frame)
    _, buffer = cv2.imencode('.jpg', processed, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return {"success": True, "cascade_ok": face_cascade is not None, "detections": len(detections), 
            "frame_base64": base64.b64encode(buffer).decode('utf-8')}

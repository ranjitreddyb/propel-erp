'use client';

import { useState, useRef } from 'react';
import { Card, PageHeader, Button, Grid, Badge } from '@/components/ui';
import { Camera, Video, Shield, Users, Car, AlertTriangle, Settings, Plus, Eye, Clock, CheckCircle2, Play, Square, Maximize2, Pencil, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

type CCTVCamera = {
  id: string;
  name: string;
  location: string;
  property: string;
  rtspUrl: string;
  status: 'online' | 'offline' | 'maintenance';
  aiFeatures: string[];
};

type Detection = {
  id: string;
  type: 'face' | 'vehicle';
  label: string;
  confidence: number;
  timestamp: string;
  camera: string;
};

const DEMO_CAMERAS: CCTVCamera[] = [
  { id: 'cam-001', name: 'Main Gate Camera', location: 'Entrance Gate', property: 'Supratik Exotica', rtspUrl: 'rtsp://192.168.1.101:554/stream1', status: 'online', aiFeatures: ['face', 'anpr'] },
  { id: 'cam-002', name: 'Parking Lot A', location: 'Underground Parking', property: 'Supratik Exotica', rtspUrl: 'rtsp://192.168.1.102:554/stream1', status: 'online', aiFeatures: ['anpr', 'intrusion'] },
  { id: 'cam-003', name: 'Lobby Camera', location: 'Main Lobby', property: 'Supratik Elegance', rtspUrl: 'rtsp://192.168.1.103:554/stream1', status: 'online', aiFeatures: ['face', 'attendance'] },
  { id: 'cam-004', name: 'Pool Area', location: 'Swimming Pool', property: 'Supratik Vista', rtspUrl: 'rtsp://192.168.1.104:554/stream1', status: 'offline', aiFeatures: ['intrusion'] },
  { id: 'cam-005', name: 'Seafood Plant Entrance', location: 'Main Processing Unit', property: 'Seafood Processing Plant', rtspUrl: '', status: 'online', aiFeatures: ['face', 'anpr'] },
];

const DEMO_DETECTIONS: Detection[] = [
  { id: 'd1', type: 'face', label: 'Person Detected', confidence: 94, timestamp: '10:42:15', camera: 'Main Gate Camera' },
  { id: 'd2', type: 'vehicle', label: 'OD 02 AB 1234', confidence: 98, timestamp: '10:41:52', camera: 'Parking Lot A' },
  { id: 'd3', type: 'face', label: 'Person Detected', confidence: 87, timestamp: '10:41:30', camera: 'Lobby Camera' },
  { id: 'd4', type: 'vehicle', label: 'OD 05 CD 5678', confidence: 95, timestamp: '10:40:45', camera: 'Main Gate Camera' },
  { id: 'd5', type: 'face', label: 'Person Detected', confidence: 92, timestamp: '10:40:12', camera: 'Seafood Plant Entrance' },
  { id: 'd6', type: 'vehicle', label: 'OD 02 EF 9012', confidence: 89, timestamp: '10:39:58', camera: 'Parking Lot A' },
];

const AI_FEATURES = [
  {
    id: 'face',
    icon: <Users size={20} />,
    title: 'Face Detection',
    desc: 'Detect and count faces in video stream',
    subFeatures: [
      { id: 'face_detect', label: 'Face Detection', desc: 'Detect faces in real-time' },
      { id: 'face_count', label: 'People Counting', desc: 'Count number of people' },
      { id: 'intruder', label: 'Unknown Person Alert', desc: 'Alert on new faces' },
    ],
  },
  {
    id: 'anpr',
    icon: <Car size={20} />,
    title: 'Vehicle Detection (ANPR)',
    desc: 'Detect vehicles and license plates',
    subFeatures: [
      { id: 'vehicle_detect', label: 'Vehicle Detection', desc: 'Detect cars, bikes, trucks' },
      { id: 'plate_read', label: 'License Plate Reading', desc: 'OCR on number plates' },
      { id: 'vehicle_count', label: 'Vehicle Counting', desc: 'Count vehicles in/out' },
    ],
  },
  {
    id: 'intrusion',
    icon: <AlertTriangle size={20} />,
    title: 'Intrusion Detection',
    desc: 'Motion and perimeter breach detection',
    subFeatures: [
      { id: 'motion', label: 'Motion Detection', desc: 'Detect movement in zones' },
      { id: 'perimeter', label: 'Perimeter Breach', desc: 'Boundary crossing alerts' },
    ],
  },
];

export default function SecurityPage() {
  const [cameras, setCameras] = useState(DEMO_CAMERAS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRtspModal, setShowRtspModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CCTVCamera | null>(null);
  const [customRtspUrl, setCustomRtspUrl] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detections, setDetections] = useState<Detection[]>(DEMO_DETECTIONS);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    face_detect: true,
    face_count: true,
    intruder: true,
    vehicle_detect: true,
    plate_read: true,
    vehicle_count: true,
    motion: true,
    perimeter: true,
  });

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
    toast.success(`Feature ${enabledFeatures[featureId] ? 'disabled' : 'enabled'}`);
  };

  const filteredCameras = selectedProperty === 'all' 
    ? cameras 
    : cameras.filter(c => c.property === selectedProperty);

  const properties = [...new Set(cameras.map(c => c.property))];

  const handleEditCamera = (camera: CCTVCamera) => {
    setEditingCamera({ ...camera });
    setShowEditModal(true);
  };

  const handleSaveCamera = () => {
    if (editingCamera) {
      setCameras(prev => prev.map(c => c.id === editingCamera.id ? editingCamera : c));
      setShowEditModal(false);
      setEditingCamera(null);
      toast.success('Camera updated successfully!');
    }
  };

  const handleDeleteCamera = (cameraId: string) => {
    if (confirm('Are you sure you want to delete this camera?')) {
      setCameras(prev => prev.filter(c => c.id !== cameraId));
      toast.success('Camera deleted successfully!');
    }
  };

  const handleConnectRtsp = () => {
    if (customRtspUrl) {
      // Add custom RTSP camera
      const newCamera: CCTVCamera = {
        id: `cam-custom-${Date.now()}`,
        name: 'Custom RTSP Stream',
        location: 'External Source',
        property: 'Seafood Processing Plant',
        rtspUrl: customRtspUrl,
        status: 'online',
        aiFeatures: ['face', 'anpr'],
      };
      setCameras(prev => [...prev, newCamera]);
      setSelectedCamera(newCamera);
      setShowRtspModal(false);
      setIsPlaying(true);
      toast.success('RTSP stream connected! Starting AI detection...');
      
      // Simulate detections
      simulateDetections();
    }
  };

  const simulateDetections = () => {
    const interval = setInterval(() => {
      const types: ('face' | 'vehicle')[] = ['face', 'vehicle'];
      const type = types[Math.floor(Math.random() * types.length)];
      const newDetection: Detection = {
        id: `d-${Date.now()}`,
        type,
        label: type === 'face' ? 'Person Detected' : `OD ${Math.floor(Math.random() * 10)} XX ${Math.floor(1000 + Math.random() * 9000)}`,
        confidence: 85 + Math.floor(Math.random() * 15),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        camera: selectedCamera?.name || 'Custom RTSP Stream',
      };
      setDetections(prev => [newDetection, ...prev.slice(0, 19)]);
    }, 3000);
    
    // Clear after 60 seconds
    setTimeout(() => clearInterval(interval), 60000);
  };

  const openLiveFeed = (camera: CCTVCamera) => {
    setSelectedCamera(camera);
    setIsPlaying(true);
    toast(`Opening live feed: ${camera.name}`);
    if (camera.status === 'online') {
      simulateDetections();
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CCTV & Security"
        subtitle="Surveillance monitoring with AI-powered face & vehicle detection"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRtspModal(true)}>
              <Play size={14} /> Connect RTSP
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Camera
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <Grid cols={4} className="mb-6">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(8,145,178,0.1)' }}>
              <Camera size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cameras.length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Total Cameras</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle2 size={20} style={{ color: '#10B981' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#10B981' }}>{cameras.filter(c => c.status === 'online').length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Online</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Users size={20} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#6366F1' }}>{detections.filter(d => d.type === 'face').length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Faces Detected</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.1)' }}>
              <Car size={20} style={{ color: 'var(--secondary)' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>{detections.filter(d => d.type === 'vehicle').length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Vehicles Detected</div>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Live Feed + Detection Panel */}
      {isPlaying && selectedCamera && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Live: {selectedCamera.name}</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPlaying(false)}>
                <Square size={14} /> Stop
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 size={14} /> Fullscreen
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Video Preview Placeholder */}
            <div className="lg:col-span-2">
              <div
                className="relative rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: '#000', aspectRatio: '16/9' }}
              >
                {/* Simulated Video with Detection Boxes */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video size={64} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 text-lg">RTSP Stream: {selectedCamera.rtspUrl || 'Awaiting connection...'}</p>
                    <p className="text-gray-500 text-sm mt-2">AI Detection Active</p>
                  </div>
                </div>
                
                {/* Simulated Detection Boxes */}
                <div className="absolute top-10 left-20 w-24 h-32 border-2 border-green-400 rounded-lg animate-pulse">
                  <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    Face 94%
                  </div>
                </div>
                <div className="absolute bottom-16 right-28 w-40 h-20 border-2 border-yellow-400 rounded-lg">
                  <div className="absolute -top-6 left-0 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-mono">
                    OD 02 AB 1234
                  </div>
                </div>
                
                {/* Status Overlay */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="active">Face Detection ON</Badge>
                  <Badge variant="pending">ANPR ON</Badge>
                </div>
                <div className="absolute bottom-3 left-3 text-xs text-gray-400 font-mono">
                  {new Date().toLocaleTimeString('en-IN', { hour12: false })} | 30 FPS | 1080p
                </div>
              </div>
            </div>
            
            {/* Live Detections Log */}
            <div>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Live Detections</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {detections.slice(0, 10).map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-lg flex items-center gap-3"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: d.type === 'face' ? 'rgba(99,102,241,0.1)' : 'rgba(217,119,6,0.1)' }}
                    >
                      {d.type === 'face' ? <Users size={16} style={{ color: '#6366F1' }} /> : <Car size={16} style={{ color: 'var(--secondary)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{d.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text3)' }}>{d.camera}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold" style={{ color: d.confidence >= 90 ? '#10B981' : 'var(--secondary)' }}>{d.confidence}%</div>
                      <div className="text-xs" style={{ color: 'var(--text3)' }}>{d.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>Cameras</h2>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="form-input w-auto text-sm"
              >
                <option value="all">All Properties</option>
                {properties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              {filteredCameras.map((camera) => (
                <div
                  key={camera.id}
                  className="p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer"
                  style={{ background: 'var(--surface)', borderColor: selectedCamera?.id === camera.id ? 'var(--primary)' : 'var(--border)' }}
                  onClick={() => openLiveFeed(camera)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: camera.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                      >
                        <Video size={22} style={{ color: camera.status === 'online' ? '#10B981' : '#EF4444' }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{camera.name}</div>
                        <div className="text-sm" style={{ color: 'var(--text3)' }}>{camera.location}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{camera.property}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background: camera.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: camera.status === 'online' ? '#10B981' : '#EF4444',
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {camera.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {camera.aiFeatures.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(8,145,178,0.08)', color: 'var(--primary)' }}
                      >
                        {f === 'face' ? 'Face' : f === 'anpr' ? 'ANPR' : f === 'intrusion' ? 'Intrusion' : f === 'attendance' ? 'Attendance' : f}
                      </span>
                    ))}
                  </div>
                  {camera.rtspUrl && (
                    <div className="mt-2 text-xs font-mono truncate" style={{ color: 'var(--text3)' }}>
                      {camera.rtspUrl}
                    </div>
                  )}
                  {/* Edit/Delete Buttons */}
                  <div className="mt-3 flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditCamera(camera); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:shadow-sm"
                      style={{ background: 'rgba(8,145,178,0.1)', color: 'var(--primary)' }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCamera(camera.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:shadow-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Camera Button */}
            <button
              onClick={() => setShowRtspModal(true)}
              className="w-full mt-4 p-4 rounded-xl border-2 border-dashed transition-all hover:border-[var(--primary)] hover:bg-[rgba(8,145,178,0.02)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text3)' }}>
                <Play size={18} />
                <span>Connect Your RTSP Stream</span>
              </div>
            </button>
          </Card>
        </div>

        {/* AI Features Configuration */}
        <div>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} style={{ color: 'var(--text2)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>AI Detection Settings</h2>
            </div>

            <div className="space-y-4">
              {AI_FEATURES.map((feature) => (
                <div key={feature.id} className="p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(8,145,178,0.1)', color: 'var(--primary)' }}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{feature.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text3)' }}>{feature.desc}</div>
                    </div>
                  </div>
                  <div className="space-y-2 ml-10">
                    {feature.subFeatures.map((sub) => (
                      <label key={sub.id} className="flex items-center justify-between cursor-pointer py-1">
                        <div>
                          <div className="text-sm" style={{ color: 'var(--text2)' }}>{sub.label}</div>
                          <div className="text-xs" style={{ color: 'var(--text3)' }}>{sub.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabledFeatures[sub.id] || false}
                          onChange={() => toggleFeature(sub.id)}
                          className="w-4 h-4 rounded accent-[var(--primary)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--primary)' }}>
                <Shield size={14} />
                <span>Detection active on all online cameras</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Connect RTSP Modal */}
      {showRtspModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRtspModal(false)}>
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Connect RTSP Stream</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text3)' }}>
              Enter your RTSP URL to connect your camera for AI-powered face and vehicle detection.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>RTSP URL</label>
                <input
                  type="text"
                  value={customRtspUrl}
                  onChange={(e) => setCustomRtspUrl(e.target.value)}
                  className="form-input font-mono"
                  placeholder="rtsp://username:password@ip:port/stream"
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>
                  Example: rtsp://admin:password@192.168.1.100:554/stream1
                </p>
              </div>
              
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface2)' }}>
                <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text)' }}>AI Features Enabled</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="active">Face Detection</Badge>
                  <Badge variant="active">Vehicle Detection</Badge>
                  <Badge variant="active">License Plate OCR</Badge>
                  <Badge variant="pending">People Counting</Badge>
                </div>
              </div>
              
              <div className="p-4 rounded-xl" style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)' }}>
                <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                  <strong>Note:</strong> For demo purposes, detection results are simulated. 
                  Full RTSP integration with actual AI inference will be connected in Phase 2.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                onClick={() => setShowRtspModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                onClick={handleConnectRtsp}
              >
                <Play size={16} />
                Connect & Start Detection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Add New Camera</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Camera Name</label>
                <input type="text" className="form-input" placeholder="e.g., Main Gate Camera" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Location</label>
                <input type="text" className="form-input" placeholder="e.g., Entrance Gate" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Property</label>
                <select className="form-input">
                  <option>Supratik Exotica</option>
                  <option>Supratik Elegance</option>
                  <option>Supratik Vista</option>
                  <option>Supratik Lifestyle</option>
                  <option>Seafood Processing Plant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>RTSP URL</label>
                <input type="text" className="form-input font-mono text-sm" placeholder="rtsp://ip:port/stream" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                onClick={() => { setShowAddModal(false); toast.success('Camera added successfully!'); }}
              >
                Add Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {showEditModal && editingCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Edit Camera</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-[var(--surface2)]">
                <X size={18} style={{ color: 'var(--text3)' }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Camera Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCamera.name}
                  onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCamera.location}
                  onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Property</label>
                <select
                  className="form-input"
                  value={editingCamera.property}
                  onChange={(e) => setEditingCamera({ ...editingCamera, property: e.target.value })}
                >
                  <option>Supratik Exotica</option>
                  <option>Supratik Elegance</option>
                  <option>Supratik Vista</option>
                  <option>Supratik Lifestyle</option>
                  <option>Seafood Processing Plant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>RTSP URL</label>
                <input
                  type="text"
                  className="form-input font-mono text-sm"
                  value={editingCamera.rtspUrl}
                  onChange={(e) => setEditingCamera({ ...editingCamera, rtspUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Status</label>
                <select
                  className="form-input"
                  value={editingCamera.status}
                  onChange={(e) => setEditingCamera({ ...editingCamera, status: e.target.value as any })}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
                onClick={handleSaveCamera}
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

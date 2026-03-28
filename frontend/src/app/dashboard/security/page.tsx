'use client';

import { useState } from 'react';
import { Card, PageHeader, Button, Grid } from '@/components/ui';
import { Camera, Video, Shield, Users, Car, AlertTriangle, Settings, Plus, Eye, Clock, CheckCircle2 } from 'lucide-react';
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

const DEMO_CAMERAS: CCTVCamera[] = [
  { id: 'cam-001', name: 'Main Gate Camera', location: 'Entrance Gate', property: 'Supratik Exotica', rtspUrl: 'rtsp://192.168.1.101:554/stream1', status: 'online', aiFeatures: ['face', 'anpr'] },
  { id: 'cam-002', name: 'Parking Lot A', location: 'Underground Parking', property: 'Supratik Exotica', rtspUrl: 'rtsp://192.168.1.102:554/stream1', status: 'online', aiFeatures: ['anpr', 'intrusion'] },
  { id: 'cam-003', name: 'Lobby Camera', location: 'Main Lobby', property: 'Supratik Elegance', rtspUrl: 'rtsp://192.168.1.103:554/stream1', status: 'online', aiFeatures: ['face', 'attendance'] },
  { id: 'cam-004', name: 'Pool Area', location: 'Swimming Pool', property: 'Supratik Vista', rtspUrl: 'rtsp://192.168.1.104:554/stream1', status: 'offline', aiFeatures: ['intrusion'] },
];

const AI_FEATURES = [
  {
    id: 'face',
    icon: <Users size={20} />,
    title: 'Face Recognition',
    desc: 'Identify residents, staff, vendors & intruders',
    subFeatures: [
      { id: 'resident', label: 'Resident Detection', desc: 'Auto-identify registered residents' },
      { id: 'staff', label: 'Staff/Vendor Detection', desc: 'Track maids, delivery, maintenance staff' },
      { id: 'intruder', label: 'Intruder Alert', desc: 'Flag unknown faces and alert security' },
      { id: 'attendance', label: 'Auto Attendance', desc: 'Mark attendance from face recognition' },
    ],
  },
  {
    id: 'anpr',
    icon: <Car size={20} />,
    title: 'Vehicle Recognition (ANPR)',
    desc: 'License plate recognition for parking & access',
    subFeatures: [
      { id: 'resident_vehicle', label: 'Resident Vehicles', desc: 'Auto-open gates for registered vehicles' },
      { id: 'staff_vehicle', label: 'Staff Vehicles', desc: 'Track employee and vendor vehicles' },
      { id: 'unknown_vehicle', label: 'Unknown Vehicle Alert', desc: 'Flag unregistered vehicles' },
      { id: 'parking_log', label: 'Parking Log', desc: 'Maintain entry/exit records' },
    ],
  },
  {
    id: 'intrusion',
    icon: <AlertTriangle size={20} />,
    title: 'Intrusion Detection',
    desc: 'Motion and perimeter breach detection',
    subFeatures: [
      { id: 'perimeter', label: 'Perimeter Breach', desc: 'Detect boundary wall intrusions' },
      { id: 'restricted', label: 'Restricted Area', desc: 'Alert on unauthorized zone access' },
      { id: 'night_mode', label: 'Night Surveillance', desc: 'Enhanced detection during night hours' },
    ],
  },
];

export default function SecurityPage() {
  const [cameras, setCameras] = useState(DEMO_CAMERAS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    resident: true,
    staff: true,
    intruder: true,
    attendance: false,
    resident_vehicle: true,
    staff_vehicle: true,
    unknown_vehicle: true,
    parking_log: true,
    perimeter: true,
    restricted: true,
    night_mode: false,
  });

  const toggleFeature = (featureId: string) => {
    setEnabledFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
    toast.success(`Feature ${enabledFeatures[featureId] ? 'disabled' : 'enabled'}`);
  };

  const filteredCameras = selectedProperty === 'all' 
    ? cameras 
    : cameras.filter(c => c.property === selectedProperty);

  const properties = [...new Set(cameras.map(c => c.property))];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CCTV & Security"
        subtitle="Surveillance monitoring, AI detection & access control"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Camera
          </Button>
        }
      />

      {/* Stats */}
      <Grid cols={4} className="mb-6">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(54,104,75,0.1)' }}>
              <Camera size={20} style={{ color: '#36684B' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cameras.length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Total Cameras</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(54,104,75,0.1)' }}>
              <CheckCircle2 size={20} style={{ color: '#36684B' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#36684B' }}>{cameras.filter(c => c.status === 'online').length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Online</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(158,60,60,0.1)' }}>
              <AlertTriangle size={20} style={{ color: '#9E3C3C' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#9E3C3C' }}>{cameras.filter(c => c.status === 'offline').length}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Offline</div>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(207,161,90,0.1)' }}>
              <Eye size={20} style={{ color: '#CFA15A' }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#CFA15A' }}>24/7</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>Monitoring</div>
            </div>
          </div>
        </Card>
      </Grid>

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
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  onClick={() => toast(`Opening live feed: ${camera.name}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: camera.status === 'online' ? 'rgba(54,104,75,0.1)' : 'rgba(158,60,60,0.1)' }}
                      >
                        <Video size={22} style={{ color: camera.status === 'online' ? '#36684B' : '#9E3C3C' }} />
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
                          background: camera.status === 'online' ? 'rgba(54,104,75,0.1)' : 'rgba(158,60,60,0.1)',
                          color: camera.status === 'online' ? '#36684B' : '#9E3C3C',
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
                        style={{ background: 'rgba(32,58,43,0.08)', color: 'var(--text2)' }}
                      >
                        {f === 'face' ? '👤 Face' : f === 'anpr' ? '🚗 ANPR' : f === 'intrusion' ? '🚨 Intrusion' : f === 'attendance' ? '📋 Attendance' : f}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs font-mono truncate" style={{ color: 'var(--text3)' }}>
                    {camera.rtspUrl}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Camera Placeholder */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full mt-4 p-4 rounded-xl border-2 border-dashed transition-all hover:border-[#203A2B] hover:bg-[rgba(32,58,43,0.02)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text3)' }}>
                <Plus size={18} />
                <span>Add New Camera</span>
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
                <div key={feature.id} className="p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(32,58,43,0.1)', color: '#203A2B' }}
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
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#203A2B' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(207,161,90,0.1)', border: '1px solid rgba(207,161,90,0.2)' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#CFA15A' }}>
                <Clock size={14} />
                <span>AI models will be integrated in Phase 2</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Camera Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAddModal(false)}>
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
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>RTSP URL</label>
                <input type="text" className="form-input font-mono text-sm" placeholder="rtsp://ip:port/stream" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>Camera ID (optional)</label>
                <input type="text" className="form-input" placeholder="Unique identifier" />
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
                style={{ background: '#203A2B' }}
                onClick={() => { setShowAddModal(false); toast.success('Camera added (placeholder)'); }}
              >
                Add Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

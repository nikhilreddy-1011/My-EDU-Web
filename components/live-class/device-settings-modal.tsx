'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, VideoOff, Mic, MicOff, Settings, Volume2, RefreshCw } from 'lucide-react'
import { MediaDevicesList } from '@/hooks/use-media-stream'

interface DeviceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  devices: MediaDevicesList
  selectedCameraId: string
  selectedMicId: string
  onSelectCamera: (deviceId: string) => void
  onSelectMic: (deviceId: string) => void
  isCameraOn: boolean
  isMicOn: boolean
  localStream: MediaStream | null
  audioLevel: number
  onToggleCamera: () => void
  onToggleMic: () => void
  onRefreshDevices: () => void
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  devices,
  selectedCameraId,
  selectedMicId,
  onSelectCamera,
  onSelectMic,
  isCameraOn,
  isMicOn,
  localStream,
  audioLevel,
  onToggleCamera,
  onToggleMic,
  onRefreshDevices,
}: DeviceSettingsModalProps) {
  const previewVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (previewVideoRef.current) {
      if (localStream && isCameraOn) {
        previewVideoRef.current.srcObject = localStream
      } else {
        previewVideoRef.current.srcObject = null
      }
    }
  }, [localStream, isCameraOn, isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-blue-400 flex items-center justify-center">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold">Audio & Video Settings</h3>
                <p className="text-xs text-slate-400">Configure your camera, microphone and check levels</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            {/* Camera Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Video size={14} className="text-blue-400" /> Camera Preview
                </label>
                <button
                  onClick={onToggleCamera}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  {isCameraOn ? <VideoOff size={13} /> : <Video size={13} />}
                  {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                </button>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {isCameraOn && localStream ? (
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <VideoOff size={32} />
                    <span className="text-xs font-medium">Camera is turned off</span>
                  </div>
                )}
                {isCameraOn && (
                  <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-[11px] px-2 py-0.5 rounded-md font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Preview
                  </span>
                )}
              </div>

              {/* Camera Selector */}
              <div className="mt-3">
                <select
                  value={selectedCameraId}
                  onChange={e => onSelectCamera(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary transition-colors"
                >
                  {devices.videoInputs.length === 0 ? (
                    <option value="">Default Web Camera</option>
                  ) : (
                    devices.videoInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Microphone Settings */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mic size={14} className="text-emerald-400" /> Microphone & Input Level
                </label>
                <button
                  onClick={onToggleMic}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {isMicOn ? <MicOff size={13} /> : <Mic size={13} />}
                  {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                </button>
              </div>

              {/* Live Audio Level Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={13} className={audioLevel > 15 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                    Speech Input Level
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {isMicOn ? `${audioLevel}%` : 'Muted'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-75"
                    style={{ width: `${isMicOn ? audioLevel : 0}%` }}
                  />
                </div>
                {isMicOn && (
                  <p className="text-[11px] text-slate-500">
                    Speak into your microphone to verify that the green bar moves.
                  </p>
                )}
              </div>

              {/* Microphone Selector */}
              <div className="mt-3">
                <select
                  value={selectedMicId}
                  onChange={e => onSelectMic(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary transition-colors"
                >
                  {devices.audioInputs.length === 0 ? (
                    <option value="">Default Microphone</option>
                  ) : (
                    devices.audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onRefreshDevices}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw size={13} /> Refresh Devices
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

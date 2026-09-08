'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export interface MediaDevicesList {
  videoInputs: MediaDeviceInfo[]
  audioInputs: MediaDeviceInfo[]
}

export interface UseMediaStreamReturn {
  // Streams
  localStream: MediaStream | null
  screenStream: MediaStream | null

  // States
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean
  audioLevel: number // 0 - 100
  isSpeaking: boolean
  error: string | null

  // Devices
  devices: MediaDevicesList
  selectedCameraId: string
  selectedMicId: string

  // Actions
  toggleCamera: () => Promise<boolean>
  toggleMic: () => Promise<boolean>
  startCamera: (deviceId?: string) => Promise<boolean>
  stopCamera: () => void
  startMic: (deviceId?: string) => Promise<boolean>
  stopMic: () => void
  startScreenShare: () => Promise<boolean>
  stopScreenShare: () => void
  switchCamera: (deviceId: string) => Promise<boolean>
  switchMic: (deviceId: string) => Promise<boolean>
  refreshDevices: () => Promise<void>
}

export function useMediaStream(): UseMediaStreamReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [devices, setDevices] = useState<MediaDevicesList>({ videoInputs: [], audioInputs: [] })
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [selectedMicId, setSelectedMicId] = useState<string>('')

  // Refs for tracking audio analysis
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Stable stream references for cleanup
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  localStreamRef.current = localStream
  screenStreamRef.current = screenStream

  // Enumerate input devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput')
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput')

      setDevices({ videoInputs, audioInputs })

      if (videoInputs.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoInputs[0].deviceId)
      }
      if (audioInputs.length > 0 && !selectedMicId) {
        setSelectedMicId(audioInputs[0].deviceId)
      }
    } catch (err) {
      console.warn('Could not enumerate devices:', err)
    }
  }, [selectedCameraId, selectedMicId])

  useEffect(() => {
    refreshDevices()
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)
      }
    }
  }, [refreshDevices])

  // Setup Web Audio API volume visualizer
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) return

      // Clean up previous context if exists
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkVolume = () => {
        if (!analyserRef.current || !isMicOn) {
          setAudioLevel(0)
          setIsSpeaking(false)
          return
        }

        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length
        // Normalize 0 - 100
        const normalized = Math.min(100, Math.round((average / 128) * 100))
        setAudioLevel(normalized)
        setIsSpeaking(normalized > 14)

        animationFrameRef.current = requestAnimationFrame(checkVolume)
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume)
    } catch (err) {
      console.warn('Web Audio analysis error:', err)
    }
  }, [isMicOn])

  // Stop audio analysis
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setAudioLevel(0)
    setIsSpeaking(false)
  }, [])

  // Start Camera
  const startCamera = useCallback(async (deviceId?: string): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Media devices not supported in this browser')
      return false
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      }

      const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
      const newVideoTrack = videoStream.getVideoTracks()[0]

      setLocalStream(prevStream => {
        if (prevStream) {
          // Remove old video tracks
          prevStream.getVideoTracks().forEach(t => t.stop())
          prevStream.addTrack(newVideoTrack)
          return new MediaStream(prevStream.getTracks())
        } else {
          return new MediaStream([newVideoTrack])
        }
      })

      setIsCameraOn(true)
      setError(null)
      toast.success('Camera activated')
      refreshDevices()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission denied'
      console.error('Error starting camera:', err)
      setError(msg)
      toast.error('Could not access camera: ' + msg)
      setIsCameraOn(false)
      return false
    }
  }, [refreshDevices])

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => {
        t.stop()
      })
      const remainingTracks = localStreamRef.current.getTracks().filter(t => t.kind !== 'video')
      if (remainingTracks.length > 0) {
        setLocalStream(new MediaStream(remainingTracks))
      } else {
        setLocalStream(null)
      }
    }
    setIsCameraOn(false)
    toast('Camera turned off')
  }, [])

  // Toggle Camera
  const toggleCamera = useCallback(async (): Promise<boolean> => {
    if (isCameraOn) {
      stopCamera()
      return false
    } else {
      return await startCamera(selectedCameraId)
    }
  }, [isCameraOn, selectedCameraId, startCamera, stopCamera])

  // Start Microphone
  const startMic = useCallback(async (deviceId?: string): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Media devices not supported in this browser')
      return false
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      }

      const audioStream = await navigator.mediaDevices.getUserMedia(constraints)
      const newAudioTrack = audioStream.getAudioTracks()[0]
      newAudioTrack.enabled = true

      setLocalStream(prevStream => {
        let updated: MediaStream
        if (prevStream) {
          prevStream.getAudioTracks().forEach(t => t.stop())
          prevStream.addTrack(newAudioTrack)
          updated = new MediaStream(prevStream.getTracks())
        } else {
          updated = new MediaStream([newAudioTrack])
        }
        setupAudioAnalysis(updated)
        return updated
      })

      setIsMicOn(true)
      setError(null)
      toast.success('Microphone unmuted')
      refreshDevices()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone permission denied'
      console.error('Error starting mic:', err)
      setError(msg)
      toast.error('Could not access microphone: ' + msg)
      setIsMicOn(false)
      return false
    }
  }, [refreshDevices, setupAudioAnalysis])

  // Stop Microphone
  const stopMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = false
        t.stop()
      })
      const remainingTracks = localStreamRef.current.getTracks().filter(t => t.kind !== 'audio')
      if (remainingTracks.length > 0) {
        setLocalStream(new MediaStream(remainingTracks))
      } else {
        setLocalStream(null)
      }
    }
    stopAudioAnalysis()
    setIsMicOn(false)
    toast('Microphone muted')
  }, [stopAudioAnalysis])

  // Toggle Microphone
  const toggleMic = useCallback(async (): Promise<boolean> => {
    if (isMicOn) {
      // If we already have an active audio track, simply disable it
      const audioTrack = localStreamRef.current?.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = false
        setIsMicOn(false)
        setAudioLevel(0)
        setIsSpeaking(false)
        toast('Microphone muted')
        return false
      } else {
        stopMic()
        return false
      }
    } else {
      const audioTrack = localStreamRef.current?.getAudioTracks()[0]
      if (audioTrack && audioTrack.readyState === 'live') {
        audioTrack.enabled = true
        setIsMicOn(true)
        if (localStreamRef.current) {
          setupAudioAnalysis(localStreamRef.current)
        }
        toast.success('Microphone unmuted')
        return true
      } else {
        return await startMic(selectedMicId)
      }
    }
  }, [isMicOn, selectedMicId, setupAudioAnalysis, startMic, stopMic])

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
    }
    setScreenStream(null)
    setIsScreenSharing(false)
    toast('Screen sharing stopped')
  }, [])

  // Start Screen Share
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      toast.error('Screen sharing is not supported on this browser/device')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true,
      })

      const videoTrack = stream.getVideoTracks()[0]

      // Handle user clicking the native browser "Stop sharing" floating bar
      videoTrack.onended = () => {
        stopScreenShare()
      }

      setScreenStream(stream)
      setIsScreenSharing(true)
      toast.success('🖥️ Screen sharing active')
      return true
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        // User canceled browser picker
        toast('Screen sharing cancelled')
      } else {
        const msg = err instanceof Error ? err.message : 'Error sharing screen'
        toast.error('Screen share failed: ' + msg)
      }
      setIsScreenSharing(false)
      return false
    }
  }, [stopScreenShare])

  // Switch Camera
  const switchCamera = useCallback(async (deviceId: string): Promise<boolean> => {
    setSelectedCameraId(deviceId)
    if (isCameraOn) {
      return await startCamera(deviceId)
    }
    return true
  }, [isCameraOn, startCamera])

  // Switch Microphone
  const switchMic = useCallback(async (deviceId: string): Promise<boolean> => {
    setSelectedMicId(deviceId)
    if (isMicOn) {
      return await startMic(deviceId)
    }
    return true
  }, [isMicOn, startMic])

  // Clean up all tracks and audio contexts on component unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    localStream,
    screenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    audioLevel,
    isSpeaking,
    error,
    devices,
    selectedCameraId,
    selectedMicId,
    toggleCamera,
    toggleMic,
    startCamera,
    stopCamera,
    startMic,
    stopMic,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMic,
    refreshDevices,
  }
}

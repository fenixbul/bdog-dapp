'use client'

import { useEffect, useRef } from 'react'
import { criticalResources } from '@/lib/config'

interface ResourcePreloaderProps {
  resources?: string[]
  onLoadComplete?: () => void
}

export function ResourcePreloader({ 
  resources = criticalResources, 
  onLoadComplete 
}: ResourcePreloaderProps) {
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true

    const loadResource = (url: string) => {
      if (url.endsWith('.mp4')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = url
      } else {
        const img = new Image()
        img.src = url
      }
    }

    resources.forEach(loadResource)
    
    setTimeout(() => {
      onLoadComplete?.()
    }, 100)
  }, [resources, onLoadComplete])

  return null
}



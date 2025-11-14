import React, { useCallback, useEffect, useImperativeHandle } from 'react'
import Esper from '../../esper/index.js'
import { useResizeObserver } from '../../hooks/use-resize-observer.js'

export const EsperView = React.forwardRef(({
  children,
  onChange,
  onPhotoError,
  onResize,
  onResolutionChange,
  onSelectionActivate,
  onSelectionCreate,
  onSelectText,
  onTextureChange,
  onWheelPan,
  onWheelZoom,
  onZoomIn,
  onZoomOut,
  textSelection
}, ref) => {

  let handleResize = useResizeObserver(onResize)

  let onMount = useCallback((node) => {
    if (node) {
      Esper.instance.mount(node)
    } else {
      Esper.instance.unmount()
    }
    handleResize(node)
  }, [handleResize])

  useImperativeHandle(ref, () => (Esper.instance), [])

  useEffect(() => {
    // link text selection
    Esper.instance.textSelection = textSelection
  }, [textSelection])

  useEffect(() => {
    Esper.instance
      .on('change', onChange)
      .on('photo-error', onPhotoError)
      .on('resolution-change', onResolutionChange)
      .on('selection-activate', onSelectionActivate)
      .on('selection-create', onSelectionCreate)
      .on('select-text', onSelectText)
      .on('texture-change', onTextureChange)
      .on('wheel-pan', onWheelPan)
      .on('wheel-zoom', onWheelZoom)
      .on('zoom-in', onZoomIn)
      .on('zoom-out', onZoomOut)
    return () => {
      Esper.instance
        .off('change', onChange)
        .off('photo-error', onPhotoError)
        .off('resolution-change', onResolutionChange)
        .off('selection-activate', onSelectionActivate)
        .off('selection-create', onSelectionCreate)
        .off('select-text', onSelectText)
        .off('texture-change', onTextureChange)
        .off('wheel-pan', onWheelPan)
        .off('wheel-zoom', onWheelZoom)
        .off('zoom-in', onZoomIn)
        .off('zoom-out', onZoomOut)
    }
  }, [
    onChange,
    onPhotoError,
    onResolutionChange,
    onSelectionActivate,
    onSelectionCreate,
    onSelectText,
    onTextureChange,
    onWheelPan,
    onWheelZoom,
    onZoomIn,
    onZoomOut
  ])

  return (
    <div className="esper-view-container">
      <div ref={onMount} className="esper-view"/>
      {children}
    </div>
  )
})

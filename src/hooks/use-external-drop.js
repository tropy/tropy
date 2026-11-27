import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { webUtils } from 'electron'
import { useEvent } from './use-event.js'
import { isAppDrag } from '../components/dnd.js'

// Drops from outside the app (files, URLs, text; also native drags
// inside the window, e.g. text from the notepad) on native events.
// Drags of the app's own types (Pragmatic's) are not seen here.

// The items ({ kind, type }) of the native drag over the window,
// or null. Chromium exposes kinds and types (not data) during a drag.
let current = null
let subscribers = new Set()

// The elements the drag entered and has not left,
// to tell when it leaves the window.
let entered = new Set()

// The drag and drop events already claimed by an inner target.
let claimed = new WeakSet()

const EVENTS = ['dragenter', 'dragleave', 'dragover', 'drop']

let update = (items) => {
  if (items !== current) {
    current = items
    for (let fn of subscribers) fn()
  }
}

// Each drag entering the window replaces the items,
// in case the last one ended unseen.
let onDragEnter = ({ dataTransfer, target }) => {
  if (entered.size === 0)
    update(isAppDrag(dataTransfer)
      ? null
      : Array.from(dataTransfer.items, ({ kind, type }) => ({ kind, type })))

  entered.add(target)
}

let onDragLeave = ({ target }) => {
  entered.delete(target)

  for (let node of entered)
    if (!node.isConnected) entered.delete(node)

  if (entered.size === 0) update(null)
}

let onDragEnd = () => {
  entered.clear()
  update(null)
}

// Enter and leave in the capture phase, so targets see the items
// of the same event; drop and end in the bubble phase, after them.
let listeners = [
  ['dragenter', onDragEnter, true],
  ['dragleave', onDragLeave, true],
  ['drop', onDragEnd, false],
  ['dragend', onDragEnd, false]
]

let subscribe = (fn) => {
  if (subscribers.size === 0)
    for (let [type, listener, capture] of listeners)
      window.addEventListener(type, listener, capture)

  subscribers.add(fn)

  return () => {
    subscribers.delete(fn)

    if (subscribers.size === 0) {
      for (let [type, listener, capture] of listeners)
        window.removeEventListener(type, listener, capture)
      onDragEnd()
    }
  }
}

let readDrop = (dataTransfer) => ({
  // Empty for files not on disk.
  files: Array.from(dataTransfer.files, webUtils.getPathForFile)
    .filter(Boolean),
  urls: dataTransfer.getData('text/uri-list')
    .split(/\r?\n/)
    .filter(url => url && !url.startsWith('#')),
  text: dataTransfer.getData('text/plain')
})

// Accepts a drag by its items; returns its state and
// a ref for the target element (stable, a callback).
// The innermost target accepting a drag gets the drop,
// unless canDrop refuses the dropped data (it then goes on
// to the next accepting target around it).
// onDrop and canDrop receive { files (paths), urls, text }.
export function useExternalDrop ({
  accept,
  canDrop: canDropData,
  isDisabled = false,
  onDrop
}) {
  let [element, setElement] = useState(null)

  // Reads the module state, also in the listeners: the store's
  // update may not be rendered yet when a drag's first events arrive.
  // A boolean snapshot: targets re-render only when theirs changes.
  let canAccept = () =>
    !isDisabled && current != null && accept(current)

  let canDrop = useSyncExternalStore(subscribe, canAccept)

  // The enter and leave count of the current drag (by its items)
  // in a ref: only isOver is state, so the target re-renders
  // when the drag enters or leaves it, not at every element inside.
  let depth = useRef({ items: null, count: 0 })
  let [isOver, setIsOver] = useState(false)

  // A drag that ended or left (dragleave events that did not
  // reach the target, e.g. leaving the window) leaves it.
  if (!canDrop && isOver)
    setIsOver(false)

  let count = (delta) => {
    let d = depth.current

    if (d.items !== current)
      Object.assign(d, { items: current, count: 0 })

    d.count = Math.max(0, d.count + delta)
    setIsOver(d.count > 0)
  }

  // An accepted event no inner target claimed.
  let isFree = (event) =>
    canAccept() && !claimed.has(event)

  let claim = (event) => {
    claimed.add(event)
    event.preventDefault()
  }

  let handleEvent = useEvent((event) => {
    switch (event.type) {
      case 'dragenter':
        if (canAccept()) count(1)
        break
      case 'dragleave':
        if (canAccept()) count(-1)
        break
      case 'dragover':
        if (isFree(event)) {
          claim(event)
          event.dataTransfer.dropEffect = 'copy'
        }
        break
      case 'drop': {
        if (!isFree(event)) break
        let data = readDrop(event.dataTransfer)
        if (canDropData?.(data) === false) break
        claim(event)
        onDrop(data)
        break
      }
    }
  })

  useEffect(() => {
    if (element == null) return

    for (let type of EVENTS)
      element.addEventListener(type, handleEvent)

    return () => {
      for (let type of EVENTS)
        element.removeEventListener(type, handleEvent)
    }
  }, [element, handleEvent])

  return [{ canDrop, isOver: canDrop && isOver }, setElement]
}

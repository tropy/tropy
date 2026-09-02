import React, { useLayoutEffect, useRef } from 'react'
import cx from 'classnames'
import { useEventHandler } from '../../hooks/use-event-handler.js'
import { growingEdge } from '../../selection.js'

// Returns the next (dir > 0) or previous string element, starting at
// node, but never one of its descendants.
const step = (root, node, dir) => {
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => n.classList.contains('string') ?
      NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
  })

  walker.currentNode = node

  if (dir < 0)
    return walker.previousNode()

  // Subtle: nextNode() descends into node, but the boundary we resolve
  // lies behind it, so skip its subtree!
  let next = walker.nextNode()
  while (next != null && node.contains(next)) next = walker.nextNode()

  return next
}

// Returns the first (dir > 0) or last string element inside node.
const edge = (node, dir) => {
  let all = node.querySelectorAll?.('.string')
  return all?.length ? all[dir > 0 ? 0 : all.length - 1] : null
}

// Returns the string element containing node, if any.
const stringAt = (root, node) => {
  if (node == null || !root.contains(node))
    return null

  return (node.nodeType === Node.TEXT_NODE ?
    node.parentElement : node)?.closest('.string')
}

// Resolves a range boundary to the string element it selects, looking
// forwards (dir > 0) for the range's start and backwards for its end.
const boundary = (root, container, offset, dir) => {
  if (!root.contains(container))
    return edge(root, dir)

  // Boundaries inside a string select it, at any offset.
  let inside = stringAt(root, container)

  if (inside != null)
    return inside

  let node = container.childNodes[dir > 0 ? offset : offset - 1]

  if (node == null)
    return step(root, container, dir)

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.classList.contains('string'))
      return node

    let string = edge(node, dir)
    if (string != null)
      return string
  }

  return step(root, node, dir)
}

// Returns the indices of the first and last string element covered by
// the current native text selection.
const selectedRange = (root) => {
  let selection = document.getSelection()

  if (!selection?.rangeCount || selection.isCollapsed)
    return []

  let range = selection.getRangeAt(0)

  if (!range.intersectsNode(root))
    return []

  let head = boundary(root, range.startContainer, range.startOffset, 1)
  let tail = boundary(root, range.endContainer, range.endOffset, -1)

  if (head == null || tail == null)
    return []

  let idx = Number(head.dataset.idx)
  let jdx = Number(tail.dataset.idx)

  // The selection lies entirely between two strings.
  return (idx > jdx) ? [] : [idx, jdx]
}

// Expands a collapsed selection to the string it was placed in, so that
// clicking into a word selects it, like double-clicking does natively.
const selectWord = (root) => {
  let selection = document.getSelection()

  if (!selection?.isCollapsed)
    return

  let string = stringAt(root, selection.anchorNode)

  if (string != null)
    selection.selectAllChildren(string)
}

const useRevealSelection = (dom, selection) => {
  let previous = useRef()

  useLayoutEffect(() => {
    let nodes = dom.current.querySelectorAll('.string.selected')
    let head = nodes[0]
    let tail = nodes[nodes.length - 1]

    let range = (head == null)
      ? []
      : [Number(head.dataset.idx), Number(tail.dataset.idx)]

    let growing = growingEdge(range, previous.current)
    previous.current = range

    if (growing === 0)
      return

    let node = (growing < 0) ? head : tail
    node.scrollIntoView({ block: 'nearest' })
  }, [dom, selection])
}

// Reports the strings covered by the native text selection,
// unless we have reported them already.
const useNativeSelection = (dom, alto, selection, onSelect) => {
  let previous = useRef({})

  useEventHandler(document, 'selectionchange', () => {
    let range = selectedRange(dom.current)
    let [head, tail] = range

    if (head === previous.current.head &&
      tail === previous.current.tail &&
      selection === previous.current.selection)
      return

    let next = (head == null) ?
      new Map :
      alto.range(alto.getStringAt(head), alto.getStringAt(tail))

    previous.current = { head, tail, selection: next }
    onSelect(next, range)
  })
}

export const Alto = React.memo(({
  document: alto,
  onSelect,
  outline = 'none',
  selection
}) => {
  let dom = useRef()

  useRevealSelection(dom, selection)
  useNativeSelection(dom, alto, selection, onSelect)

  let idx = 0

  return (
    <section
      ref={dom}
      className={cx('alto-document', `outline-${outline}`)}
      onClick={() => selectWord(dom.current)}>
      {alto.blocks().map((block, bidx) => (
        <TextBlock key={bidx}>
          {block.lines().map((line, lidx) => (
            <Line key={lidx}>
              {line.strings().map((string, sidx) => (
                <String
                  key={sidx}
                  idx={idx++}
                  isSelected={!!selection?.get(string)}
                  value={string}/>
              )).toArray()}
            </Line>
          )).toArray()}
        </TextBlock>
      )).toArray()}
    </section>
  )
})

export const TextBlock = ({ children }) => (
  <div className="text-block">
    {children}
  </div>
)

export const Line = ({ children }) => (
  <div className="text-line">
    {children}
  </div>
)

export const String = React.memo(({
  idx,
  isSelected = false,
  value
}) => (
  <>
    <div
      className={cx('string', { selected: isSelected })}
      data-idx={idx}>
      {value.CONTENT}
    </div>
    {' '}
  </>
))

import { history } from 'prosemirror-history'
import { gapCursor } from 'prosemirror-gapcursor'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { Plugin } from 'prosemirror-state'

import {
  InputRule,
  inputRules,
  smartQuotes,
  ellipsis,
  wrappingInputRule
} from 'prosemirror-inputrules'

const enDash = new InputRule(/--$/, '–')
const enDashAuto = new InputRule(/ - $/, ' – ')

const emDash = new InputRule(/–-$/, '—')

const hrRule = (hr, p) =>
  // hrRule must come before the emDash because the patterns match!
  new InputRule(/^\s*–-$/, (state, match, start, end) =>
    state.tr.replaceRangeWith(start, end, [hr.create(), p.create()])
  )

const blockQuoteRule = (nodeType) =>
  wrappingInputRule(/^\s*>\s$/, nodeType)

const orderedListRule = (nodeType) =>
  wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order === +match[1])

const bulletListRule = (nodeType) =>
  wrappingInputRule(/^\s*([-+*])\s$/, nodeType)

const pseudoSelection = ({ className = 'pseudo-selection' } = {}) =>
  new Plugin({
    props: {
      decorations: ({ doc, selection }) =>
        DecorationSet.create(doc, [
          Decoration.inline(selection.from, selection.to, {
            class: className
          })
        ])
    }
  })

export function createPlugins(schema) {
  const rules = [
    enDash, enDashAuto, emDash, ellipsis, ...smartQuotes
  ]

  if (schema.nodes.blockquote) {
    rules.push(blockQuoteRule(schema.nodes.blockquote))
  }

  if (schema.nodes.ordered_list) {
    rules.push(orderedListRule(schema.nodes.ordered_list))
  }

  if (schema.nodes.bullet_list) {
    rules.push(bulletListRule(schema.nodes.bullet_list))
  }

  if (schema.nodes.horizontal_rule) {
    rules.unshift(
      hrRule(schema.nodes.horizontal_rule, schema.nodes.paragraph)
    )
  }

  return [
    gapCursor(),
    history(),
    inputRules({ rules }),
    pseudoSelection()
  ]
}

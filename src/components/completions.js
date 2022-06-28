import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Popup } from './popup'
import { OptionList } from './option'
import { translate } from '../common/math'
import { bounds, viewport } from '../dom'
import * as collate from '../collate'
import cx from 'classnames'
import memoize from 'memoize-one'
import { SASS } from '../constants'

import {
  array, arrayOf, bool, func, instanceOf, number, oneOfType, string
} from 'prop-types'

const {
  INPUT: { BORDER_WIDTH, FOCUS_SHADOW_WIDTH },
  POPUP: { PADDING }
} = SASS

const MARGIN = BORDER_WIDTH + FOCUS_SHADOW_WIDTH

export const Highlight = ({ text, matchData }) => (
  (!Array.isArray(matchData)) ? text : (
    <>
      {text.slice(0, matchData[0])}
      <strong>{text.slice(...matchData)}</strong>
      {text.slice(matchData[1])}
    </>
  )
)

Highlight.propTypes = {
  text: string.isRequired,
  matchData: oneOfType([
    arrayOf(number),
    bool
  ])
}


export class Completions extends React.Component {
  optionsList = React.createRef()

  state = {
    options: [],
    active: null
  }

  static getDerivedStateFromProps(props, state) {
    let query = props.query.trim().toLowerCase()

    let options = Completions.filter(
      props.completions,
      query,
      props.selection,
      props.isExactMatchHidden,
      props.isSelectionHidden,
      props.match,
      props.toId,
      props.toText)

    let active = (state.options === options) ?
      state.active :
      (!query.length && !props.isSelectionHidden) ?
        props.selection.at(-1) : null

    if (!active && !props.isAdvisory && options.length > 0) {
      active = options[0].id
    }

    return { active, options }
  }

  static filter = memoize(
    (
      completions,
      query,
      selection,
      isExactMatchHidden,
      isSelectionHidden,
      match,
      toId,
      toText
    ) => {
      let options = []

      options.idx = {}

      completions.forEach((value, idx) => {
        let id = toId(value)
        let isSelected = selection.includes(id)
        let isHidden = (isSelectionHidden && isSelected) ||
          (isExactMatchHidden && id === query)

        if (!isHidden) {
          let m = !query.length || match(value, query)
          if (m != null && m !== false) {
            options.idx[id] = options.length
            options.push({
              id, idx, value, text: toText(value, { isSelected, matchData: m })
            })
          }
        }
      })

      return options
    }
  )

  componentDidUpdate(_, state) {
    if (state.options.length !== this.state.options.length) {
      if (this.props.onResize != null) {
        this.props.onResize({
          rows: this.state.options.length
        })
      }
    }
  }

  getPopupBounds() {
    if (this.props.parent == null) return

    let bnd = bounds(this.props.parent)
    let height = this.getOptionsHeight() + PADDING + BORDER_WIDTH

    let [anchor, clip] = (bnd.bottom + height <= viewport().height) ?
      ['top', translate(bnd, { bottom: -MARGIN })] :
      ['bottom', translate(bnd, { top: MARGIN })]

    return {
      anchor,
      clip,
      height,
      left: bnd.left,
      top: Math.round((anchor === 'top') ? bnd.bottom : bnd.top - height),
      width: bnd.width
    }
  }

  getOptionsHeight(rows = this.state.options.length) {
    return OptionList.getHeight(rows || 1, { maxRows: this.props.maxRows })
  }

  get isActive() {
    return this.state.active != null
  }

  get isBlank() {
    return this.state.options.length === 0
  }

  get isEmpty() {
    return this.props.completions.length === 0
  }

  get isVisible() {
    return (this.props.isVisibleWhenBlank || !this.isBlank) &&
      this.props.minQueryLength <= this.props.query.length
  }

  get active() {
    let idx = this.state.options.idx[this.state.active]
    return (idx == null) ? null : this.state.options[idx]
  }

  select() {
    let { active } = this
    if (active != null) this.props.onSelect(this.props.completions[active.idx])
  }

  next(...args) {
    return this.optionsList.current?.next(...args)
  }

  prev(...args) {
    return this.optionsList.current?.prev(...args)
  }

  first() {
    return this.optionsList.current?.first()
  }

  last() {
    return this.optionsList.current?.last()
  }

  pageUp() {
    return this.optionsList.current?.pageUp()
  }

  pageDown() {
    return this.optionsList.current?.pageDown()
  }

  handleActivate = (option) => {
    if (option != null || this.props.isAdvisory)
      this.setState({ active: option?.id })
  }

  handleSelect = (option) => {
    this.props.onSelect(this.props.completions[option.idx])
  }

  handleResize = () => {
    this.forceUpdate()
  }

  renderCompletions() {
    if (this.isEmpty) return this.renderNoCompletions()
    if (this.isBlank) return this.renderNoMatches()

    return (
      <OptionList
        active={this.state.active}
        onActivate={this.handleActivate}
        onSelect={this.handleSelect}
        ref={this.optionsList}
        restrict={this.props.isAdvisory ? 'none' : 'wrap'}
        selection={this.props.selection}
        values={this.state.options}/>
    )
  }

  renderNoCompletions() {
    return (
      <FormattedMessage id="completions.empty"/>
    )
  }

  renderNoMatches() {
    return (
      <div className="option no-matches">
        <FormattedMessage id="completions.noMatches"/>
      </div>
    )
  }

  render() {
    if (!this.isVisible) return null
    const content = this.renderCompletions()

    if (!this.props.popup) {
      const height = this.getOptionsHeight()
      return (
        <div
          className={cx('option-container', this.props.className)}
          style={{ height }}>
          {content}
        </div>
      )
    }

    const { anchor, clip, ...style } = this.getPopupBounds()
    return (
      <Popup
        anchor={anchor}
        className={this.props.className}
        clip={clip}
        fadeIn={this.props.fadeIn}
        style={style}
        onClickOutside={this.props.onClickOutside}
        onResize={this.handleResize}>
        {content}
      </Popup>
    )
  }

  static propTypes = {
    className: string,
    completions: array.isRequired,
    fadeIn: bool,
    isAdvisory: bool,
    isExactMatchHidden: bool,
    isSelectionHidden: bool,
    isVisibleWhenBlank: bool,
    match: func.isRequired,
    maxRows: number.isRequired,
    minQueryLength: number.isRequired,
    onClickOutside: func,
    onResize: func,
    onSelect: func.isRequired,
    parent: instanceOf(HTMLElement),
    popup: bool,
    query: string.isRequired,
    selection: array.isRequired,
    toId: func.isRequired,
    toText: func.isRequired
  }

  static defaultProps = {
    match(value, query) {
      return collate.match(value.name || String(value), query)
    },
    maxRows: 10,
    minQueryLength: 0,
    popup: true,
    selection: [],
    toId(value) {
      return (value.id || String(value))
    },
    toText: (value, { matchData } = {}) =>
      <Highlight text={value.name || String(value)} matchData={matchData}/>
  }
}

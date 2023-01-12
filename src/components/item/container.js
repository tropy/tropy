import React from 'react'
import { connect } from 'react-redux'
import { Resizable } from '../resizable'
import { EsperContainer } from '../esper'
import { NotePad } from '../note/index.js'
import * as act from '../../actions'
import cx from 'classnames'
import { SASS, ITEM } from '../../constants'

import {
  arrayOf, bool, func, number, object, shape, string
} from 'prop-types'

import {
  selectCachePrefix,
  getEsperViewState,
  getActiveSelection,
  getPhotoSelections
} from '../../selectors'

const { LAYOUT } = ITEM
const { ESPER } = SASS

class Item extends React.PureComponent {
  notepad = React.createRef()

  get dimension() {
    return (this.props.settings.layout === LAYOUT.SIDE_BY_SIDE) ?
      'width' : 'height'
  }

  get size() {
    switch (this.props.settings.layout) {
      case LAYOUT.STACKED:
        return this.props.esper.height
      case LAYOUT.SIDE_BY_SIDE:
        return this.props.esper.width
      default:
        return 100
    }
  }

  get hasSideBySideLayout() {
    return this.props.settings.layout === LAYOUT.SIDE_BY_SIDE
  }

  get hasOverlayToolbars() {
    return this.props.settings.overlayToolbars &&
      this.props.settings.layout !== LAYOUT.SIDE_BY_SIDE
  }

  getResizableProps(layout = this.props.settings.layout) {
    return layout === LAYOUT.SIDE_BY_SIDE ?
      { edge: 'right', margin: ESPER.MIN_WIDTH, min: ESPER.MIN_WIDTH } :
      { edge: 'bottom', margin: ESPER.MIN_HEIGHT, min: ESPER.MIN_HEIGHT }
  }

  handleContextMenu = (event, scope = 'item-view', opts = {}) => {
    this.props.onContextMenu(event, scope, {
      layout: this.props.settings.layout,
      ...opts
    })
  }

  handleEsperChange = ({ photo, selection, view, esper }) => {
    if (esper != null) {
      this.props.onUiUpdate({ esper })
    }
    if (photo != null) {
      this.props.onPhotoSave(photo)
    }
    if (selection != null) {
      this.props.onSelectionSave(selection)
    }
    if (view != null) {
      this.props.onEsperChange({ view })
    }
  }

  handleEsperResize = (value) => {
    this.props.onUiUpdate({
      esper: { [this.dimension]: value }
    })
  }

  focusNotePad = () => {
    this.notepad.current.focus()
  }

  render() {
    return (
      <div
        className={cx('item-container', this.props.settings.layout)}
        onContextMenu={this.handleContextMenu}>
        <Resizable
          {...this.getResizableProps()}
          isBuffered
          isRelative
          value={this.size}
          onChange={this.handleEsperResize}>
          <EsperContainer {...this.props.view}
            cache={this.props.cache}
            mode={this.props.view.mode || this.props.settings.zoomMode}
            hasOverlayToolbar={this.hasOverlayToolbars}
            invertScroll={this.props.settings.invertScroll}
            invertZoom={this.props.settings.invertZoom}
            isDisabled={this.props.isDisabled || !this.props.photo}
            isReadOnly={this.props.isDisabled || this.props.isReadOnly}
            isPanelVisible={this.props.esper.panel}
            keymap={this.props.keymap.Esper}
            photo={this.props.photo}
            selection={this.props.selection}
            selections={this.props.selections}
            tool={this.props.esper.tool}
            onContextMenu={this.handleContextMenu}
            onChange={this.handleEsperChange}
            onPhotoConsolidate={this.props.onPhotoConsolidate}
            onPhotoError={this.props.onPhotoError}
            onSelect={this.props.onPhotoSelect}
            onSelectionCreate={this.props.onSelectionCreate}/>
        </Resizable>
        <NotePad
          ref={this.notepad}
          note={this.props.note}
          hasTitlebar={this.hasSideBySideLayout}
          isDisabled={this.props.isDisabled || !this.props.photo}
          isReadOnly={this.props.isDisabled || this.props.isReadOnly}
          keymap={this.props.keymap.NotePad}
          onContextMenu={this.handleContextMenu}/>
      </div>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    esper: shape({
      height: number.isRequired,
      width: number.isRequired,
      panel: bool.isRequired,
      tool: string.isRequired
    }).isRequired,
    view: object.isRequired,
    isDisabled: bool,
    isReadOnly: bool,
    keymap: object.isRequired,
    note: object,
    photo: object,
    selection: object,
    selections: arrayOf(object).isRequired,
    settings: object.isRequired,
    onContextMenu: func.isRequired,
    onEsperChange: func.isRequired,
    onPhotoConsolidate: func.isRequired,
    onPhotoCreate: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onSelectionCreate: func.isRequired,
    onSelectionSave: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

export const ItemContainer = connect(
    state => ({
      cache: selectCachePrefix(state),
      esper: state.ui.esper,
      view: getEsperViewState(state),
      keymap: state.keymap,
      selection: getActiveSelection(state),
      selections: getPhotoSelections(state),
      settings: state.settings
    }),

    dispatch => ({
      onSelectionCreate(...args) {
        dispatch(act.selection.create(...args))
      },

      onSelectionSave(...args) {
        dispatch(act.selection.save(...args))
      },

      onEsperChange(...args) {
        dispatch(act.esper.update(...args))
      },

      onPhotoError(...args) {
        dispatch(act.photo.error(...args))
      }

    }), null, { forwardRef: true }
  )(Item)

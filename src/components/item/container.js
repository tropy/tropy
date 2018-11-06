'use strict'

const React = require('react')
const { connect } = require('react-redux')
const { BufferedResizable } = require('../resizable')
const { Esper } = require('../esper')
const { NotePad } = require('../note')
const act = require('../../actions')
const { SASS: { ESPER } } = require('../../constants')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const {
  getCachePrefix,
  getEsperViewState,
  getNotePadState,
  getActiveSelection,
  getPhotoSelections
} = require('../../selectors')


class ItemContainer extends React.PureComponent {
  setNotePad = (notepad) => {
    this.notepad = notepad
  }

  handleEsperChange = ({ photo, selection, image, esper }) => {
    if (esper != null) {
      this.props.onUiUpdate({ esper })
    }
    if (photo != null) {
      this.props.onPhotoSave(photo)
    }
    if (selection != null) {
      this.props.onSelectionSave(selection)
    }
    if (image != null) {
      this.props.onEsperChange({ view: image })
    }
  }

  handleEsperResize = (height) => {
    this.props.onUiUpdate({ esper: { height } })
  }

  render() {
    return (
      <div className="item-container">
        <BufferedResizable
          edge="bottom"
          value={this.props.esper.height}
          isRelative
          onChange={this.handleEsperResize}
          margin={38}
          min={ESPER.MIN_HEIGHT}>
          <Esper {...this.props.view}
            cache={this.props.cache}
            mode={this.props.view.mode || this.props.settings.zoomMode}
            hasOverlayToolbar={this.props.settings.overlayToolbars}
            invertScroll={this.props.settings.invertScroll}
            invertZoom={this.props.settings.invertZoom}
            isDisabled={this.props.isDisabled}
            isItemOpen={this.props.isOpen}
            isPanelVisible={this.props.esper.panel}
            keymap={this.props.keymap.Esper}
            photo={this.props.photo}
            selection={this.props.selection}
            selections={this.props.selections}
            tool={this.props.esper.tool}
            onChange={this.handleEsperChange}
            onPhotoError={this.props.onPhotoError}
            onSelect={this.props.onPhotoSelect}
            onSelectionCreate={this.props.onSelectionCreate}/>
        </BufferedResizable>
        <NotePad {...this.props.notepad}
          ref={this.setNotePad}
          note={this.props.note}
          isDisabled={this.props.isDisabled || !this.props.photo}
          isItemOpen={this.props.isOpen}
          keymap={this.props.keymap.NotePad}
          onChange={this.props.onNoteChange}
          onCommit={this.props.onNoteCommit}
          onContextMenu={this.props.onContextMenu}/>
      </div>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    esper: shape({
      height: number.isRequired,
      panel: bool.isRequired,
      tool: string.isRequired
    }).isRequired,
    view: object.isRequired,
    isDisabled: bool.isRequired,
    isOpen: bool.isRequired,
    keymap: object.isRequired,
    note: object,
    notepad: object.isRequired,
    photo: object,
    selection: object,
    selections: arrayOf(object).isRequired,
    settings: object.isRequired,
    onContextMenu: func.isRequired,
    onEsperChange: func.isRequired,
    onNoteChange: func.isRequired,
    onNoteCommit: func.isRequired,
    onPhotoError: func.isRequired,
    onPhotoSave: func.isRequired,
    onPhotoSelect: func.isRequired,
    onSelectionCreate: func.isRequired,
    onSelectionSave: func.isRequired,
    onUiUpdate: func.isRequired
  }
}

module.exports = {
  ItemContainer: connect(
    state => ({
      cache: getCachePrefix(state),
      esper: state.ui.esper,
      view: getEsperViewState(state),
      notepad: getNotePadState(state),
      keymap: state.keymap,
      selection: getActiveSelection(state),
      selections: getPhotoSelections(state),
      settings: state.settings
    }),

    dispatch => ({
      onPhotoSave(...args) {
        dispatch(act.photo.save(...args))
      },

      onPhotoSelect(...args) {
        dispatch(act.photo.select(...args))
      },

      onSelectionCreate(...args) {
        dispatch(act.selection.create(...args))
      },

      onSelectionSave(...args) {
        dispatch(act.selection.save(...args))
      },

      onEsperChange(...args) {
        dispatch(act.esper.update(...args))
      }
    }), null, { withRef: true }
  )(ItemContainer)
}

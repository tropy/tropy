'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { BufferedResizable } = require('../resizable')
const { Esper } = require('../esper')
const { NotePad } = require('../note')
const act = require('../../actions')

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const {
  getActiveImageProps,
  getPhotoSelections
} = require('../../selectors')


class ItemContainer extends PureComponent {
  handleEsperChange = ({ photo, ...ui }) => {
    this.props.onUiUpdate(ui)

    if (photo != null) {
      this.props.onPhotoSave(photo)
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
          min={256}>
          <Esper {...this.props.image}
            isDisabled={this.props.isDisabled}
            photo={this.props.photo}
            selection={this.props.selection}
            selections={this.props.selections}
            tool={this.props.esper.tool}
            onChange={this.handleEsperChange}
            onSelectionCreate={this.props.onSelectionCreate}/>
        </BufferedResizable>
        <NotePad
          ref={this.setNotePad}
          note={this.props.note}
          isDisabled={this.props.isDisabled || !this.props.photo}
          isItemOpen={this.props.isOpen}
          keymap={this.props.keymap.NotePad}
          onChange={this.props.onNoteChange}/>
      </div>
    )
  }

  static propTypes = {
    esper: shape({
      height: number.isRequired,
      tool: string.isRequired
    }).isRequired,
    image: object.isRequired,
    isDisabled: bool.isRequired,
    isOpen: bool.isRequired,
    keymap: object.isRequired,
    note: object,
    photo: object,
    selection: number,
    selections: arrayOf(object).isRequired,
    onNoteChange: func.isRequired,
    onPhotoSave: func.isRequired,
    onSelectionCreate: func.isRequired,
    onUiUpdate: func.isRequired
  }
}


module.exports = {
  ItemContainer: connect(
    state => ({
      esper: state.ui.esper,
      image: getActiveImageProps(state),
      keymap: state.keymap,
      selection: state.nav.selection,
      selections: getPhotoSelections(state)
    }),

    dispatch => ({
      onPhotoSave(...args) {
        dispatch(act.photo.save(...args))
      },

      onSelectionCreate(...args) {
        dispatch(act.selection.create(...args))
      }
    })
  )(ItemContainer)
}

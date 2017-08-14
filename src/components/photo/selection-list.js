'use strict'

const React = require('react')
const { PureComponent } = React
const { array } = require('prop-types')


class SelectionList extends PureComponent {

  render() {
    return (
      <ul className="selection list">
        {this.props.selections.map(selection =>
          <div key={selection}>{selection}</div>)}
      </ul>
    )
  }

  static propTypes = {
    selections: array.isRequired
  }
}

module.exports = {
  SelectionList
}

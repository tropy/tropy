'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

class Wizard extends React.Component {
  render() {
    return (
      <div className="wizard">
        {this.props.children}
      </div>
    )
  }
}


module.exports = {
  mount(node) { ReactDOM.render(<Wizard/>, node) },

  Wizard
}

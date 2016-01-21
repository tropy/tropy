'use strict'

const React = require('react')
const ReactDOM = require('react-dom')

const { Component, PropTypes } = React


class Assistant extends Component {
  render() {
    return (
      <ol className="assistant">{
        this.props.steps.map((step, idx) => (
          <Step {...step} key={idx}/>
        ))
      }</ol>
    )
  }
}

Assistant.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    done: PropTypes.bool.isRequired
  }).isRequired).isRequired
}

module.exports = {
  mount(node) { ReactDOM.render(<Assistant/>, node) },

  Assistant
}

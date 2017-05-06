'use strict'

const React = require('react')
const { PureComponent } = React
const { Vocabulary } = require('./vocabulary')
const { object } = require('prop-types')

class VocabList extends PureComponent {

  render() {
    const vocabs = Object.values(this.props.vocab)

    return (
      <div className="panel-group form-horizontal">
        {vocabs.map(vocab =>
          <Vocabulary
            key={vocab.uri}
            vocab={vocab}
            properties={this.props.properties}/>)}
      </div>
    )
  }

  static propTypes = {
    properties: object.isRequired,
    vocab: object.isRequired
  }
}

module.exports = {
  VocabList
}

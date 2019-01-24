'use strict'

const React = require('react')
const { func, node, number, string } = require('prop-types')
const { FormattedMessage } = require('react-intl')


const MetadataSection = ({ children, count, onContextMenu, title }) => (
  <section onContextMenu={onContextMenu}>
    <h5 className="metadata-heading">
      <FormattedMessage id={title} values={{ count }}/>
    </h5>
    {children}
  </section>
)

MetadataSection.propTypes = {
  children: node.isRequired,
  count: number,
  onContextMenu: func,
  title: string.isRequired
}

module.exports = {
  MetadataSection
}

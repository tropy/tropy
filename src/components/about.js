import { FormattedMessage } from 'react-intl'
import { product, version } from '../common/release.js'
import { Titlebar } from './toolbar.js'
import { Link } from './link.js'

export const About = () => (
  <div className="about-view">
    <Titlebar isOptional/>
    <figure className="app-icon"/>
    <div>
      <h1><span className="product">{product}</span></h1>
      <p className="version">
        <FormattedMessage id="about.version" values={{ version }}/>
        {' '}
        (
        {process.arch}
        )
      </p>
      <p>
        <FormattedMessage
          id="about.text"
          values={{
            c2dh: <Link id="about.c2dh"/>,
            rrchnm: <Link id="about.rrchnm"/>
          }}/>
      </p>
      <p>
        <FormattedMessage
          id="about.trademark"
          values={{ cds: <Link id="about.cds"/> }}/>
      </p>
      <p className="links">
        <Link id="about.release" version={version}/>
        <Link id="about.license"/>
        <Link id="about.credits"/>
      </p>
    </div>
  </div>
)

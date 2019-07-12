'use strict'

const React = require('react')
const cx = require('classnames')
const { Rotation } = require('../../common/iiif')
const { bool, number, string } = require('prop-types')

const Photo = ({ angle, height, mirror, orientation, path, width }) => {
  let rotation = Rotation
    .fromExifOrientation(orientation)
    .add({ angle, mirror })

  return (
    <div className={classes(width < height, rotation.isHorizontal)}>
      <div className="photo-container">
        <img
          className={`iiif rot-${rotation.format('x')}`}
          src={path}/>
      </div>
        <div className="metadata-container">
          <div className="col">
            <section>
              <h5 className="metadata-heading">Item</h5>
              <ol className="metadata-fields">
                <li className="metadata-field">
                  <label>Title</label>
                  <div className="value">Cathcart to Eaton</div>
                </li>
                <li className="metadata-field">
                  <label>Author</label>
                  <div className="value">Cathcart, James Leander</div>
                </li>
                <li className="metadata-field">
                  <label>Recipient</label>
                  <div className="value">Eaton, William</div>
                </li>
                <li className="metadata-field">
                  <label>Date</label>
                  <div className="value">Oct 11, 1800</div>
                </li>
                <li className="metadata-field">
                  <label>Location</label>
                  <div className="value">Tripoli</div>
                </li>
                <li className="metadata-field">
                  <label>Type</label>
                  <div className="value">Correspondence</div>
                </li>
                <li className="metadata-field">
                  <label>Archive</label>
                  <div className="value">Library of Congress</div>
                </li>
                <li className="metadata-field">
                  <label>Collection</label>
                  <div className="value">James L. Cathcart papers, 1785–1817</div>
                </li>
                <li className="metadata-field">
                  <label>Box</label>
                  <div className="value"/>
                </li>
                <li className="metadata-field">
                  <label>Folder</label>
                  <div className="value">Cathcart Letterbook</div>
                </li>
                <li className="metadata-field">
                  <label>Identifier</label>
                  <div className="value">MSS15388</div>
                </li>
                <li className="metadata-field">
                  <label>Rights</label>
                  <div className="value">public domain</div>
                </li>
                <li className="metadata-field">
                  <label>Finding Aid</label>
                  <div className="value">http://hdl.loc.gov/loc.mss/eadmss.ms009015</div>
                </li>
                <li className="metadata-field">
                  <label>Date Added</label>
                  <div className="value">Sep 19, 2017, 9:41 AM</div>
                </li>
                <li className="metadata-field">
                  <label>Modified</label>
                  <div className="value">Feb 7, 2019, 12:50 PM</div>
                </li>
              </ol>
            </section>
          </div>
          <div className="col">
            <section>
              <h5 className="metadata-heading">Photo</h5>
              <ol className="metadata-fields">
                <li className="metadata-field">
                  <label>Title</label>
                  <div className="value">IMG_1716</div>
                </li>
                <li className="metadata-field">
                  <label>Date</label>
                  <div className="value">Aug 13, 2018, 12:57 PM</div>
                </li>
                <li className="metadata-field">
                  <label>File</label>
                  <div className="value">IMG_1716.jpg</div>
                </li>
                <li className="metadata-field">
                  <label>Size</label>
                  <div className="value">4,032×3,024, 1.74MB</div>
                </li>
                <li className="metadata-field">
                  <label>Date Added</label>
                  <div className="value">Mar 11, 2019, 12:50 PM</div>
                </li>
                <li className="metadata-field">
                  <label>Modified</label>
                  <div className="value">Mar 18, 2019, 7:22 PM</div>
                </li>
              </ol>
            </section>
          </div>
        </div>
    </div>
  )
}

Photo.propTypes = {
  angle: number.isRequired,
  height: number.isRequired,
  mirror: bool.isRequired,
  orientation: number.isRequired,
  path: string.isRequired,
  width: number.isRequired
}

const classes = (isPortrait, isHorizontal) => cx(
  'photo',
  'page',
  'show-metadata',
  isPortrait ?
    (isHorizontal ? 'portrait' : 'landscape') :
    (isHorizontal ? 'landscape' : 'portrait')
)

module.exports = {
  Photo
}

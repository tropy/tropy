'use strict'

const {
  createSelector: memo
} = require('reselect')

const { entries } = Object
const { DC, TR, S } = require('../constants/properties')

const CORE = 'https://schema.tropy.org/v1/templates/core'
const CORNELL = 'https://schema.tropy.org/v1/templates/cornell-obama'
const PHOTO = 'https://schema.tropy.org/v1/templates/photo'
const PINKERTON = 'https://schema.tropy.org/v1/templates/pinkerton'
const TYPOGRAPHY = 'https://schema.tropy.org/v1/templates/typography'

const T = {
  [CORE]: {
    uri: CORE,
    name: 'Core Item',
    type: 'item',
    fields: [
      { property: DC.TITLE },
      { property: DC.TYPE },
      { property: DC.DATE },
      { property: DC.CREATOR },
      { property: DC.DESCRIPTION }
    ],
  },

  [CORNELL]: {
    uri: CORNELL,
    name: 'Cornell Obama',
    type: 'item',
    fields: [
      { property: DC.TITLE },
      { property: DC.DATE, hint: 'Date of creation of object' },
      { property: DC.COVERAGE, hint: 'Use controlled vocabulary from Getty' },
      { property: DC.DESCRIPTION },
      {
        property: DC.PUBLISHER,
        constant: 'Division of Rare and Manuscript Collections, Cornell Library'
      },
      { property: DC.SOURCE },
      { property: DC.IDENTIFIER },
      {
        property: DC.RIGHTS,
        constant: "The Cornell University Library has made a reasonable effort to identify all possible rights holders in this image, but in this case, the current rights holders remain unknown.  The Library has elected to place the item online as an exercise of fair use for non-commercial educational use. If would like to learn more about this item and to hear from individuals or institutions that have any additional information as to rights holders: contact rareref@cornell.edu. Responsibility for making an independent legal assessment of an item and securing any necessary permissions ultimately rests with persons desiring to use the item. This image has been selected and made available by a user using Artstor's software tools. Artstor has not screened or selected this image or cleared any rights to it and is acting as an online service provider pursuant to 17 U.S.C. §512. Artstor disclaims any liability associated with the use of this image. Should you have any legal objection to the use of this image, please visit http://www.artstor.org/copyright for contact information and instructions on how to proceed."
      }
    ],
  },

  [PINKERTON]: {
    uri: PINKERTON,
    name: 'Pinkerton File',
    type: 'item',
    fields: [
      { property: DC.TITLE },
      { property: DC.TYPE },
      {
        property: DC.PUBLISHER,
        constant: 'Manuscript Division, Library of Congress'
      },
      {
        property: DC.SOURCE,
        constant: "Pinkerton's National Detective Agency records"
      },
      {
        property: DC.RIGHTS,
        constant: 'http://hdl.loc.gov/loc.mss/eadmss.ms003007'
      },
      { property: TR.BOX },
      { property: TR.FOLDER },
      { property: DC.DATE },
      { property: DC.CREATOR },
      { property: S.RECIPIENT },
      { property: DC.DESCRIPTION }
    ],
  },

  [TYPOGRAPHY]: {
    uri: TYPOGRAPHY,
    name: 'Typography',
    type: 'item',
    fields: [
      { property: DC.TITLE },
      { property: DC.TYPE },
      { property: TR.CLASSIFICATION },
      { property: DC.CREATOR },
      { property: DC.CONTRIBUTOR },
      { property: DC.DESCRIPTION },
      { property: DC.FORMAT },
      { property: DC.SOURCE },
      { property: DC.DATE },
      { property: DC.COVERAGE },
      { property: DC.RIGHTS },
      { property: DC.LANGUAGE },
      { property: DC.RELATION }
    ],
  },

  [PHOTO]: {
    uri: PHOTO,
    name: 'Tropy Photo',
    type: 'photo',
    fields: [
      { property: DC.TITLE },
      { property: DC.DATE }
    ]
  }
}

const getTemplates = memo(
  () => T,
  ({ properties }) => properties,

  (templates, properties) =>
    entries(templates)
      .reduce((tpl, [k, v]) => {
        tpl[k] = {
          ...v,
          fields: v.fields.map(field => ({
            ...field,
            property: properties[field.property]
          }))
        }

        return tpl

      }, {}))


module.exports = {
  getTemplates
}

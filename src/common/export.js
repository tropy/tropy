import { tropy } from '../ontology'

export const ctx = {
  get item() {
    return {
      '@version': 1.1,
      '@vocab': tropy.BASE,

      'template': {
        '@type': '@id'
      },

      'photo': {
        '@id': tropy.photo,
        '@container': '@list',
        '@context': ctx.photo
      }
    }
  },

  get note() {
    return {}
  },

  get photo() {
    return {
      note: {
        '@id': tropy.note,
        '@container': '@list'
        // '@context': ctx.note
      },
      selection: {
        '@id': tropy.selection,
        '@container': '@list',
        '@context': ctx.selection
      }
    }
  },

  get selection() {
    return {
      note: {
        '@id': tropy.note,
        '@container': '@list'
        // '@context': ctx.note
      }
    }
  }
}

export const props = {
  item: [
    'template'
  ],

  image: [
    'angle',
    'brightness',
    'contrast',
    'height',
    'hue',
    'mirror',
    'negative',
    'saturation',
    'sharpen',
    'width'
  ],

  photo: [
    'checksum',
    'color',
    'density',
    'mimetype',
    'orientation',
    'page',
    'path',
    'protocol',
    'size',
    'template'
  ],

  selection: [
    'template',
    'x',
    'y'
  ],

  note: [
  ],

  get all() {
    return [
      ...props.item,
      ...props.image,
      ...props.photo,
      ...props.selection,
      ...props.note
    ]
  }
}

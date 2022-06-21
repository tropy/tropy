import { join } from 'path'
import { lists } from '../fixtures/lists'
import { project } from '../fixtures/projects'
import { tags } from '../fixtures/tags'
import { selections } from '../fixtures/selections'
import { items } from '../fixtures/items'
import { metadata } from '../fixtures/metadata'
import { notes } from '../fixtures/notes'
import { ontology } from '../fixtures/ontology'
import { photos } from '../fixtures/photos'

const ROOT = join(__dirname, '..', 'fixtures')

global.F = {
  images(name) {
    return {
      path: join(ROOT, 'images', name)
    }
  },

  db(name) {
    return {
      path: join(ROOT, 'db', name)
    }
  },

  plugins(...args) {
    return {
      path: join(ROOT, 'plugins', ...args)
    }
  },

  views(...args) {
    return {
      path: join(ROOT, 'views', ...args)
    }
  },

  get preload() {
    return join(__dirname, './bootstrap.js')
  },

  get items() {
    return items
  },

  get lists() {
    return lists
  },

  get metadata() {
    return metadata
  },

  get notes() {
    return notes
  },

  get ontology() {
    return ontology
  },

  get photos() {
    return photos
  },

  get projects() {
    return project
  },

  get selections() {
    return selections
  },

  get tags() {
    return tags
  }
}

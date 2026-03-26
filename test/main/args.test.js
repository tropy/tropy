import { env, cwd, platform } from 'node:process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse, argToURL } from '#tropy/main/args.js'

describe('args', () => {
  describe('parse', () => {
    it('falls back to node env', () => {
      expect(parse([]).opts)
        .to.have.property('env', env.NODE_ENV)
    })

    it('sets --env', () => {
      expect(parse(['--env', 'development']).opts)
        .to.have.property('env', 'development')
    })

    it('parses --scale as float', () => {
      expect(parse(['--scale', '1.5']).opts)
        .to.have.property('scale', 1.5)
    })

    it('parses --port as int', () => {
      expect(parse(['--port', '3000']).opts)
        .to.have.property('port', 3000)
    })

    it('resolves --data as absolute path', () => {
      expect(parse(['--data', 'relative/path']).opts)
        .to.have.property('data', resolve('relative/path'))
    })

    it('filters out flags from args', () => {
      expect(parse(['--env', 'test', 'file.tpy']).args)
        .to.have.length(1)
    })

    it('filters out empty args', () => {
      expect(parse(['', '  ']).args).to.be.empty
    })
  })

  describe('argToURL', () => {
    it('converts a relative path to a file URL', () => {
      expect(argToURL('photo.jpg').href)
        .to.equal(pathToFileURL(resolve(cwd(), 'photo.jpg')).href)
    })

    it('converts an absolute path to a file URL', () => {
      expect(argToURL('/tmp/photo.jpg').href)
        .to.equal(pathToFileURL('/tmp/photo.jpg').href)
    })

    it('respects cwd parameter', () => {
      expect(argToURL('photo.jpg', '/home/ariadne').href)
        .to.equal(pathToFileURL('/home/ariadne/photo.jpg').href)
    })

    it('parses tropy:// URLs', () => {
      expect(argToURL('tropy://project/current/items/1/2'))
        .to.have.property('host', 'project')
    })

    it('parses file:// URLs', () => {
      expect(argToURL('file:///tmp/photo.jpg'))
        .to.have.property('pathname', '/tmp/photo.jpg')
    })

    it('parses https:// URLs', () => {
      expect(argToURL('https://tropy.test/photo.jpg'))
        .to.have.property('protocol', 'https:')
    })

    it('falls back to file URL for invalid URLs', () => {
      expect(argToURL('tropy://[invalid'))
        .to.have.property('protocol', 'file:')
    })

    it('does not treat drive letters as protocols', {
      skip: platform !== 'win32'
    }, () => {
      expect(argToURL('C:\\Users\\photo.jpg'))
        .to.have.property('protocol', 'file:')
    })
  })
})

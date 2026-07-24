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

    describe('passthrough & positionals', () => {
      for (let flag of [
        '--no-sandbox',
        '--disable-gpu',
        '--enable-logging',
        '--remote-debugging-port=9229'
      ]) {
        it(`ignores electron switch ${flag}`, () => {
          expect(() => parse([flag])).to.not.throw()
          expect(parse([flag]).args).to.be.empty
        })

        it(`ignores ${flag} alongside a file`, () => {
          expect(parse([flag, '/tmp/a.tpy']).args)
            .to.have.length(1)
        })
      }

      for (let flag of [
        '--squirrel-install',
        '--squirrel-updated',
        '--squirrel-uninstall',
        '--squirrel-obsolete',
        '--squirrel-firstrun'
      ]) {
        it(`ignores squirrel switch ${flag}`, () => {
          expect(() => parse([flag])).to.not.throw()
          expect(parse([flag]).args).to.be.empty
        })
      }

      it('passes tropy:// URLs through', () => {
        expect(parse(['tropy://project/current/items/3276/3277']).args[0])
          .to.have.property('protocol', 'tropy:')
      })

      it('passes https:// URLs through', () => {
        expect(parse(['https://tropy.test/photo.jpg']).args[0])
          .to.have.property('protocol', 'https:')
      })

      it('passes file:// URLs through', () => {
        expect(parse(['file:///tmp/photo.jpg']).args[0])
          .to.have.property('protocol', 'file:')
      })

      it('converts bare file paths to file URLs', () => {
        expect(parse(['/tmp/photo.tpy']).args[0])
          .to.have.property('href', pathToFileURL('/tmp/photo.tpy').href)
      })

      it('drops data: URIs', () => {
        expect(parse(['data:image/png;base64,iVBOR']).args).to.be.empty
      })

      it('drops data: URIs but keeps a real file alongside', () => {
        expect(parse(['data:text/plain,x', '/tmp/a.tpy']).args)
          .to.have.length(1)
      })

      it('opens multiple files in one launch', () => {
        expect(parse(['/tmp/a.tpy', '/tmp/b.tpy']).args)
          .to.have.length(2)
      })

      it('parses an electron-style dev launch argv', () => {
        let { opts, args } = parse([
          '--app', '.',
          '--env', 'development',
          '--no-sandbox',
          '/tmp/a.tpy'
        ])

        expect(opts).to.have.property('env', 'development')
        expect(opts).to.have.property('app', '.')
        expect(args).to.have.length(1)
      })

      it('parses a packaged launch argv', () => {
        let { args } = parse([
          'tropy://project/current/items/3276/3277',
          '--enable-features=Foo'
        ])

        expect(args).to.have.length(1)
        expect(args[0]).to.have.property('protocol', 'tropy:')
      })
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

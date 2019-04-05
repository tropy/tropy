{
  'includes': [ 'common-sqlite.gypi' ],
  'target_defaults': {
    'default_configuration': 'Release',
    'cflags': [
      '-std=c99',
      '-Wno-cast-function-type',
      '-Wno-implicit-fallthrough',
      '-Wno-unused-variable'
    ],
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # static release
          },
        },
      }
    },
    'msvs_settings': {
      'VCCLCompilerTool': {
      },
      'VCLibrarianTool': {
      },
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },
    'conditions': [
      ['OS == "win"', {
        'defines': [
          'WIN32'
        ],
      }]
    ],
  },

  'targets': [
    {
      'target_name': 'action_before_build',
      'type': 'none',
      'hard_dependency': 1,
      'actions': [
        {
          'action_name': 'unpack_sqlite_dep',
          'inputs': [
            './sqlite-autoconf-<@(sqlite_version).tar.gz'
          ],
          'outputs': [
            '<(SHARED_INTERMEDIATE_DIR)/sqlite-autoconf-<@(sqlite_version)/sqlite3.c'
          ],
          'action': [
            '<!(node -p "process.env.npm_config_python || \\"python\\"")',
            './extract.py','./sqlite-autoconf-<@(sqlite_version).tar.gz',
            '<(SHARED_INTERMEDIATE_DIR)']
        }
      ]
    },
    {
      'target_name': 'sqlite3',
      'type': 'static_library',
      'dependencies': [
        'action_before_build'
      ],
      'include_dirs': [
        '<(SHARED_INTERMEDIATE_DIR)/sqlite-autoconf-<@(sqlite_version)/'
      ],
      'sources': [
        '<(SHARED_INTERMEDIATE_DIR)/sqlite-autoconf-<@(sqlite_version)/sqlite3.c'
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          '<(SHARED_INTERMEDIATE_DIR)/sqlite-autoconf-<@(sqlite_version)/'
        ],
        'defines': [
          'SQLITE_THREADSAFE=1',
          'HAVE_USLEEP',
          'SQLITE_ENABLE_FTS5',
          'SQLITE_ENABLE_JSON1',
          'SQLITE_ENABLE_RTREE'
        ]
      },
      'defines': [
        '_REENTRANT=1',
        'SQLITE_THREADSAFE=1',
        'HAVE_USLEEP',
        'SQLITE_ENABLE_FTS5',
        'SQLITE_ENABLE_JSON1',
        'SQLITE_ENABLE_RTREE'
      ]
    }
  ]
}

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/vendor/**',
      'public/tinymce/**',
      'public/uploads/**',
      '.agents/**',
      'archive/**',
      'changes/**'
    ]
  },
  js.configs.recommended,
  {
    files: [
      '**/*.js',
      '**/*.mjs'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    },
    rules: {
      // Sesuai Keputusan 1 (Opsi A: Baseline warn untuk file lama, error untuk file baru/refaktor)
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 2],
      'complexity': ['warn', 8],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^(req|res|next|_)', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      'no-empty': 'warn',
      'no-cond-assign': 'warn',
      'no-redeclare': 'warn',
      'no-prototype-builtins': 'warn',
      'no-dupe-keys': 'warn',
      'no-undef': 'warn'
    }
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
        anime: 'readonly',
        Swal: 'readonly',
        tinymce: 'readonly',
        PhotoSwipe: 'readonly',
        PhotoSwipeLightbox: 'readonly'
      }
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off'
    }
  },
  // Aturan ketat (Error) khusus untuk file tooling baru
  {
    files: [
      'scripts/lint-*.js'
    ],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next|_)', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'error',
      'max-depth': ['error', 2]
    }
  },
  {
    files: [
      'controllers/admin/aboutController.js',
      'controllers/admin/authController.js',
      'controllers/admin/bannerController.js',
      'controllers/admin/brandController.js',
      'controllers/admin/homeContentController.js',
      'controllers/admin/inquiryController.js',
      'controllers/admin/mediaController.js',
      'services/aboutService.js',
      'services/aboutCrudService.js',
      'services/authService.js',
      'services/bannerService.js',
      'services/brandService.js',
      'services/homeContentService.js',
      'services/inquiryService.js',
      'services/mediaService.js'
    ],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 2],
      'complexity': ['error', 8],
      'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next|_)', varsIgnorePattern: '^_' }]
    }
  }
];

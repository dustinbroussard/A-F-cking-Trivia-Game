import { compile as compileTailwind } from 'tailwindcss';
import fs from 'fs/promises';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const PROJECT_ROOT = path.resolve(__dirname);
const TAILWIND_CONTENT_GLOBS = [
  'index.html',
  'src/App.tsx',
  'src/components/**/*.tsx',
  'src/hooks/**/*.ts',
  'src/**/*.ts',
  'src/**/*.tsx',
];

const TAILWIND_TOKEN_PATTERN = /[^<>"'`\s]*[^<>"'`\s:]/g;

async function listFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(rootDir, relativePath);
    }
    return [relativePath];
  }));

  return files.flat();
}

async function collectTailwindSourceFiles(rootDir: string) {
  const srcFiles = await listFiles(rootDir, 'src');
  return [
    'index.html',
    ...srcFiles.filter((file) => /\.(ts|tsx)$/.test(file)),
  ];
}

function extractTailwindCandidates(content: string) {
  return content.match(TAILWIND_TOKEN_PATTERN) ?? [];
}

async function loadTailwindStylesheet(id: string, base: string) {
  let resolvedPath: string;

  if (id.startsWith('.')) {
    resolvedPath = path.resolve(base, id);
  } else if (id === 'tailwindcss') {
    resolvedPath = path.resolve(PROJECT_ROOT, 'node_modules/tailwindcss/index.css');
  } else if (id.startsWith('tailwindcss/')) {
    resolvedPath = path.resolve(PROJECT_ROOT, `node_modules/${id}.css`);
  } else {
    resolvedPath = path.resolve(PROJECT_ROOT, 'node_modules', id);
  }

  const normalizedPath = path.extname(resolvedPath) ? resolvedPath : `${resolvedPath}.css`;
  const content = await fs.readFile(normalizedPath, 'utf8');

  return {
    path: normalizedPath,
    base: path.dirname(normalizedPath),
    content,
  };
}

function tailwindCssPlugin() {
  let cachedCss = '';
  let cachedSignature = '';

  return {
    name: 'local-tailwind-compiler',
    enforce: 'pre' as const,
    async transform(source: string, id: string) {
      if (!id.endsWith('/src/index.css') && !id.endsWith(path.normalize('src/index.css'))) {
        return null;
      }

      const sourceFiles = await collectTailwindSourceFiles(PROJECT_ROOT);
      const contents = await Promise.all(
        sourceFiles.map(async (file) => {
          const absolute = path.join(PROJECT_ROOT, file);
          this.addWatchFile(absolute);
          return fs.readFile(absolute, 'utf8');
        })
      );

      const candidates = Array.from(
        new Set(contents.flatMap((content) => extractTailwindCandidates(content)))
      ).sort();

      const signature = `${source}\n/* candidates:${candidates.join('|')} */`;
      if (signature === cachedSignature) {
        return cachedCss;
      }

      const compiler = await compileTailwind(source, {
        from: id,
        loadStylesheet: loadTailwindStylesheet,
      });
      cachedCss = compiler.build(candidates);
      cachedSignature = signature;
      return cachedCss;
    },
  };
}

function createContentSecurityPolicy(isDev: boolean) {
  const scriptSrc = ["'self'", 'https://apis.google.com'];
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://*.googleusercontent.com',
    'https://*.gstatic.com',
    'https://*.googleapis.com',
    'https://*.supabase.co',
    'https://jrrzrgldqyvtastxaqkz.supabase.co',
  ];
  const connectSrc = [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in',
    'wss://*.supabase.co',
    'wss://*.supabase.in',
    'https://*.googleapis.com',
    'https://*.googleusercontent.com',
    'https://www.googleapis.com',
  ];

  if (isDev) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    connectSrc.push('ws:', 'http:');
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src ${imgSrc.join(' ')}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' blob:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://accounts.google.com https://apis.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (!isDev) {
    csp.push('upgrade-insecure-requests');
  }

  return csp.join('; ');
}

function createSecurityHeaders(isDev: boolean) {
  const headers: Record<string, string> = {
    'Content-Security-Policy': createContentSecurityPolicy(isDev),
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  if (!isDev) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  return headers;
}

export default defineConfig(({ command }) => {
  const isDevServer = command === 'serve';
  const securityHeaders = createSecurityHeaders(isDevServer);
  const htmlInputs = {
    main: path.resolve(__dirname, 'index.html'),
  };

  return {
    envDir: '.',
    plugins: [react(), tailwindCssPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js'),
        'motion-dom': path.resolve(__dirname, 'node_modules/motion-dom/dist/cjs/index.js'),
        'motion-utils': path.resolve(__dirname, 'node_modules/motion-utils/dist/cjs/index.js'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      headers: securityHeaders,
    },
    preview: {
      headers: createSecurityHeaders(false),
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        input: htmlInputs,
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('motion') || id.includes('lucide-react') || id.includes('canvas-confetti')) {
              return 'ui-vendor';
            }
            if (id.includes('react')) return 'react-vendor';
          },
        },
      },
    },
  };
});

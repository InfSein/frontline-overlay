import { fileURLToPath, URL } from 'node:url'
import PackageJson from './package.json'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  base: `/${PackageJson.name}/`,
  plugins: [
    vue(),
    vueJsx(),
    svgLoader(),
    AutoImport({
      imports: [
        'vue', 'vue-router', 'pinia',
        {
          'naive-ui': [
            'useMessage',
          ]
        }
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/components'],
      deep: true,
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
      directoryAsNamespace: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@cactbot': fileURLToPath(new URL('./external/cactbot', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0",
  },
})

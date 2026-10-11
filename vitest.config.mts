import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.mts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
      css: true,
      setupFiles: ['src/test/setup.ts'],
      // Atlaskit ships ESM that imports its own CSS, so it has to go through Vite rather than Node.
      server: { deps: { inline: [/@atlaskit\//, /@compiled\//] } },
    },
  }),
)

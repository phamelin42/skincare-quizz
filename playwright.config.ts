import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    viewport: { width: 1200, height: 900 },
    // Pour utiliser un Chromium déjà installé : PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/vers/chrome
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'],
    },
  },
  // Le test s'exécute sur le build de production : `npm run build` d'abord.
  webServer: {
    command: 'npx http-server dist/skincare-quizz/browser -p 4300 -s',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
  },
});

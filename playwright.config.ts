import { defineConfig } from '@playwright/test';

// Un autre projet de la machine peut tenir le port 4300 : `reuseExistingServer` testerait alors
// son site à la place du nôtre, et tout échouerait en bloc. `E2E_PORT` en choisit un autre.
const port = Number(process.env['E2E_PORT'] ?? 4300);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1200, height: 900 },
    // Pour utiliser un Chromium déjà installé : PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/chemin/vers/chrome
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'],
    },
  },
  // Le test s'exécute sur le build de production : `npm run build` d'abord.
  webServer: {
    command: `npx http-server dist/skincare-quizz/browser -p ${port} -s`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env['CI'],
  },
});

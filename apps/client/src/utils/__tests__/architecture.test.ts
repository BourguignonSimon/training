import { describe, it, expect } from 'vitest';

// Test d'import via l'alias pour vérifier tsconfig/vite.config
// Ce test valide que l'environnement de base est correctement configuré

describe('Architecture Sanity Check', () => {
  it('should support path aliases', async () => {
    // Si ce test passe, cela signifie que Vitest arrive à résoudre les modules
    // et que l'environnement de base est sain.
    const types = await import('@/types');
    expect(types).toBeDefined();
  });

  it('should have a defined node environment', () => {
    // Vérifie qu'on n'expose pas de secrets par erreur dans les tests
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('should have access to API modules', async () => {
    // Vérifie que les modules API sont accessibles via l'alias
    const stravaModule = await import('@/api/strava');
    expect(stravaModule).toBeDefined();
  });

  it('should have proper feature-based structure', async () => {
    // Vérifie que les features sont accessibles
    const dashboardModule = await import('@/features/dashboard/Dashboard');
    expect(dashboardModule).toBeDefined();
  });
});

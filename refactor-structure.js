/**
 * refactor-structure.js
 * Script d'automatisation pour la migration vers l'architecture Feature-Based.
 * Exécuter avec : node refactor-structure.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const SRC_DIR = path.join(__dirname, 'src');

// 1. Définition de la nouvelle structure
const dirsToCreate = [
  'api',
  'assets',
  'components/ui', // Composants génériques (boutons, cards)
  'features/dashboard',
  'features/training',
  'features/nutrition',
  'features/settings',
  'hooks',
  'layouts',
  'lib', // Pour les configurations (axios, etc.)
  'types',
  'utils',
  'store',
  'test'
];

// 2. Mappage des fichiers existants vers la nouvelle destination
// Note: Les fichiers sont actuellement à la racine, pas dans src/
const moves = [
  // App principal
  { from: 'App.tsx', to: 'src/App.tsx', isRoot: true },
  { from: 'index.tsx', to: 'src/index.tsx', isRoot: true },

  // Services -> API
  { from: 'services/strava.ts', to: 'src/api/strava.ts', isRoot: true },
  { from: 'services/garmin.ts', to: 'src/api/garmin.ts', isRoot: true },
  { from: 'services/gemini.ts', to: 'src/api/gemini.ts', isRoot: true },

  // Tests des services -> Tests API
  { from: 'services/__tests__/strava.test.ts', to: 'src/api/__tests__/strava.test.ts', isRoot: true },
  { from: 'services/__tests__/garmin.test.ts', to: 'src/api/__tests__/garmin.test.ts', isRoot: true },
  { from: 'services/__tests__/gemini.test.ts', to: 'src/api/__tests__/gemini.test.ts', isRoot: true },

  // Composants Feature -> Features
  { from: 'components/Dashboard.tsx', to: 'src/features/dashboard/Dashboard.tsx', isRoot: true },
  { from: 'components/TrainingView.tsx', to: 'src/features/training/TrainingView.tsx', isRoot: true },
  { from: 'components/NutritionView.tsx', to: 'src/features/nutrition/NutritionView.tsx', isRoot: true },
  { from: 'components/SettingsView.tsx', to: 'src/features/settings/SettingsView.tsx', isRoot: true },

  // Tests des composants -> Tests Features
  { from: 'components/__tests__/Layout.test.tsx', to: 'src/layouts/__tests__/MainLayout.test.tsx', isRoot: true },

  // Layouts
  { from: 'components/Layout.tsx', to: 'src/layouts/MainLayout.tsx', isRoot: true },

  // Types globaux
  { from: 'types.ts', to: 'src/types/index.ts', isRoot: true },

  // Test setup
  { from: 'vitest.setup.ts', to: 'src/test/setup.ts', isRoot: true }
];

// Fonction utilitaire pour créer un dossier
const createDir = (dir) => {
  const targetPath = path.join(SRC_DIR, dir);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    console.log(`✅ Dossier créé : src/${dir}`);
  }
};

// Fonction utilitaire pour déplacer un fichier
const moveFile = (from, to, isRoot = false) => {
  const oldPath = isRoot ? path.join(ROOT_DIR, from) : path.join(SRC_DIR, from);
  const newPath = path.join(ROOT_DIR, to);

  if (fs.existsSync(oldPath)) {
    // S'assurer que le dossier de destination existe
    const destDir = path.dirname(newPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    fs.renameSync(oldPath, newPath);
    console.log(`📦 Déplacé : ${from} -> ${to}`);
  } else {
    console.warn(`⚠️ Fichier introuvable (déjà déplacé ?) : ${from}`);
  }
};

// Exécution
console.log("🚀 Démarrage du Refactoring de l'Architecture...\n");

// Créer le dossier src d'abord
if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR);
  console.log("✅ Dossier créé : src/\n");
}

console.log("📁 Création de la structure de dossiers...\n");
dirsToCreate.forEach(createDir);

console.log("\n📦 Déplacement des fichiers...\n");
moves.forEach(m => moveFile(m.from, m.to, m.isRoot));

// Suppression des anciens dossiers vides
console.log("\n🧹 Nettoyage des dossiers vides...\n");
const cleanupDirs = ['services', 'components'];
cleanupDirs.forEach(dir => {
  const fullPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    // Vérifier récursivement si le dossier est vide
    const isEmpty = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          if (!isEmpty(itemPath)) return false;
        } else {
          return false;
        }
      }
      return true;
    };

    if (isEmpty(fullPath)) {
      fs.rmSync(fullPath, { recursive: true });
      console.log(`🧹 Dossier supprimé : ${dir}`);
    } else {
      console.log(`⚠️ Dossier non vide (conservé) : ${dir}`);
    }
  }
});

console.log("\n✨ Migration terminée. Veuillez mettre à jour les imports.");
console.log("\n📝 Prochaines étapes :");
console.log("   1. Mettre à jour index.html pour pointer vers src/index.tsx");
console.log("   2. Mettre à jour les imports dans tous les fichiers");
console.log("   3. Lancer npm run build pour vérifier la compilation");

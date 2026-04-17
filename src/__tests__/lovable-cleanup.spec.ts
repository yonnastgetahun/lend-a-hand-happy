import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

describe('Lovable Dependency Removal', () => {
  const rootDir = process.cwd();

  describe('QA-1: Package removed', () => {
    it('lovable-tagger should not be in package.json', () => {
      const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
      expect(pkg.dependencies?.['lovable-tagger']).toBeUndefined();
      expect(pkg.devDependencies?.['lovable-tagger']).toBeUndefined();
    });

    it('lovable-tagger should not be installed', () => {
      const result = execSync('npm ls lovable-tagger 2>&1 || true', { encoding: 'utf-8' });
      expect(result).toContain('empty');
    });
  });

  describe('QA-2: vite.config.ts clean', () => {
    it('should not import lovable-tagger', () => {
      const viteConfig = readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).not.toContain('lovable-tagger');
      expect(viteConfig).not.toContain('componentTagger');
    });
  });

  describe('QA-3: index.html clean', () => {
    it('should not contain lovable.dev URLs', () => {
      const html = readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
      expect(html).not.toContain('lovable.dev');
    });
  });

  describe('QA-4: README appropriate', () => {
    it('should contain required sections', () => {
      const readme = readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
      expect(readme.toLowerCase()).toMatch(/install|setup/i);
      expect(readme.toLowerCase()).toMatch(/run|start|dev/i);
      expect(readme.toLowerCase()).toMatch(/tech|stack|built with/i);
      expect(readme).not.toContain('REPLACE_WITH_PROJECT_ID');
      expect(readme).not.toContain('Lovable Project');
    });
  });
});

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const ignoredDirs = new Set([
  '.git',
  '.continue',
  '.edge-cdp-profile',
  'node_modules',
  'dist',
  'build',
  '__pycache__',
  '.pytest_cache',
]);

const ignoredExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.pyc',
  '.log',
  '.lock',
  '.html',
  '.map',
]);

const textFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      walk(fullPath);
      continue;
    }

    if (ignoredExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    textFiles.push(relativePath);
  }
}

function findLines(filePath, testFn) {
  const content = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  const lines = content.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    if (testFn(line, filePath)) {
      matches.push({
        file: filePath,
        line: index + 1,
        text: line.trim(),
      });
    }
  });

  return matches;
}

walk(rootDir);

const findings = [];

const forbiddenPatterns = [
  {
    id: 'hardcoded-default-credential',
    description: 'Credentials or placeholder secrets that must be removed from tracked files',
    test: (line, filePath) =>
      filePath !== path.normalize('scripts/check_repo_safety.mjs') &&
      /(admin123|password123|change-me-in-production)/i.test(line),
  },
];

for (const filePath of textFiles) {
  for (const pattern of forbiddenPatterns) {
    findings.push(
      ...findLines(filePath, (line, currentFile) => pattern.test(line, currentFile)).map(
        (match) => ({
          ...match,
          type: pattern.id,
          description: pattern.description,
        }),
      ),
    );
  }
}

const createAllAllowedFiles = new Set([
  path.normalize('apps/api/tests'),
]);

for (const filePath of textFiles) {
  if (!filePath.startsWith(path.normalize('apps/api/app'))) {
    continue;
  }

  findings.push(
    ...findLines(
      filePath,
      (line, currentFile) =>
        currentFile !== path.normalize('scripts/check_repo_safety.mjs') &&
        line.includes('create_all'),
    ).map((match) => ({
      ...match,
      type: 'runtime-create-all',
      description: 'create_all is forbidden in runtime application code',
    })),
  );
}

const mockApiForbiddenRoots = [
  'App.tsx',
  'pages',
  'components',
  'context',
];

for (const filePath of textFiles) {
  const isForbiddenScope = mockApiForbiddenRoots.some(
    (prefix) => filePath === prefix || filePath.startsWith(`${prefix}${path.sep}`),
  );

  if (!isForbiddenScope) {
    continue;
  }

  findings.push(
    ...findLines(filePath, (line) => /mockApi|services\/api|services\\api/.test(line)).map(
      (match) => ({
        ...match,
        type: 'mock-api-in-main-flow',
        description: 'mockApi references are forbidden in the main frontend flow',
      }),
    ),
  );
}

if (findings.length === 0) {
  console.log('PASS check:repo-safety');
  process.exit(0);
}

console.error('FAIL check:repo-safety');
for (const finding of findings) {
  console.error(
    `- [${finding.type}] ${finding.file}:${finding.line} ${finding.description}\n  ${finding.text}`,
  );
}
process.exit(1);

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const PROJECT_ROOT = process.cwd();
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'src');
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  parser.parse(source, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'importMeta', 'topLevelAwait']
  });
}

const files = collectFiles(SOURCE_ROOT).sort();
const failures = [];

for (const file of files) {
  try {
    parseFile(file);
  } catch (error) {
    const location = error.loc ? `${error.loc.line}:${error.loc.column}` : 'unknown';
    failures.push(`${path.relative(PROJECT_ROOT, file)}:${location} ${error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Parsed ${files.length} frontend files.`);

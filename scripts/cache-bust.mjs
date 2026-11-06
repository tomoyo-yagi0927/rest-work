import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('.');
const output = resolve('_site');
const hashLength = 12;
const cacheableExtensions = new Set(['.avif', '.css', '.gif', '.jpeg', '.jpg', '.js', '.png', '.svg', '.webp']);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.github' || entry.name === '_site' || entry.name === 'node_modules' || entry.name === 'scripts') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

const sourceFiles = await listFiles(root);
const assetHashes = new Map();

for (const file of sourceFiles) {
  if (!cacheableExtensions.has(extname(file).toLowerCase())) continue;
  const digest = createHash('sha256').update(await readFile(file)).digest('hex').slice(0, hashLength);
  assetHashes.set(relative(root, file).split(sep).join('/'), digest);
}

function addVersion(value, fromFile) {
  const match = value.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return value;
  const candidate = match[1];
  if (/^(?:[a-z]+:)?\/\//i.test(candidate) || candidate.startsWith('/') || candidate.startsWith('#')) return value;
  const assetPath = relative(root, resolve(join(fromFile, candidate))).split(sep).join('/');
  const hash = assetHashes.get(assetPath);
  if (!hash) return value;
  const suffix = match[2] ? match[2].replace(/^\?[^#]*/, '').replace(/^#/, '#') : '';
  return `${candidate}?v=${hash}${suffix}`;
}

function rewriteHtml(source, file) {
  const directory = relative(root, join(root, file, '..'));
  const noCacheMeta = '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n    <meta http-equiv="Pragma" content="no-cache">\n    <meta http-equiv="Expires" content="0">';
  let result = source.replace(/(<meta\s+charset=[^>]+>)/i, `$1\n    ${noCacheMeta}`);
  result = result.replace(/(\b(?:src|href)\s*=\s*["'])([^"']+)(["'])/gi, (_, prefix, value, suffix) => `${prefix}${addVersion(value, directory)}${suffix}`);
  return result;
}

function rewriteCss(source, file) {
  const directory = relative(root, join(root, file, '..'));
  return source.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_, quote, value) => `url(${quote}${addVersion(value, directory)}${quote})`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of sourceFiles) {
  const destination = join(output, relative(root, file));
  await mkdir(resolve(destination, '..'), { recursive: true });
  const extension = extname(file).toLowerCase();
  if (extension === '.html') {
    await writeFile(destination, rewriteHtml(await readFile(file, 'utf8'), relative(root, file)), 'utf8');
  } else if (extension === '.css') {
    await writeFile(destination, rewriteCss(await readFile(file, 'utf8'), relative(root, file)), 'utf8');
  } else {
    await cp(file, destination);
  }
}

console.log(`Generated ${sourceFiles.length} files in _site with content-hashed static asset URLs.`);

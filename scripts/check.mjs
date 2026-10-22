import { readFile } from 'node:fs/promises';

const required = ['index.html', 'src/main.js', 'src/style.css', 'README.md', 'DEMO_SCRIPT.md'];
for (const file of required) await readFile(file, 'utf8');

const html = await readFile('index.html', 'utf8');
for (const id of ['workspace', 'architecture', 'audit', 'quorum-modal']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required UI section: ${id}`);
}
console.log(`Submission check passed: ${required.length} core files present and prototype sections found.`);

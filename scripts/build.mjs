// Inline src/ into a single self-contained page.
//   node scripts/build.mjs                 -> index.html (full document)
//   node scripts/build.mjs --fragment out  -> page body without <html>/<head>/<body>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, 'src', f), 'utf8');

const title = 'SANDTAX';
const description = 'A falling-sand world whose physics is written in word tiles. Rewrite the laws while it runs.';
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;600&family=Silkscreen:wght@400;700&display=swap">';
// "</script" inside a script would end the tag early.
const script = (f) => '<script>\n' + read(f).replace(/<\/script/gi, '<\\/script') + '\n</script>';

const inner = [
  '<title>' + title + '</title>',
  fonts,
  '<style>\n' + read('style.css') + '\n</style>',
  read('body.html'),
  script('engine.js'),
  script('levels.js'),
  script('app.js'),
].join('\n');

const args = process.argv.slice(2);
const fi = args.indexOf('--fragment');
if (fi >= 0) {
  writeFileSync(args[fi + 1], inner + '\n');
  console.log('wrote fragment ' + args[fi + 1]);
} else {
  const doc = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<meta name="description" content="' + description + '">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '</head>',
    '<body>',
    inner,
    '</body>',
    '</html>',
  ].join('\n');
  writeFileSync(join(root, 'index.html'), doc + '\n');
  console.log('wrote index.html (' + Math.round(doc.length / 1024) + ' KB)');
}

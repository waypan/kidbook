import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const bookDataDir = join(process.cwd(), 'public', 'book-data');
const publicDir = join(process.cwd(), 'public');
const placeholderText = 'Placeholder MP3 file';
let issueCount = 0;

function walkJsonFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return walkJsonFiles(path);
    }

    return name.endsWith('.json') ? [path] : [];
  });
}

for (const jsonPath of walkJsonFiles(bookDataDir)) {
  const page = JSON.parse(readFileSync(jsonPath, 'utf8'));

  for (const object of page.objects ?? []) {
    if (!object.audio) {
      continue;
    }

    const audioPath = join(publicDir, object.audio);
    if (!existsSync(audioPath)) {
      issueCount += 1;
      console.log(`Missing: ${object.audio} (${jsonPath}, ${object.id})`);
      continue;
    }

    const firstBytes = readFileSync(audioPath, 'utf8').slice(0, placeholderText.length);
    if (firstBytes === placeholderText) {
      issueCount += 1;
      console.log(`Placeholder: ${object.audio} (${jsonPath}, ${object.id})`);
    }
  }
}

if (issueCount > 0) {
  console.log(`\nFound ${issueCount} audio asset issue(s).`);
  process.exitCode = 1;
} else {
  console.log('All referenced audio assets exist and are not placeholders.');
}

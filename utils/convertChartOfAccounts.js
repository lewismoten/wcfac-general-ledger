import { readFile, writeFile, readdir } from 'fs/promises';
import { extname, join, basename } from 'path';

async function convertFiles(folder) {
  try {
    const files = await readdir(folder);
    const txtFiles = files.filter(f => extname(f).toLowerCase() === '.txt');
    for (const file of txtFiles) {
      const txtPath = join(folder, file);
      const jsonPath = join(folder, basename(file, '.txt') + '.json');
      await convertFile(txtPath, jsonPath);
    }
    console.log('done');
  } catch (err) {
    console.error('Error reading folder', err.message);
  }

}
async function convertFile(txtFile, jsonFile) {
  try {
    const text = await readFile(txtFile, 'utf8');
    const lines = text.trim().split('\n');
    const hashtable = {};

    lines.forEach(line => {
      const [num, ...descParts] = line.trim().split(' ');
      const description = descParts.join(' ');
      hashtable[num] = description;
    });

    await writeFile(jsonFile, JSON.stringify(hashtable, null, 2), 'utf8');
    console.log(`Created ${jsonFile} with ${Object.keys(hashtable).length} entries`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

convertFiles("./data/chartOfAccounts");

import { readFile, writeFile } from 'fs/promises';

const txtFile = "./data/majors.txt";
const jsonFile = "./data/majors.json";

async function convertMajors() {
  try {
    const text = await readFile(txtFile, 'utf8');
    const lines = text.trim().split('\n');
    const majors = {};

    const [, ...rows] = lines;

    rows.forEach(line => {
      const [num, ...descParts] = line.trim().split(' ');
      const description = descParts.join(' ');
      majors[num] = description;
    });

    await writeFile(jsonFile, JSON.stringify(majors, null, 2), 'utf8');
    console.log(`Created ${jsonFile} with ${Object.keys(majors).length} entries`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

convertMajors();

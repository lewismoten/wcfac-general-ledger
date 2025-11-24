import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ftp from "basic-ftp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, "..", "dist");

async function uploadDirectory(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.clearWorkingDir();
  await client.uploadFromDir(localDir);
}

(async () => {
  const json = await readFile('config.json', 'utf8');
  const config = JSON.parse(json);
  const {
    host,
    user,
    password,
    port,
    remoteDir,
    secure
  } = config.ftp;

  if (!host || !user || !password || !remoteDir) {
    console.error("Missing config.json {ftp:{host, user, password, remoteDir, secure}} values.");
    process.exit(1);
  }

  const client = new ftp.Client();

  try {
    await client.access({
      host: host,
      port: port ? Number(port) : 21,
      user: user,
      password: password,
      secure: secure,
    });

    if (!existsSync(DIST_DIR)) {
      console.error(`Build directory "${DIST_DIR}" not found.`);
      process.exit(1);
    }

    await uploadDirectory(client, DIST_DIR, remoteDir);
    console.log("✅ FTP upload complete!");
  } catch (err) {
    console.error("❌ FTP upload failed:", err);
    process.exit(1);
  } finally {
    client.close();
  }
})();
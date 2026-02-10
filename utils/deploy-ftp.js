import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ftp from "basic-ftp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");
const HOST_DIR = join(ROOT_DIR, "host");
const API_DIR = join(HOST_DIR, "api");
const SQL_DIR = join(HOST_DIR, "sql");
const CONFIG_FILE = join(HOST_DIR, "config.php");
const HTACCESS = join(HOST_DIR, ".htaccess");

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
    console.log('uploading front-end');
    await client.ensureDir(remoteDir);
    await client.cd(remoteDir);
    await client.uploadFromDir(DIST_DIR);

    console.log('uploading htaccess');
    await client.cd(remoteDir);
    await client.uploadFrom(HTACCESS, '.htaccess');

    console.log('uploading back-end api');
    const remoteApiDir = `${remoteDir}/api`;
    await client.ensureDir(remoteApiDir);
    await client.cd(remoteApiDir);
    await client.uploadFromDir(API_DIR);

    console.log('uploading back-end sql');
    const remoteSqlDir = `${remoteDir}/sql`;
    await client.ensureDir(remoteSqlDir);
    await client.cd(remoteSqlDir);
    await client.uploadFromDir(SQL_DIR);

    if (existsSync(CONFIG_FILE)) {
      console.log('uploading back-end configuration');
      await client.cd(remoteApiDir);
      await client.uploadFrom(CONFIG_FILE, `config.php`);
    }

    console.log("✅ FTP upload complete!");
  } catch (err) {
    console.error("❌ FTP upload failed:", err);
    process.exit(1);
  } finally {
    client.close();
  }
})();
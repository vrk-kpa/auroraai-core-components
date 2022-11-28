import pgPromise from 'pg-promise';
import { readdirSync } from 'fs';
import { join } from 'path';

const pgp = pgPromise();

const db = pgp({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

(async () => {
  // eslint-disable-next-line no-constant-condition
  if (!process.env.MIGRATION_DIR)
    throw new Error('No migration directory specified');
  while (true) {
    try {
      const connection = await db.connect();
      connection.done();
      break;
    } catch (_) {
      await sleep(1000);
    }
  }

  const latestFlywayVersion = readdirSync(
    join(__dirname, `../${process.env.MIGRATION_DIR}`)
  )
    .map(fileName => parseInt(fileName.split('_')[0].replace(/^V/, ''), 10))
    .sort((a, b) => b - a)[0];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await db.task(t =>
        t.oneOrNone<{ maxVersion: string }>(`
            SELECT MAX(TO_NUMBER(version, '9999')) AS "maxVersion"
            FROM flyway_schema_history
        `)
      );

      if (result) {
        const version = parseInt(result.maxVersion, 10);
        console.log(`Migrated: ${version}/${latestFlywayVersion}`);
        if (version === latestFlywayVersion) {
          console.log('Done.');
          break;
        }
      }

      await sleep(1000);
    } catch (_) {
      await sleep(1000);
    }
  }

  pgp.end();
})();

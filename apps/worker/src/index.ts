import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../web/.env') });

import { startCronJobs } from '@colosseum/trpc';

async function main() {
  console.log('🏟️  Colosseum Worker starting...');
  await startCronJobs();
  console.log('✅ Cron jobs registered. Worker is running.');
  console.log('   - close-expired-matchups: every 60s');
  console.log('   - refresh-trending: every 5 min');
}

main().catch((err) => {
  console.error('❌ Worker failed to start:', err);
  process.exit(1);
});

// Global test setup
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, 'apps/web/.env') });

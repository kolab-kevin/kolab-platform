import { createAuthClient } from '@kolab/sdk';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authClient = createAuthClient(apiUrl);

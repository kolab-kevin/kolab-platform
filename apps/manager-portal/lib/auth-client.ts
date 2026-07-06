import { createAuthClient } from '@kolab/sdk';

import { getApiBaseUrl } from '@/lib/env';

export const authClient = createAuthClient(getApiBaseUrl());

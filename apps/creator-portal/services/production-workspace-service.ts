import type {
  ProductionWorkspaceContext,
  ProductionWorkspaceData,
} from '@/types/production-adapters';

import { createMockProductionWorkspace } from './production-mock';

export type { ProductionWorkspaceContext };

export type ProductionWorkspaceDataSource = 'mock';

export type ProductionWorkspaceFetchResult = {
  data: ProductionWorkspaceData;
  source: ProductionWorkspaceDataSource;
};

export type ProductionWorkspaceProvider = {
  loadWorkspace: (context: ProductionWorkspaceContext) => Promise<ProductionWorkspaceData>;
};

const mockProductionWorkspaceProvider: ProductionWorkspaceProvider = {
  loadWorkspace: async (context) => createMockProductionWorkspace(context),
};

let productionWorkspaceProvider: ProductionWorkspaceProvider = mockProductionWorkspaceProvider;

export function setProductionWorkspaceProvider(provider: ProductionWorkspaceProvider): void {
  productionWorkspaceProvider = provider;
}

export function getProductionWorkspaceProvider(): ProductionWorkspaceProvider {
  return productionWorkspaceProvider;
}

export async function fetchProductionWorkspace(
  context: ProductionWorkspaceContext,
): Promise<ProductionWorkspaceFetchResult> {
  const data = await productionWorkspaceProvider.loadWorkspace(context);

  return {
    data,
    source: 'mock',
  };
}

export { createMockProductionWorkspace };

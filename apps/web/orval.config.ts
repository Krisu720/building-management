import { defineConfig } from 'orval';

export default defineConfig({
  buildingManagement: {
    input: {
      target: '../server/openapi.json',
      filters: {
        operationIds: [
          'Buildings_findAll',
          'Apartments_findAll',
          'Issues_create',
          'Issues_findAll',
          'Issues_findMine',
        ],
      },
    },
    output: {
      target: './src/lib/api/generated.ts',
      schemas: './src/lib/api/models',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
          forceSuccessResponse: true,
        },
        mutator: { path: './src/lib/api/fetch.ts', name: 'apiFetch' },
        query: { version: 5 },
      },
    },
  },
});

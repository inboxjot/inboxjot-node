import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const EXTRA_SCHEMAS = ['WebhookPayload'];

const source = process.argv[2] ?? '../inboxingat/packages/client/openapi.json';
const spec = JSON.parse(readFileSync(source, 'utf8'));

const isPublic = (operation) =>
  operation.security?.some((rule) => 'api_key' in rule);
const paths = {};
for (const [path, item] of Object.entries(spec.paths)) {
  const operations = Object.entries(item).filter(([, operation]) =>
    isPublic(operation)
  );
  if (operations.length > 0) {
    paths[path] = Object.fromEntries(operations);
  }
}

const kept = new Set();
const visit = (node) => {
  if (Array.isArray(node)) {
    return node.forEach(visit);
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  const ref = node.$ref?.replace('#/components/schemas/', '');
  if (ref && !kept.has(ref)) {
    kept.add(ref);
    visit(spec.components.schemas[ref]);
  }
  Object.values(node).forEach(visit);
};
visit(paths);
EXTRA_SCHEMAS.forEach((name) =>
  visit({ $ref: `#/components/schemas/${name}` })
);

const schemas = Object.fromEntries(
  [...kept]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((name) => [name, spec.components.schemas[name]])
);
const filtered = {
  ...spec,
  paths,
  components: {
    schemas,
    headers: spec.components.headers,
    securitySchemes: spec.components.securitySchemes,
  },
};
writeFileSync('openapi.json', `${JSON.stringify(filtered, null, 2)}\n`);

execFileSync(
  'node_modules/.bin/spectype',
  ['openapi.json', '--output', 'src/schema.ts', '--empty-objects-unknown'],
  { stdio: 'inherit' }
);

![Inboxjot](https://inboxjot.com/og.png)

<p align="center">The official Node.js SDK for the Inboxjot email API. <br />Email for builders and their agents.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/inboxjot"><img src="https://inboxjot.com/badges/npm.svg?v=2" alt="npm" height="24" /></a>
  <a href="./LICENSE"><img src="https://inboxjot.com/badges/license.svg?v=2" alt="License" height="24" /></a>
  <a href="https://inboxjot.com/docs"><img src="https://inboxjot.com/badges/docs.svg?v=2" alt="Docs" height="24" /></a>
</p>

Send email, manage contacts, campaigns, templates and domains, and verify webhooks from your Node.js app. The SDK has no runtime dependencies. It uses the global `fetch` and Web Crypto, so it runs on Node 18+, Bun, Deno and Cloudflare Workers.

### Quick Start

```sh
npm install inboxjot
```

```ts
import { Inboxjot } from 'inboxjot';

const inboxjot = new Inboxjot({ apiKey: 'ibx_...' });

const { id } = await inboxjot.emails.send({
  from: 'Acme <hi@acme.dev>',
  to: 'jane@example.com',
  subject: 'Welcome',
  html: '<p>Hi Jane</p>',
});
```

Every option is optional. Without `apiKey`, the client reads `INBOXJOT_API_KEY` from the environment, so `new Inboxjot()` works. The other options are `baseUrl`, `timeout` (ms), `maxRetries` and a custom `fetch`.

### Resources

```ts
await inboxjot.emails.batch([{ from, to: 'a@example.com', subject, html }]);
await inboxjot.emails.list({ source: 'api', per_page: 50 });

const contact = await inboxjot.contacts.create({
  email: 'jane@example.com',
  first_name: 'Jane',
});
await inboxjot.contacts.update('jane@example.com', { last_name: 'Doe' });
await inboxjot.contacts.erase({ email: 'jane@example.com' });
await inboxjot.events.send({
  name: 'signed_up',
  email: 'jane@example.com',
  data: { plan: 'pro' },
});

const campaign = await inboxjot.campaigns.create({
  name: 'October',
  subject: 'News',
  from,
  html,
});
await inboxjot.campaigns.send(campaign.id, {
  scheduled_at: '2026-10-20T09:00:00Z',
});

const template = await inboxjot.templates.create({ name: 'Welcome', html });
await inboxjot.templates.publish(template.id);
await inboxjot.templates.delete(template.id);
```

Path ids come first, then the body or query, then the request options. `contacts.get`, `update` and `delete` take a contact id or the contact's email.

An image that is already online goes straight into the content as `<img src="https://…">`. To host a PNG, JPEG or GIF of up to 5 MB on Inboxjot, upload it:

```ts
const image = await inboxjot.images.upload({
  file: await readFile('logo.png'),
  file_name: 'logo.png',
});
```

The client covers the whole public API: `emails`, `contacts`, `events`, `campaigns`, `templates`, `domains`, `images`, `segments`, `topics` and `webhooks`. The [API reference](https://inboxjot.com/docs) lists every endpoint and field.

### Pagination

Lists page with a cursor. Pass `next_cursor` back as `after`. It is `null` on the last page. The client leaves a `null` cursor out of the request.

```ts
let after: string | null = null;
do {
  const page = await inboxjot.contacts.list({ per_page: 100, after });
  console.log(page.data.length, page.total);
  after = page.next_cursor;
} while (after);
```

### Idempotency and Retries

Every method takes request options as its last argument: `idempotencyKey`, `timeout`, `maxRetries` and `signal`.

```ts
await inboxjot.emails.send(email, { idempotencyKey: `welcome-${user.id}` });
```

The client retries with exponential backoff and honors `Retry-After`. A `429` always retries. A `5xx`, a timeout or a network error retries only for a `GET`, a `DELETE` or a request with an `idempotencyKey`, so an email is never sent twice. A `Retry-After` over 60 seconds, such as the daily sending limit, goes straight to the caller.

### Errors

A failed request throws. An API error is an `InboxjotError` with a typed `name`, plus `status`, `message`, `errors` and `requestId`. A network error or timeout is an `InboxjotConnectionError`.

```ts
import { InboxjotError } from 'inboxjot';

try {
  await inboxjot.emails.get('em_...');
} catch (error) {
  if (error instanceof InboxjotError && error.name === 'not_found') {
    // ...
  }
}
```

### Verify Webhooks

Inboxjot signs webhooks with the [Standard Webhooks](https://www.standardwebhooks.com) spec. Verify the raw body before you parse it:

```ts
import { verifyWebhook } from 'inboxjot';

export async function POST(request: Request) {
  const event = await verifyWebhook({
    payload: await request.text(),
    headers: request.headers,
    secret: process.env.INBOXJOT_WEBHOOK_SECRET!,
  });
  if (event.type === 'email.bounced') {
    console.log(event.data.email_id, event.data.bounce.type);
  }
  return new Response(null, { status: 204 });
}
```

`inboxjot.webhooks.verify` takes the same object. A bad signature, a missing header or a timestamp more than 5 minutes off throws a `WebhookVerificationError`.

### Contributing

The types in `src/schema.ts` are generated from the public part of the Inboxjot OpenAPI spec with `pnpm generate`. Run `pnpm check`, `pnpm test` and `pnpm build` before you open a pull request.

### License

[MIT](./LICENSE) &copy; [Arik Chakma](https://x.com/imarikchakma)

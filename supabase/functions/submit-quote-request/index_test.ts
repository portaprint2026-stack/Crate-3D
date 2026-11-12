import { createSubmitQuoteRequestHandler } from "./index.ts";
import type {
  Backend,
  CreateRequestInput,
  CreateResult,
  ExistingRequest,
  HandlerDependencies,
  User,
} from "./index.ts";

const requestBody = {
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: null,
  category: "home",
  description: "Organizador para la sala",
};

const existingRequest: ExistingRequest = {
  request_code: "PP-S-0123456789ABCDEF0123",
  customer_id: null,
  contact_name: requestBody.name,
  contact_email: requestBody.email,
  contact_phone: null,
  category: requestBody.category,
  description: requestBody.description,
  status: "in_review",
};

type TestOptions = {
  existing?: ExistingRequest | null;
  user?: User | null;
  customer?: { id: string; email: string } | null;
  createResult?: CreateResult;
  turnstileResult?: "valid" | "invalid" | "unavailable";
  turnstileResults?: Array<"valid" | "invalid" | "unavailable">;
};

function createTestSetup(options: TestOptions = {}) {
  const storedRequests = new Map<string, ExistingRequest>();
  const emailCounts = new Map<string, number>();
  let verifyCalls = 0;
  let createCalls = 0;
  let rateCount = 0;
  const createInputs: CreateRequestInput[] = [];
  const userLookupIds: string[] = [];
  const customerLookupIds: string[] = [];
  let creationTail = Promise.resolve();

  const backend: Backend = {
    getUser(token) {
      userLookupIds.push(token);
      return Promise.resolve({ user: options.user ?? null, failed: false });
    },
    getCustomer(userId) {
      customerLookupIds.push(userId);
      return Promise.resolve({
        customer: options.customer ?? null,
        failed: false,
      });
    },
    findRequest(idempotencyKeyHash) {
      return Promise.resolve({
        request: storedRequests.get(idempotencyKeyHash) ??
          options.existing ?? null,
        failed: false,
      });
    },
    async createRequest(input: CreateRequestInput) {
      createCalls += 1;
      createInputs.push(input);
      const previous = creationTail;
      let releaseCreation: () => void = () => {};
      const currentTurn = new Promise<void>((resolve) => {
        releaseCreation = resolve;
      });
      creationTail = previous.then(() => currentTurn);
      await previous;

      try {
        const existing = storedRequests.get(input.idempotencyKeyHash);
        if (existing) {
          const matches = existing.customer_id === input.customerId &&
            existing.contact_name === input.submission.name &&
            existing.contact_email === input.submission.email &&
            existing.contact_phone === input.submission.phone &&
            existing.category === input.submission.category &&
            existing.description === input.submission.description;

          return {
            result: matches
              ? {
                outcome: "duplicate",
                request_code: existing.request_code,
                status: existing.status,
              }
              : { outcome: "conflict", request_code: null, status: null },
            failed: false,
          };
        }

        rateCount += 1;
        const emailCount = (emailCounts.get(input.emailHash) ?? 0) + 1;
        emailCounts.set(input.emailHash, emailCount);
        if (options.createResult?.outcome === "rate_limited" || emailCount > 3) {
          return {
            result: options.createResult?.outcome === "rate_limited"
              ? options.createResult
              : { outcome: "rate_limited", request_code: null, status: null },
            failed: false,
          };
        }

        const created: ExistingRequest = {
          ...existingRequest,
          request_code: input.requestCode,
          customer_id: input.customerId,
          contact_name: input.submission.name,
          contact_email: input.submission.email,
          contact_phone: input.submission.phone,
          category: input.submission.category,
          description: input.submission.description,
        };
        storedRequests.set(input.idempotencyKeyHash, created);
        return {
          result: {
            outcome: "created",
            request_code: created.request_code,
            status: "received",
          },
          failed: false,
        };
      } finally {
        releaseCreation();
      }
    },
  };

  const dependencies: HandlerDependencies = {
    getEnv(name) {
      const values: Record<string, string> = {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_ANON_KEY: "public-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "backend-secret",
        TURNSTILE_SECRET_KEY: "turnstile-secret",
        RATE_LIMIT_HMAC_SECRET: "x".repeat(32),
      };
      return values[name];
    },
    createBackend() {
      return backend;
    },
    verifyTurnstile() {
      const currentCall = verifyCalls;
      verifyCalls += 1;
      return Promise.resolve(
        options.turnstileResults?.[currentCall] ??
          options.turnstileResult ?? "valid",
      );
    },
    async delay(milliseconds) {
      await new Promise((resolve) => setTimeout(resolve, milliseconds));
    },
  };

  return {
    handler: createSubmitQuoteRequestHandler(dependencies),
    calls: () => ({
      verifyCalls,
      createCalls,
      rateCount,
      createInputs,
      userLookupIds,
      customerLookupIds,
    }),
  };
}

function makeRequest(
  body: Record<string, unknown> = requestBody,
  authorization?: string,
): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorization) headers.set("authorization", authorization);
  return new Request("https://functions.example/submit-quote-request", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

Deno.test("returns saved request on retry without reusing Turnstile or limits", async () => {
  const { handler, calls } = createTestSetup({ existing: existingRequest });
  const response = await handler(
    makeRequest({ ...requestBody, turnstileToken: "already-consumed" }),
  );
  const body = await response.json();

  if (
    response.status !== 200 ||
    body.requestCode !== existingRequest.request_code ||
    body.status !== "in_review"
  ) {
    throw new Error("Retry did not return the saved request and status.");
  }
  if (calls().verifyCalls !== 0 || calls().createCalls !== 0) {
    throw new Error("An existing request consumed Turnstile or rate limits.");
  }
});

Deno.test("successful idempotent retry does not increase the email counter", async () => {
  const { handler, calls } = createTestSetup();
  const body = { ...requestBody, turnstileToken: "fresh-token" };
  const first = await handler(makeRequest(body));
  const firstResult = await first.json();
  const countAfterCreation = calls().rateCount;
  const retry = await handler(makeRequest(body));
  const retryResult = await retry.json();

  if (
    first.status !== 201 ||
    retry.status !== 200 ||
    firstResult.requestCode !== retryResult.requestCode ||
    calls().rateCount !== countAfterCreation ||
    calls().verifyCalls !== 1
  ) {
    throw new Error("An idempotent retry consumed the email rate limit.");
  }
});

Deno.test("request succeeds without any IP forwarding headers", async () => {
  const { handler, calls } = createTestSetup();
  const response = await handler(
    makeRequest({ ...requestBody, turnstileToken: "fresh-token" }),
  );

  if (response.status !== 201 || calls().verifyCalls !== 1) {
    throw new Error("Request depended on an IP forwarding header.");
  }
});

Deno.test("simultaneous submissions with the same idempotency key create one request", async () => {
  const { handler, calls } = createTestSetup();
  const submit = () =>
    handler(makeRequest({ ...requestBody, turnstileToken: "fresh-token" }));
  const [first, second] = await Promise.all([submit(), submit()]);
  const [firstBody, secondBody] = await Promise.all([
    first.json(),
    second.json(),
  ]);

  if (
    ![201, 200].includes(first.status) ||
    ![201, 200].includes(second.status) ||
    first.status === second.status
  ) {
    throw new Error("Concurrent idempotent submissions did not converge.");
  }
  if (firstBody.requestCode !== secondBody.requestCode) {
    throw new Error("Concurrent submissions returned different references.");
  }
  if (calls().rateCount !== 1) {
    throw new Error("A simultaneous duplicate consumed limits more than once.");
  }
});

Deno.test("simultaneous repeated Turnstile token returns the stored request", async () => {
  const { handler, calls } = createTestSetup({
    turnstileResults: ["valid", "invalid"],
  });
  const submit = () =>
    handler(makeRequest({ ...requestBody, turnstileToken: "same-token" }));
  const [first, second] = await Promise.all([submit(), submit()]);
  const [firstBody, secondBody] = await Promise.all([
    first.json(),
    second.json(),
  ]);

  if (
    first.status !== 201 ||
    second.status !== 200 ||
    firstBody.requestCode !== secondBody.requestCode
  ) {
    throw new Error(
      "Repeated concurrent Turnstile token did not recover the created request.",
    );
  }
  if (calls().rateCount !== 1) {
    throw new Error(
      "Repeated concurrent token consumed limits more than once.",
    );
  }
});

Deno.test("repeated consumed Turnstile token can retrieve an existing request", async () => {
  const { handler, calls } = createTestSetup({
    existing: existingRequest,
    turnstileResult: "invalid",
  });
  const response = await handler(
    makeRequest({ ...requestBody, turnstileToken: "consumed-token" }),
  );
  const body = await response.json();

  if (
    response.status !== 200 || body.requestCode !== existingRequest.request_code
  ) {
    throw new Error(
      "Retry with a consumed Turnstile token did not return its saved request.",
    );
  }
  if (calls().verifyCalls !== 0) {
    throw new Error("Turnstile was called for an already stored request.");
  }
});

Deno.test("authenticated user without a customer profile is rejected", async () => {
  const { handler, calls } = createTestSetup({
    user: {
      id: "user-1",
      email: requestBody.email,
      email_confirmed_at: "2026-01-01T00:00:00Z",
    },
  });
  const response = await handler(
    makeRequest(
      { ...requestBody, turnstileToken: "fresh-token" },
      "Bearer test-access-token",
    ),
  );

  if (
    response.status !== 403 || calls().verifyCalls !== 0 ||
    calls().createCalls !== 0
  ) {
    throw new Error(
      "Authenticated user without a customer profile was not rejected early.",
    );
  }
});

Deno.test("authenticated user with a verified email and matching customer profile can submit a request", async () => {
  const accessToken = "verified-session-token";
  const userId = "user-1";
  const customerId = "customer-1";
  const { handler, calls } = createTestSetup({
    user: {
      id: userId,
      email: requestBody.email,
      email_confirmed_at: "2026-01-01T00:00:00Z",
    },
    customer: { id: customerId, email: requestBody.email },
  });
  const response = await handler(
    makeRequest(
      { ...requestBody, turnstileToken: "fresh-token" },
      `Bearer ${accessToken}`,
    ),
  );
  const body = await response.json();
  const [createInput] = calls().createInputs;

  if (
    response.status !== 201 ||
    typeof body.requestCode !== "string" ||
    !/^PP-S-[A-F0-9]{20}$/.test(body.requestCode) ||
    body.status !== "received"
  ) {
    throw new Error(
      "A verified authenticated customer did not receive a successful request response.",
    );
  }
  if (
    calls().userLookupIds.join(",") !== accessToken ||
    calls().customerLookupIds.join(",") !== userId ||
    calls().verifyCalls !== 1 ||
    calls().createCalls !== 1 ||
    calls().rateCount !== 1
  ) {
    throw new Error(
      "The authenticated request did not pass through session, customer, Turnstile, and creation checks.",
    );
  }
  if (
    !createInput ||
    createInput.customerId !== customerId ||
    createInput.submission.email !== requestBody.email ||
    createInput.submission.name !== requestBody.name ||
    createInput.submission.category !== requestBody.category ||
    createInput.submission.description !== requestBody.description ||
    !/^[a-f0-9]{64}$/.test(createInput.emailHash) ||
    !/^[a-f0-9]{64}$/.test(createInput.idempotencyKeyHash) ||
    createInput.requestCode !== body.requestCode
  ) {
    throw new Error(
      "The authenticated request did not reach the request-creation RPC boundary with the expected parameters.",
    );
  }
});

Deno.test("apikey header is not treated as an authenticated user session", async () => {
  const { handler } = createTestSetup();
  const request = makeRequest({
    ...requestBody,
    turnstileToken: "fresh-token",
  });
  request.headers.set("apikey", "user-access-token");
  const response = await handler(request);

  if (response.status !== 201) {
    throw new Error(
      "Untrusted apikey header was interpreted as a user session.",
    );
  }
});

Deno.test("authenticated contact email must match both verified profile emails", async () => {
  const { handler, calls } = createTestSetup({
    user: {
      id: "user-1",
      email: "different@example.com",
      email_confirmed_at: "2026-01-01T00:00:00Z",
    },
    customer: { id: "customer-1", email: "different@example.com" },
  });
  const response = await handler(
    makeRequest(
      { ...requestBody, turnstileToken: "fresh-token" },
      "Bearer test-access-token",
    ),
  );

  if (
    response.status !== 403 || calls().verifyCalls !== 0 ||
    calls().createCalls !== 0
  ) {
    throw new Error(
      "Mismatched contact and authenticated emails were accepted.",
    );
  }
});

Deno.test("customer profile email must match verified auth email", async () => {
  const { handler, calls } = createTestSetup({
    user: {
      id: "user-1",
      email: requestBody.email,
      email_confirmed_at: "2026-01-01T00:00:00Z",
    },
    customer: { id: "customer-1", email: "other@example.com" },
  });
  const response = await handler(
    makeRequest(
      { ...requestBody, turnstileToken: "fresh-token" },
      "Bearer test-access-token",
    ),
  );

  if (
    response.status !== 403 || calls().verifyCalls !== 0 ||
    calls().createCalls !== 0
  ) {
    throw new Error("Customer profile with mismatched email was accepted.");
  }
});

Deno.test("email limit is enforced after three successful new requests", async () => {
  const { handler, calls } = createTestSetup();
  const statuses: number[] = [];

  for (let index = 0; index < 4; index += 1) {
    const body = {
      ...requestBody,
      idempotencyKey: `123e4567-e89b-42d3-a456-${String(index).padStart(12, "0")}`,
      turnstileToken: `token-${index}`,
    };
    const response = await handler(makeRequest(body));
    statuses.push(response.status);
  }

  if (
    statuses.join(",") !== "201,201,201,429" ||
    calls().verifyCalls !== 4 ||
    calls().rateCount !== 4
  ) {
    throw new Error("The normalized-email rate limit was not enforced.");
  }
});

Deno.test("email limits are scoped to each HMAC email identifier", async () => {
  const { handler, calls } = createTestSetup();

  for (let index = 0; index < 4; index += 1) {
    const body = {
      ...requestBody,
      idempotencyKey: `123e4567-e89b-42d3-a456-${String(index + 1).padStart(12, "0")}`,
      turnstileToken: `token-${index}`,
    };
    const response = await handler(makeRequest(body));

    if (response.status !== (index === 3 ? 429 : 201)) {
      throw new Error("The shared email limit did not reach its expected threshold.");
    }
  }

  const otherEmailResponse = await handler(
    makeRequest({
      ...requestBody,
      idempotencyKey: "123e4567-e89b-42d3-a456-000000000005",
      email: "other@example.com",
      turnstileToken: "other-email-token",
    }),
  );

  if (otherEmailResponse.status !== 201 || calls().rateCount !== 5) {
    throw new Error("A different email was affected by another email's limit.");
  }
});

Deno.test("limits are checked only after Turnstile and stop persistence", async () => {
  const { handler, calls } = createTestSetup({
    createResult: {
      outcome: "rate_limited",
      request_code: null,
      status: null,
    },
  });
  const response = await handler(
    makeRequest({ ...requestBody, turnstileToken: "fresh-token" }),
  );

  if (
    response.status !== 429 || calls().verifyCalls !== 1 ||
    calls().rateCount !== 1
  ) {
    throw new Error(
      "Exceeded limits did not return 429 after CAPTCHA validation.",
    );
  }
});

Deno.test("invalid input does not call Turnstile or consume limits", async () => {
  const { handler, calls } = createTestSetup();
  const response = await handler(
    makeRequest({ ...requestBody, email: "invalid", turnstileToken: "token" }),
  );

  if (
    response.status !== 400 || calls().verifyCalls !== 0 ||
    calls().createCalls !== 0
  ) {
    throw new Error("Invalid input consumed protection limits.");
  }
});

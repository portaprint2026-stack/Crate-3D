import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://portaprint2026-stack.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const allowedTurnstileHosts = new Set([
  "portaprint2026-stack.github.io",
  "localhost",
  "127.0.0.1",
]);
const categories = new Set([
  "home",
  "decor",
  "personal",
  "desk",
  "custom",
  "other",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxBodyBytes = 12_000;

type Submission = {
  idempotencyKey: string;
  turnstileToken: string | null;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  description: string;
};

export type Customer = { id: string; email: string };
export type User = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

export type ExistingRequest = {
  request_code: string;
  customer_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  category: string;
  description: string;
  status: string;
};

export type CreateResult = {
  outcome: "created" | "duplicate" | "conflict" | "rate_limited";
  request_code: string | null;
  status: string | null;
};

export type CreateRequestInput = {
  emailHash: string;
  idempotencyKeyHash: string;
  requestCode: string;
  customerId: string | null;
  submission: Submission;
};

export type Backend = {
  getUser(token: string): Promise<{ user: User | null; failed: boolean }>;
  getCustomer(
    userId: string,
  ): Promise<{ customer: Customer | null; failed: boolean }>;
  findRequest(
    idempotencyKeyHash: string,
  ): Promise<{ request: ExistingRequest | null; failed: boolean }>;
  createRequest(
    input: CreateRequestInput,
  ): Promise<{ result: CreateResult | null; failed: boolean }>;
};

export type HandlerDependencies = {
  getEnv(name: string): string | undefined;
  createBackend(url: string, anonKey: string, serviceRoleKey: string): Backend;
  verifyTurnstile(
    token: string,
    secret: string,
  ): Promise<"valid" | "invalid" | "unavailable">;
  delay(milliseconds: number): Promise<void>;
};

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });

  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, apikey, content-type, x-client-info",
    );
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }

  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

function normalizeSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  if (
    typeof input.idempotencyKey !== "string" ||
    !uuidV4Pattern.test(input.idempotencyKey) ||
    (input.turnstileToken !== undefined &&
      input.turnstileToken !== null &&
      (typeof input.turnstileToken !== "string" ||
        input.turnstileToken.length > 2048)) ||
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.category !== "string" ||
    typeof input.description !== "string" ||
    (input.phone !== undefined && input.phone !== null &&
      typeof input.phone !== "string")
  ) {
    return null;
  }

  const name = input.name.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  const phone = typeof input.phone === "string"
    ? input.phone.trim() || null
    : null;
  const category = input.category;
  const description = input.description.trim();

  if (name.length < 1 || name.length > 120) return null;
  if (email.length > 254 || !emailPattern.test(email)) return null;
  if (
    phone &&
    (phone.length < 7 || phone.length > 25 || !/^[+0-9().\s-]+$/.test(phone))
  ) return null;
  if (!categories.has(category)) return null;
  if (description.length < 10 || description.length > 5000) return null;

  return {
    idempotencyKey: input.idempotencyKey.toLowerCase(),
    turnstileToken: typeof input.turnstileToken === "string"
      ? input.turnstileToken
      : null,
    name,
    email,
    phone,
    category,
    description,
  };
}

function requestMatches(
  request: ExistingRequest,
  submission: Submission,
  customerId: string | null,
): boolean {
  return request.customer_id === customerId &&
    request.contact_name === submission.name &&
    request.contact_email === submission.email &&
    request.contact_phone === submission.phone &&
    request.category === submission.category &&
    request.description === submission.description;
}

function makeRequestCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `PP-S-${
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
      .toUpperCase()
  }`;
}

async function readJsonBody(request: Request): Promise<
  { ok: true; value: unknown } | { ok: false; tooLarge: boolean }
> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return { ok: false, tooLarge: true };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, tooLarge: false };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;

    if (totalBytes > maxBodyBytes) {
      await reader.cancel();
      return { ok: false, tooLarge: true };
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(signature),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function verifyTurnstile(
  token: string,
  secret: string,
): Promise<"valid" | "invalid" | "unavailable"> {
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);

  let response: Response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(5000),
      },
    );
  } catch {
    return "unavailable";
  }

  if (!response.ok) return "unavailable";

  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    result = await response.json();
  } catch {
    return "unavailable";
  }

  if (!result.success) return "invalid";
  return result.action === "quote_request" &&
      typeof result.hostname === "string" &&
      allowedTurnstileHosts.has(result.hostname)
    ? "valid"
    : "invalid";
}

function createProductionBackend(
  url: string,
  anonKey: string,
  serviceRoleKey: string,
): Backend {
  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async getUser(token) {
      try {
        const { data, error } = await authClient.auth.getUser(token);
        return { user: error ? null : data.user, failed: false };
      } catch {
        return { user: null, failed: true };
      }
    },
    async getCustomer(userId) {
      try {
        const { data, error } = await adminClient
          .from("customers")
          .select("id, email")
          .eq("auth_user_id", userId)
          .maybeSingle();
        return { customer: data, failed: Boolean(error) };
      } catch {
        return { customer: null, failed: true };
      }
    },
    async findRequest(idempotencyKeyHash) {
      try {
        const { data, error } = await adminClient
          .from("quote_requests")
          .select(
            "request_code, customer_id, contact_name, contact_email, contact_phone, category, description, status",
          )
          .eq("idempotency_key_hash", idempotencyKeyHash)
          .maybeSingle();
        return { request: data, failed: Boolean(error) };
      } catch {
        return { request: null, failed: true };
      }
    },
    async createRequest(input) {
      try {
        const { data, error } = await adminClient.rpc("submit_quote_request", {
          p_email_hash: input.emailHash,
          p_idempotency_key_hash: input.idempotencyKeyHash,
          p_request_code: input.requestCode,
          p_customer_id: input.customerId,
          p_contact_name: input.submission.name,
          p_contact_email: input.submission.email,
          p_contact_phone: input.submission.phone,
          p_category: input.submission.category,
          p_description: input.submission.description,
        });
        if (error || !Array.isArray(data) || data.length !== 1) {
          return { result: null, failed: true };
        }

        const row = data[0] as Record<string, unknown>;
        if (
          typeof row.outcome !== "string" ||
          !["created", "duplicate", "conflict", "rate_limited"].includes(
            row.outcome,
          )
        ) return { result: null, failed: true };

        return {
          result: {
            outcome: row.outcome as CreateResult["outcome"],
            request_code: typeof row.request_code === "string"
              ? row.request_code
              : null,
            status: typeof row.status === "string" ? row.status : null,
          },
          failed: false,
        };
      } catch {
        return { result: null, failed: true };
      }
    },
  };
}

export function createSubmitQuoteRequestHandler(
  dependencies: HandlerDependencies,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(403, { error: "Solicitud no permitida." }, null);
    }
    if (request.method === "OPTIONS") return jsonResponse(204, {}, origin);
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Método no permitido." }, origin);
    }

    const parsedBody = await readJsonBody(request);
    if (!parsedBody.ok && parsedBody.tooLarge) {
      return jsonResponse(
        413,
        { error: "La solicitud es demasiado grande." },
        origin,
      );
    }
    if (!parsedBody.ok) {
      return jsonResponse(400, {
        error: "La solicitud no tiene un formato válido.",
      }, origin);
    }

    const submission = normalizeSubmission(parsedBody.value);
    if (!submission) {
      return jsonResponse(400, {
        error: "Revisa los campos obligatorios e inténtalo de nuevo.",
      }, origin);
    }

    const supabaseUrl = dependencies.getEnv("SUPABASE_URL");
    const anonKey = dependencies.getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = dependencies.getEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error(
        "[submit-quote-request] Backend configuration is incomplete.",
      );
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }

    const backend = dependencies.createBackend(
      supabaseUrl,
      anonKey,
      serviceRoleKey,
    );
    let customerId: string | null = null;
    const authorization = request.headers.get("authorization");

    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return jsonResponse(
          401,
          { error: "No fue posible validar la sesión." },
          origin,
        );
      }

      if (match[1] !== anonKey) {
        const { user, failed } = await backend.getUser(match[1]);
        if (failed) {
          console.error("[submit-quote-request] Authentication lookup failed.");
          return jsonResponse(503, {
            error: "No pudimos recibir la solicitud en este momento.",
          }, origin);
        }
        if (!user) {
          return jsonResponse(
            401,
            { error: "No fue posible validar la sesión." },
            origin,
          );
        }

        const verifiedEmail = user.email?.trim().toLowerCase();
        if (!user.email_confirmed_at || !verifiedEmail) {
          return jsonResponse(403, {
            error: "No fue posible validar los datos de la solicitud.",
          }, origin);
        }

        const { customer, failed: customerLookupFailed } = await backend
          .getCustomer(user.id);
        if (customerLookupFailed) {
          console.error("[submit-quote-request] Customer lookup failed.");
          return jsonResponse(503, {
            error: "No pudimos recibir la solicitud en este momento.",
          }, origin);
        }
        if (
          !customer ||
          customer.email.trim().toLowerCase() !== verifiedEmail ||
          verifiedEmail !== submission.email
        ) {
          return jsonResponse(403, {
            error: "No fue posible validar los datos de la solicitud.",
          }, origin);
        }

        customerId = customer.id;
      }
    }

    let idempotencyKeyHash: string;
    try {
      idempotencyKeyHash = await sha256Hex(submission.idempotencyKey);
    } catch {
      console.error("[submit-quote-request] Idempotency key hashing failed.");
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }

    const findExisting = async (): Promise<
      { response: Response | null; failed: boolean }
    > => {
      const { request: existing, failed } = await backend.findRequest(
        idempotencyKeyHash,
      );
      if (failed) return { response: null, failed: true };
      if (!existing) return { response: null, failed: false };
      if (!requestMatches(existing, submission, customerId)) {
        return {
          response: jsonResponse(409, {
            error:
              "No fue posible procesar esta solicitud. Actualiza la página e inténtalo de nuevo.",
          }, origin),
          failed: false,
        };
      }

      return {
        response: jsonResponse(200, {
          requestCode: existing.request_code,
          status: existing.status,
        }, origin),
        failed: false,
      };
    };

    const existingResult = await findExisting();
    if (existingResult.failed) {
      console.error("[submit-quote-request] Idempotency lookup failed.");
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }
    if (existingResult.response) return existingResult.response;

    const turnstileSecret = dependencies.getEnv("TURNSTILE_SECRET_KEY");
    const rateLimitSecret = dependencies.getEnv("RATE_LIMIT_HMAC_SECRET");
    if (
      !turnstileSecret ||
      !rateLimitSecret ||
      rateLimitSecret.length < 32
    ) {
      console.error(
        "[submit-quote-request] Abuse protection configuration is incomplete.",
      );
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }

    if (!submission.turnstileToken) {
      return jsonResponse(400, {
        error: "Completa nuevamente la verificación de seguridad.",
      }, origin);
    }

    const turnstileResult = await dependencies.verifyTurnstile(
      submission.turnstileToken,
      turnstileSecret,
    );
    if (turnstileResult === "unavailable") {
      console.error(
        "[submit-quote-request] Turnstile verification is unavailable.",
      );
      return jsonResponse(503, {
        error: "No pudimos verificar la solicitud en este momento.",
      }, origin);
    }

    if (turnstileResult !== "valid") {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await dependencies.delay(100);
        const racedResult = await findExisting();
        if (racedResult.failed) {
          console.error("[submit-quote-request] Idempotency lookup failed.");
          return jsonResponse(503, {
            error: "No pudimos recibir la solicitud en este momento.",
          }, origin);
        }
        if (racedResult.response) return racedResult.response;
      }

      return jsonResponse(400, {
        error: "Completa nuevamente la verificación de seguridad.",
      }, origin);
    }

    let emailHash: string;
    try {
      emailHash = await hmacHex(
        rateLimitSecret,
        `email:${submission.email}`,
      );
    } catch {
      console.error(
        "[submit-quote-request] Rate limit identifier hashing failed.",
      );
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }

    const { result, failed } = await backend.createRequest({
      emailHash,
      idempotencyKeyHash,
      requestCode: makeRequestCode(),
      customerId,
      submission,
    });

    if (failed || !result) {
      console.error("[submit-quote-request] Request creation failed.");
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }
    if (result.outcome === "conflict") {
      return jsonResponse(409, {
        error:
          "No fue posible procesar esta solicitud. Actualiza la página e inténtalo de nuevo.",
      }, origin);
    }
    if (result.outcome === "rate_limited") {
      return jsonResponse(429, {
        error:
          "No pudimos procesar más solicitudes en este momento. Inténtalo más tarde.",
      }, origin);
    }
    if (!result.request_code || !result.status) {
      console.error("[submit-quote-request] Request result was incomplete.");
      return jsonResponse(503, {
        error: "No pudimos recibir la solicitud en este momento.",
      }, origin);
    }

    return jsonResponse(result.outcome === "created" ? 201 : 200, {
      requestCode: result.request_code,
      status: result.status,
    }, origin);
  };
}

const productionDependencies: HandlerDependencies = {
  getEnv: (name) => Deno.env.get(name),
  createBackend: createProductionBackend,
  verifyTurnstile,
  delay: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

if (import.meta.main) {
  Deno.serve(createSubmitQuoteRequestHandler(productionDependencies));
}

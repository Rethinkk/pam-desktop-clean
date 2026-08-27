import { createHash, createHmac } from "node:crypto";

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return createHmac("sha256", key).update(value).digest(encoding);
}

function encodePathSegment(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalObjectPath(bucket, key) {
  return `/${encodePathSegment(bucket)}/${String(key).split("/").map(encodePathSegment).join("/")}`;
}

function amzDate(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function signingKey(secretKey, dateStamp, region) {
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

export function createObjectStorageConfig(env = process.env) {
  if (!env.PAM_OBJECT_STORAGE_BUCKET || !env.PAM_OBJECT_STORAGE_ENDPOINT) {
    return undefined;
  }

  return {
    bucket: env.PAM_OBJECT_STORAGE_BUCKET,
    region: env.PAM_OBJECT_STORAGE_REGION ?? "nl-ams",
    endpoint: env.PAM_OBJECT_STORAGE_ENDPOINT,
    accessKey: env.PAM_OBJECT_STORAGE_ACCESS_KEY,
    secretKey: env.PAM_OBJECT_STORAGE_SECRET_KEY,
  };
}

export function createObjectStorageClient(config) {
  if (!config?.bucket || !config?.endpoint || !config?.accessKey || !config?.secretKey) {
    throw new Error("Object Storage bucket, endpoint, access key and secret key are required.");
  }

  const endpoint = new URL(config.endpoint);

  async function request(method, key, body) {
    const payload = body ? Buffer.from(body) : Buffer.alloc(0);
    const payloadHash = sha256Hex(payload);
    const requestDate = amzDate();
    const dateStamp = requestDate.slice(0, 8);
    const canonicalUri = canonicalObjectPath(config.bucket, key);
    const host = endpoint.host;
    const headers = {
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": requestDate,
    };

    if (method === "PUT") {
      headers["content-type"] = "application/octet-stream";
    }

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys
      .map((header) => `${header}:${String(headers[header]).trim()}\n`)
      .join("");
    const signedHeaders = sortedHeaderKeys.join(";");
    const canonicalRequest = [
      method,
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      requestDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");
    const signature = hmac(signingKey(config.secretKey, dateStamp, config.region), stringToSign, "hex");
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");

    const response = await fetch(new URL(canonicalUri, endpoint), {
      method,
      headers: {
        ...headers,
        Authorization: authorization,
      },
      body: method === "PUT" ? payload : undefined,
    });

    return {
      status: response.status,
      ok: response.ok,
      text: await response.text(),
      headers: response.headers,
    };
  }

  return {
    putObject(key, body) {
      return request("PUT", key, body);
    },
    getObject(key) {
      return request("GET", key);
    },
    deleteObject(key) {
      return request("DELETE", key);
    },
  };
}

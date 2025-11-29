// Minimal AWS S3 integration - optional, doesn't affect existing file handling
import * as crypto from "crypto";

export interface S3Config {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;
}

export function getS3Config(): S3Config {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_S3_REGION || "us-east-1",
  };
}

export function isS3Configured(): boolean {
  const config = getS3Config();
  return !!(config.accessKeyId && config.secretAccessKey && config.bucket);
}

// Generate presigned URL for GET requests (download)
export function generatePresignedUrl(
  key: string,
  expirationSeconds: number = 3600
): string {
  const config = getS3Config();
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("S3 not configured");
  }

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const datestamp = amzDate.split("T")[0];
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${datestamp}/${config.region}/s3/aws4_request`;

  const canonicalRequest = [
    "GET",
    `/${key}`,
    `X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(config.accessKeyId)}/${encodeURIComponent(credentialScope)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expirationSeconds}&X-Amz-SignedHeaders=host`,
    "host:" + `${config.bucket}.s3.${config.region}.amazonaws.com`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const hashedCanonical = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashedCanonical,
  ].join("\n");

  const kSecret = "AWS4" + config.secretAccessKey;
  const kDate = crypto.createHmac("sha256", kSecret).update(datestamp).digest();
  const kRegion = crypto
    .createHmac("sha256", kDate)
    .update(config.region)
    .digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update("s3")
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}?X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(config.accessKeyId)}/${encodeURIComponent(credentialScope)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expirationSeconds}&X-Amz-SignedHeaders=host&X-Amz-Signature=${signature}`;
}

// Generate presigned URL for PUT requests (upload)
export function generateUploadPresignedUrl(
  key: string,
  contentType: string,
  expirationSeconds: number = 3600
): string {
  const config = getS3Config();
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("S3 not configured");
  }

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const datestamp = amzDate.split("T")[0];
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${datestamp}/${config.region}/s3/aws4_request`;

  const canonicalRequest = [
    "PUT",
    `/${key}`,
    `X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(config.accessKeyId)}/${encodeURIComponent(credentialScope)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expirationSeconds}&X-Amz-SignedHeaders=host`,
    "host:" + `${config.bucket}.s3.${config.region}.amazonaws.com`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const hashedCanonical = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashedCanonical,
  ].join("\n");

  const kSecret = "AWS4" + config.secretAccessKey;
  const kDate = crypto.createHmac("sha256", kSecret).update(datestamp).digest();
  const kRegion = crypto
    .createHmac("sha256", kDate)
    .update(config.region)
    .digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update("s3")
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}?X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(config.accessKeyId)}/${encodeURIComponent(credentialScope)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expirationSeconds}&X-Amz-SignedHeaders=host&X-Amz-Signature=${signature}`;
}

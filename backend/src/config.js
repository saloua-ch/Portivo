import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  fileSigningSecret: required("FILE_SIGNING_SECRET"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  sessionHours: 12,
};

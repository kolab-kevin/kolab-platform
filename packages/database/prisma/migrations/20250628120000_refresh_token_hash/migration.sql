-- Rename refresh token column to store SHA-256 hash instead of plain token
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";

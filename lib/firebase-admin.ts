// We use the client Firebase SDK for admin operations
// This avoids firebase-admin package bundling issues with Next.js
// All admin routes are protected by x-admin-uid header check

export { db } from "./firebase";

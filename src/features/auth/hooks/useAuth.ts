// src/hooks/useAuth.ts
// Tüm auth state'i (token, user, roles, permissions, clubMemberships) tek
// yerde: src/context/AuthContext.tsx. Bu dosya sadece mevcut import yolunu
// (src/hooks/useAuth) korumak için re-export ediyor.
export { useAuth } from "@/features/auth/context/AuthContext";

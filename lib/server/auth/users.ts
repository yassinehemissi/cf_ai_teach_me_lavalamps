import "server-only";

import { getAuthEnvironment } from "./auth.config";
import { d1Execute, d1Query } from "./d1";

export type AuthUser = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const { usersTable } = getAuthEnvironment();
  const users = await d1Query<AuthUser>(
    `SELECT id, email, password_hash, created_at FROM ${usersTable} WHERE email = ? LIMIT 1`,
    [email],
  );

  return users[0] ?? null;
}

export async function findUserById(userId: string): Promise<AuthUser | null> {
  const { usersTable } = getAuthEnvironment();
  const users = await d1Query<AuthUser>(
    `SELECT id, email, password_hash, created_at FROM ${usersTable} WHERE id = ? LIMIT 1`,
    [userId],
  );

  return users[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<AuthUser> {
  const { usersTable } = getAuthEnvironment();

  await d1Execute(
    `INSERT INTO ${usersTable} (email, password_hash) VALUES (?, ?)`,
    [email, passwordHash],
  );

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("User creation succeeded but the inserted user could not be fetched.");
  }

  return user;
}

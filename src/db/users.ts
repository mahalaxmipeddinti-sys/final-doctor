// src/db/users.ts
import { db, isDatabaseConfigured } from './index.ts';
import { users } from './schema.ts';

const memoryUsers = new Map<string, { id: number; uid: string; email: string; createdAt: Date }>();
let memoryUserIdCounter = 1;

export async function getOrCreateUser(uid: string, email: string) {
  if (isDatabaseConfigured) {
    try {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
          },
        })
        .returning();

      return result[0];
    } catch (error) {
      console.warn('Database user upsert failed, using memory store:', error);
    }
  }

  // In-memory fallback
  let user = memoryUsers.get(uid);
  if (!user) {
    user = {
      id: memoryUserIdCounter++,
      uid,
      email,
      createdAt: new Date(),
    };
    memoryUsers.set(uid, user);
  } else {
    user.email = email;
  }
  return user;
}

export async function getUsers() {
  if (isDatabaseConfigured) {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.warn('Database getUsers failed, using memory store:', error);
    }
  }

  return Array.from(memoryUsers.values());
}

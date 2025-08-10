import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

export const initDb = async (): Promise<void> => {
  const initSql = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    user_uid VARCHAR(255) NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_uid VARCHAR(255) NOT NULL
  );
  `;

  try {
    await pool.query(initSql);
    console.log('Tables créées ou déjà existantes');
  } catch (err) {
    console.error('Erreur création tables:', err);
  }
};

export const upsertUser = async (
  authId: string,
  email: string,
  provider: string,
  userUid: string,
  friends: string[]
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resUser = await client.query<{ id: number }>(
      `INSERT INTO users(auth_id, email, provider, user_uid)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (auth_id) DO UPDATE SET user_uid = EXCLUDED.user_uid
       RETURNING id`,
      [authId, email, provider, userUid]
    );
    const userId = resUser.rows[0].id;

    await client.query(`DELETE FROM friends WHERE user_id = $1`, [userId]);

    if (friends.length > 0) {
      const insertValues = friends.map((_, i) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO friends(user_id, friend_uid) VALUES ${insertValues}`,
        [userId, ...friends]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const getUserData = async (
  authId: string
): Promise<{ userUid: string; email: string; provider: string; friends: string[] } | null> => {
  const client = await pool.connect();
  try {
    const userRes = await client.query<{
      id: number;
      user_uid: string;
      email: string;
      provider: string;
    }>(`SELECT id, user_uid, email, provider FROM users WHERE auth_id = $1`, [authId]);

    if (userRes.rows.length === 0) return null;

    const user = userRes.rows[0];

    const friendsRes = await client.query<{ friend_uid: string }>(
      `SELECT friend_uid FROM friends WHERE user_id = $1`,
      [user.id]
    );

    const friends = friendsRes.rows.map((r) => r.friend_uid);

    return {
      userUid: user.user_uid,
      email: user.email,
      provider: user.provider,
      friends,
    };
  } finally {
    client.release();
  }
};

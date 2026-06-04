import IORedis from "ioredis";

export type RedisConnection = IORedis;

let _connection: RedisConnection | null = null;

export function createRedisConnection(): RedisConnection {
  if (!_connection) {
    const redisUrl = process.env["REDIS_URL"];
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is required");
    }
    _connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}

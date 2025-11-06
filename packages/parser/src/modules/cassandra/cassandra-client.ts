import { Client } from 'cassandra-driver';

const client = new Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINTS || 'localhost'],
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'users_keyspace',
});

export async function initCassandra() {
  await client.connect();

  // Create keyspace and table if not exist
  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE || 'users_keyspace'}
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name text,
      email text
    );
  `);

  console.log('Cassandra connected and keyspace initialized');
}

export { client };

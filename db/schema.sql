CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouse_components (
  part_number TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouse_insumos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Seed default admin user with hashed password
INSERT INTO users (id, data) VALUES (
  'user-admin',
  '{"id":"user-admin","email":"admin@example.com","password":"$2b$10$3vgO05oKLDlyshnV3WqZQOfld7y9HrbWRyY8rPUpJUT3s0.o3jrm6","name":"Admin"}'
) ON CONFLICT DO NOTHING;

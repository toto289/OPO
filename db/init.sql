INSERT INTO users (id, data) VALUES (
  'user-1',
  jsonb_build_object(
    'id', 'user-1',
    'email', 'admin@paguemenos.com',
    'password', '$2b$10$WIPSINi022QSRHZzDiUzUu1wvc7mMivcWJcFytf1HMrlVvbg5ijuS',
    'name', 'Administrador do Sistema',
    'cargo', 'Administrador de TI',
    'role', 'Administrador',
    'avatarUrl', ''
  )
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, data) VALUES (
  'user-1',
  jsonb_build_object(
    'id', 'user-1',
    'email', 'admin@paguemenos.com',
    'password', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    'name', 'Administrador do Sistema',
    'cargo', 'Administrador de TI',
    'role', 'Administrador',
    'avatarUrl', ''
  )
)
ON CONFLICT (id) DO NOTHING;

\connect data-ingestion;

INSERT INTO tenant (id, name, email, phone)
SELECT
    gen_random_uuid(),
    'Tenant' || ((random() * 100)::int + 1),
    'tenant' || ((random() * 1000)::int + 1) || '@example.com',
    '+49(162)' || lpad(((random() * 9999)::int)::text, 4, '0')
FROM generate_series(1, 10);

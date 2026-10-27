-- "Full Access" roles created before the products resource existed don't
-- include it. Give them full products access (idempotent).
INSERT INTO "role_permissions" ("id", "roleId", "resource", "actions")
SELECT gen_random_uuid()::text, r."id", 'products', ARRAY['create', 'read', 'update', 'delete']
FROM "roles" r
WHERE r."name" = 'Full Access'
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" p
    WHERE p."roleId" = r."id" AND p."resource" = 'products'
  );

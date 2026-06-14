export const RESOURCES = [
  'shipments',
  'payments',
  'agents',
  'customers',
  'contracts',
  'verifications',
  'invoices',
  'roles',
  'staff',
  'reports',
  'company',
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = 'create' | 'read' | 'update' | 'delete';
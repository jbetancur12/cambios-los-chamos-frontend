import type { UserRole } from '@/types/api'

/**
 * Single source of truth for who can see what in the interface.
 *
 * The menu (DashboardLayout) and the route guards (App) both read from ACCESS, so a role is
 * granted or removed in one place. This is only an interface barrier: the backend must still
 * validate the role on every endpoint.
 */

const ALL: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA', 'MINORISTA']
const ADMINS: UserRole[] = ['SUPER_ADMIN', 'ADMIN']
const ADMINS_AND_MINORISTA: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MINORISTA']
const ADMINS_AND_TRANSFERENCISTA: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'TRANSFERENCISTA']

export const ACCESS = {
  dashboard: ALL,
  giros: ALL,
  enviarGiro: ADMINS_AND_MINORISTA,
  usuarios: ADMINS,
  cuentasBancarias: ADMINS,
  tasas: ADMINS_AND_MINORISTA,
  calculadora: ADMINS_AND_MINORISTA,
  clientesFacturacion: ADMINS,
  calculadoraVesCompra: ADMINS,
  reportes: ['SUPER_ADMIN'] as UserRole[],
  auditoriaBeneficiarios: ['SUPER_ADMIN'] as UserRole[],
  auditoriaOculta: ADMINS,
  misReportes: ['MINORISTA'] as UserRole[],
  transaccionesMinorista: ['MINORISTA'] as UserRole[],
  inventario: ADMINS,
  configuracion: ADMINS_AND_TRANSFERENCISTA,
  logs: ADMINS,
} satisfies Record<string, UserRole[]>

export const hasRole = (role: UserRole | undefined, allowed: UserRole[]): boolean =>
  role !== undefined && allowed.includes(role)

export const isSuperAdmin = (role?: UserRole): boolean => role === 'SUPER_ADMIN'

/** SUPER_ADMIN or ADMIN */
export const isAdmin = (role?: UserRole): boolean => role === 'SUPER_ADMIN' || role === 'ADMIN'

export const isMinorista = (role?: UserRole): boolean => role === 'MINORISTA'

export const isTransferencista = (role?: UserRole): boolean => role === 'TRANSFERENCISTA'

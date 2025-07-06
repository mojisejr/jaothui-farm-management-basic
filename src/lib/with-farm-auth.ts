import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateUser,
  checkFarmAccess,
  checkFarmOwnership,
} from '@/lib/farm-auth'

interface Options {
  /** If true, user must be OWNER of the farm */
  ownerOnly?: boolean
  /** Name of route param that contains farmId (default: 'id') */
  paramKey?: string
}

/**
 * Higher-order handler to protect farm API routes / actions by role.
 *
 * Usage:
 * ```ts
 * export const POST = withFarmAuth(async (req, ctx) => { ... }, { ownerOnly: true })
 * ```
 */
export function withFarmAuth<
  T extends (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => Promise<Response> | Response,
>(handler: T, { ownerOnly = false, paramKey = 'id' }: Options = {}): T {
  return async function (request: NextRequest, context: { params: Promise<Record<string, string>> }) {
    // 1) auth user
    const authRes = await authenticateUser()
    if (!authRes.success) {
      return NextResponse.json(
        { error: authRes.error },
        { status: authRes.status ?? 401 },
      )
    }

    // Await the params Promise
    const params = await context.params
    const farmId = params?.[paramKey]
    if (!farmId || typeof farmId !== 'string') {
      return NextResponse.json({ error: 'ไม่พบรหัสฟาร์ม' }, { status: 400 })
    }

    // 2) check permission
    const checkFn = ownerOnly ? checkFarmOwnership : checkFarmAccess
    const permRes = await checkFn(farmId, authRes.userId!)
    if (!permRes.success) {
      return NextResponse.json(
        { error: permRes.error },
        { status: permRes.status ?? 403 },
      )
    }

    // 3) pass through
    return handler(request, context)
  } as T
}

import { NextRequest, NextResponse } from 'next/server'

function resolveApiOrigin(): string {
  const raw =
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:3000'
  const trimmed = raw.replace(/\/$/, '')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

async function proxyRequest(
  request: NextRequest,
  context: { params: { path: string[] } },
): Promise<NextResponse> {
  const segments = context.params.path ?? []
  const target = `${resolveApiOrigin()}/api/v1/${segments.join('/')}${request.nextUrl.search}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const authorization = request.headers.get('authorization')
  if (authorization) headers.set('authorization', authorization)
  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
  })

  const response = new NextResponse(await upstream.text(), {
    status: upstream.status,
  })

  const upstreamContentType = upstream.headers.get('content-type')
  if (upstreamContentType) {
    response.headers.set('content-type', upstreamContentType)
  }

  const setCookie = upstream.headers.get('set-cookie')
  if (setCookie) {
    response.headers.set('set-cookie', setCookie)
  }

  return response
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const OPTIONS = proxyRequest

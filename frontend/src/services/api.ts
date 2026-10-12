export type Banner = { message: string; updatedAt: string | null }

type ApiError = Error & { status?: number }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Không thể kết nối máy chủ. Vui lòng thử lại sau.')
  }

  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) {
    const error = new Error(payload.error || 'Yêu cầu không thành công.') as ApiError
    error.status = response.status
    throw error
  }
  return payload as T
}

export const api = {
  getBanner: () => request<Banner>('/api/banner', { cache: 'no-store' }),
  sendMessage: (name: string, message: string) =>
    request<{ message: string }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ name, message }),
    }),
  updateBanner: (token: string, message: string) =>
    request<Banner>('/api/admin/banner', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    }),
}

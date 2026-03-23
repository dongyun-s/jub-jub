/**
 * 인증·계정 흐름 데모용 목업 (백엔드 호출 없음)
 */

export type MockVerificationType = 'EMAIL' | 'SMS'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockLogin(email: string, password: string) {
  await wait(450)
  if (!email.trim() || !password) {
    throw new Error('이메일과 비밀번호를 입력해 주세요.')
  }
  return {
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
    email: email.trim(),
    nickname: '줍줍러',
  }
}

export async function mockVerifySend(channel: MockVerificationType, target: string) {
  await wait(500)
  if (!target.trim()) {
    throw new Error(channel === 'EMAIL' ? '이메일을 입력해 주세요.' : '휴대폰 번호를 입력해 주세요.')
  }
  const expires = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 19)
  return { logId: 1001, expiresAt: expires }
}

export async function mockVerifyConfirm(_logId: number, code: string) {
  await wait(350)
  if (code.trim().length !== 6) {
    return { isVerified: false }
  }
  return { isVerified: true }
}

export async function mockSignup(_body: {
  email: string
  password: string
  name: string
  phone: string
  nickname: string
}) {
  await wait(600)
}

export async function mockFindId(name: string, phone: string) {
  await wait(400)
  if (!name.trim() || !phone.trim()) {
    throw new Error('이름과 휴대폰 번호를 입력해 주세요.')
  }
  const local = name.trim().slice(0, 2).toLowerCase() || 'ju'
  return `${local}***@example.com`
}

export async function mockFindPasswordSend(email: string) {
  await wait(450)
  if (!email.trim()) {
    throw new Error('이메일을 입력해 주세요.')
  }
  return 2002
}

export async function mockResetPassword(_email: string, _logId: number, _newPassword: string) {
  await wait(450)
}

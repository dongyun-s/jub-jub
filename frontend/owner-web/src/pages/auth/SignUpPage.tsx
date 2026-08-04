import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import SimpleAlertModal from '../../components/SimpleAlertModal/SimpleAlertModal'
import { Icon } from '../../components/Icon'
import { ApiError } from '../../api/authClient'
import { signup, verifyConfirm, verifySend, type VerificationType } from '../../api/auth'
import { formatBusinessNumber, verifyBusinessNumber } from '../../api/business'
import { openDaumPostcode } from '../../lib/daumPostcode'
import { useOwnerMockData } from '../../lib/ownerConfig'
import { saveMockOwnerCredential, saveOwnerStoreProfile } from '../../lib/ownerSession'
import styles from './AuthPage.module.css'

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function SignUpPage() {
  const navigate = useNavigate()
  const mockMode = useOwnerMockData()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [bizVerified, setBizVerified] = useState(false)
  const [bizStatusLabel, setBizStatusLabel] = useState<string | null>(null)
  const [bizChecking, setBizChecking] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [zonecode, setZonecode] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeAddressDetail, setStoreAddressDetail] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const [verifyChannel, setVerifyChannel] = useState<VerificationType>('SMS')
  const targetForSend = useMemo(() => (verifyChannel === 'EMAIL' ? email.trim() : phone.trim()), [verifyChannel, email, phone])

  const [logId, setLogId] = useState<number | null>(null)
  const [verified, setVerified] = useState(false)

  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const sendConfirmMessage = useMemo(() => {
    if (!targetForSend) return ''
    return verifyChannel === 'EMAIL'
      ? `${targetForSend}로 인증 메일을 보낼까요?\n메일함·스팸함을 확인해 주세요.`
      : `${targetForSend}로 인증 문자를 보낼까요?`
  }, [targetForSend, verifyChannel])

  const requestSendCode = () => {
    setError(null)
    setInfo(null)
    if (verifyChannel === 'EMAIL') {
      if (!email.trim()) {
        setError('이메일을 입력해 주세요.')
        return
      }
    } else if (!phone.trim()) {
      setError('휴대폰 번호를 입력해 주세요.')
      return
    }
    setSendConfirmOpen(true)
  }

  const handleSendCode = async () => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const res = await verifySend(verifyChannel, targetForSend)
      setLogId(res.logId)
      setVerified(false)
      setInfo(
        verifyChannel === 'EMAIL'
          ? `입력하신 이메일로 인증번호를 보냈습니다. 메일함·스팸함을 확인해 주세요. (만료: ${res.expiresAt})`
          : `문자(SMS)로 인증번호를 보냈습니다. (만료: ${res.expiresAt})`,
      )
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)
    setInfo(null)
    if (logId == null) {
      setError('먼저 인증번호를 발송해 주세요.')
      return
    }
    if (!verifyCode.trim()) {
      setError('인증번호를 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await verifyConfirm(logId, verifyCode.trim())
      if (res.isVerified) {
        setVerified(true)
        setInfo(
          verifyChannel === 'EMAIL'
            ? '이메일 인증이 완료되었습니다. 아래 정보를 확인한 뒤 가입을 완료하세요.'
            : '휴대폰 인증이 완료되었습니다. 아래 정보를 확인한 뒤 가입을 완료하세요.',
        )
      } else {
        setError(
          verifyChannel === 'EMAIL' ? '이메일로 받은 인증번호가 올바르지 않습니다.' : '문자로 받은 인증번호가 올바르지 않습니다.',
        )
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '인증 확인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleBizVerify = async () => {
    setError(null)
    setInfo(null)
    setBizChecking(true)
    try {
      const result = await verifyBusinessNumber(businessNumber)
      setBizVerified(result.ok)
      setBizStatusLabel(result.ok ? result.message : null)
      if (result.ok) {
        setBusinessNumber(formatBusinessNumber(result.businessNumber))
        setInfo(result.message)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setBizVerified(false)
      setBizStatusLabel(null)
      setError(err instanceof Error ? err.message : '사업자번호 확인에 실패했습니다.')
    } finally {
      setBizChecking(false)
    }
  }

  const handleAddressSearch = async () => {
    setError(null)
    try {
      const result = await openDaumPostcode()
      setZonecode(result.zonecode)
      setStoreAddress(result.address)
      setStoreAddressDetail('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '주소 검색에 실패했습니다.'
      if (!msg.includes('취소')) setError(msg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!mockMode && !verified) {
      setError(verifyChannel === 'EMAIL' ? '이메일 인증을 완료해 주세요.' : '휴대폰(SMS) 인증을 완료해 주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    const bizDigits = digitsOnly(businessNumber)
    if (bizDigits.length < 10) {
      setError('사업자번호를 확인해 주세요. (숫자 10자리)')
      return
    }
    if (!bizVerified) {
      setError('사업자번호 확인을 완료해 주세요.')
      return
    }
    if (!storeAddress.trim()) {
      setError('업장 주소를 검색해 선택해 주세요.')
      return
    }
    if (!storePhone.trim()) {
      setError('가게 전화번호를 입력해 주세요.')
      return
    }

    const fullAddress = [zonecode ? `(${zonecode})` : '', storeAddress.trim(), storeAddressDetail.trim()]
      .filter(Boolean)
      .join(' ')

    setLoading(true)
    try {
      if (!mockMode) {
        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          nickname: (nickname.trim() || name.trim()).trim(),
        })
      } else {
        saveMockOwnerCredential(email.trim(), password)
      }

      saveOwnerStoreProfile({
        email: email.trim(),
        businessNumber: bizDigits,
        storeAddress: fullAddress,
        storePhone: storePhone.trim(),
        storeName: storeName.trim() || name.trim(),
      })

      navigate('/auth/login', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onChangeChannel = (next: VerificationType) => {
    setVerifyChannel(next)
    setLogId(null)
    setVerified(false)
    setVerifyCode('')
    setError(null)
    setInfo(null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandLeft}>
            <img src="/logo.png" alt="JubJub" className={styles.brandLogo} />
            <div>
              <p className={styles.brandTitle}>줍줍 사장님</p>
              <p className={styles.brandSub}>회원가입</p>
            </div>
          </div>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/auth/login')}>
            <Icon name="arrow_back" style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        <h1 className={styles.title}>계정을 만들어 주세요</h1>
        <p className={styles.subtitle}>
          {mockMode
            ? '예시 모드: 매장 정보와 계정을 이 브라우저에 저장합니다.'
            : '인증을 완료한 뒤 가입할 수 있습니다. 매장 정보는 사장님 앱에 로컬 저장됩니다.'}
        </p>

        {info ? <div className={styles.mutedBox}>{info}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          {!mockMode ? (
            <div className={styles.channelRow}>
              <button
                type="button"
                className={[styles.channelBtn, verifyChannel === 'SMS' ? styles.channelBtnActive : ''].join(' ')}
                onClick={() => onChangeChannel('SMS')}
              >
                SMS 인증
              </button>
              <button
                type="button"
                className={[styles.channelBtn, verifyChannel === 'EMAIL' ? styles.channelBtnActive : ''].join(' ')}
                onClick={() => onChangeChannel('EMAIL')}
              >
                이메일 인증
              </button>
            </div>
          ) : null}

          <div className={styles.twoCol}>
            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="name">
                이름
              </label>
              <input
                id="name"
                className="owner-input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="성함을 입력하세요"
                required
              />
            </div>

            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="nickname">
                닉네임
              </label>
              <input
                id="nickname"
                className="owner-input-field"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="앱에서 표시될 닉네임"
              />
            </div>
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="owner-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
            />
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="phone">
              휴대폰 번호
            </label>
            <input
              id="phone"
              type="tel"
              className="owner-input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="전화번호를 입력해 주세요"
              required
            />
          </div>

          <div className={styles.mutedBox}>
            <p style={{ margin: 0, fontWeight: 800, color: 'var(--owner-on-surface)' }}>매장 정보</p>
            <p style={{ margin: '0.4rem 0 0' }}>사장님 계정과 매장은 1:1로 연결됩니다.</p>
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="storeName">
              가게명
            </label>
            <input
              id="storeName"
              className="owner-input-field"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="가게 이름 (선택)"
            />
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="businessNumber">
              사업자번호
            </label>
            <div className={styles.fieldWithBtn}>
              <input
                id="businessNumber"
                className="owner-input-field"
                value={businessNumber}
                onChange={(e) => {
                  setBusinessNumber(e.target.value)
                  setBizVerified(false)
                  setBizStatusLabel(null)
                }}
                placeholder="000-00-00000"
                inputMode="numeric"
                required
              />
              <button
                type="button"
                className={styles.sideBtn}
                disabled={bizChecking || loading}
                onClick={() => void handleBizVerify()}
              >
                {bizChecking ? '확인 중…' : bizVerified ? '확인됨' : '번호 확인'}
              </button>
            </div>
            {bizVerified && bizStatusLabel ? <p className={styles.okNote}>{bizStatusLabel}</p> : null}
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="storeAddress">
              업장 주소
            </label>
            <div className={styles.fieldWithBtn}>
              <input
                id="storeAddress"
                className="owner-input-field"
                value={storeAddress ? (zonecode ? `[${zonecode}] ${storeAddress}` : storeAddress) : ''}
                readOnly
                placeholder="주소 검색으로 선택해 주세요"
                required
              />
              <button type="button" className={styles.sideBtn} disabled={loading} onClick={() => void handleAddressSearch()}>
                주소 검색
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="storeAddressDetail">
              상세 주소
            </label>
            <input
              id="storeAddressDetail"
              className="owner-input-field"
              value={storeAddressDetail}
              onChange={(e) => setStoreAddressDetail(e.target.value)}
              placeholder="동·호수 등 (선택)"
              disabled={!storeAddress}
            />
          </div>

          <div className={styles.row}>
            <label className="owner-input-label" htmlFor="storePhone">
              가게 전화번호
            </label>
            <input
              id="storePhone"
              type="tel"
              className="owner-input-field"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="매장 대표 번호"
              required
            />
          </div>

          {!mockMode ? (
          <div className={styles.mutedBox}>
            <p style={{ margin: 0, fontWeight: 800, color: 'var(--owner-on-surface)' }}>
              {verifyChannel === 'EMAIL' ? '이메일 인증' : '휴대폰(SMS) 인증'}
            </p>
            <p style={{ margin: '0.4rem 0 0' }}>
              {verifyChannel === 'EMAIL' ? '입력한 이메일로 인증번호를 보냅니다.' : '입력한 번호로 인증번호를 보냅니다.'}
            </p>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="owner-btn-primary" disabled={loading} onClick={requestSendCode}>
                인증 발송
              </button>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
              <label className="owner-input-label" htmlFor="verifyCode">
                인증번호
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  id="verifyCode"
                  type="text"
                  className="owner-input-field"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="6자리"
                  maxLength={6}
                  inputMode="numeric"
                  required={!mockMode}
                />
                <button type="button" className="owner-btn-primary" disabled={loading} onClick={handleVerifyCode}>
                  확인
                </button>
              </div>
            </div>

            {verified ? <p className={styles.smallNote}>인증 완료</p> : null}
          </div>
          ) : null}

          <div className={styles.twoCol}>
            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="pw">
                비밀번호
              </label>
              <div className={styles.pwRow}>
                <input
                  id="pw"
                  type={showPassword ? 'text' : 'password'}
                  className="owner-input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowPassword((p) => !p)}>
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} style={{ fontSize: '1.1rem' }} />
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <label className="owner-input-label" htmlFor="pw2">
                비밀번호 확인
              </label>
              <div className={styles.pwRow}>
                <input
                  id="pw2"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  className="owner-input-field"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowPasswordConfirm((p) => !p)}>
                  <Icon name={showPasswordConfirm ? 'visibility_off' : 'visibility'} style={{ fontSize: '1.1rem' }} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="owner-btn-primary" disabled={loading}>
            {loading ? '처리 중…' : '회원가입 완료'}
          </button>

          <p className={styles.smallNote}>
            가입 시 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </form>
      </div>

      <ConfirmModal
        open={sendConfirmOpen}
        title={verifyChannel === 'EMAIL' ? '인증 메일 발송' : '인증 문자 발송'}
        message={sendConfirmMessage}
        cancelLabel="취소"
        confirmLabel="발송"
        onCancel={() => setSendConfirmOpen(false)}
        onConfirm={() => {
          setSendConfirmOpen(false)
          void handleSendCode()
        }}
      />

      <SimpleAlertModal open={Boolean(error)} title="회원가입" message={error ?? ''} onClose={() => setError(null)} variant="info" />
    </div>
  )
}


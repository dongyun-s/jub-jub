/**
 * [삭제용] 출석 랜덤박스 UI 확인 버튼
 * — 배포 전 삭제: 이 파일 + MyPage.tsx 의 import·<AttendanceRandomBoxPreviewButton /> 한 블록
 */
import { fetchMyCoupons } from '../../api/rewards'
import type { AttendanceBoxPrize } from '../../lib/attendanceRandomBox'
import styles from './AttendanceRandomBoxPreviewButton.module.css'

export interface RandomBoxPreviewOptions {
  couponIdsBefore: Set<number>
  mockPrize?: AttendanceBoxPrize
}

interface AttendanceRandomBoxPreviewButtonProps {
  onPreview: (options: RandomBoxPreviewOptions) => void
}

const MOCK_CYCLE: AttendanceBoxPrize[] = ['1000', '100', 'NONE']

export default function AttendanceRandomBoxPreviewButton({
  onPreview,
}: AttendanceRandomBoxPreviewButtonProps) {
  const openWithServer = () => {
    void (async () => {
      const couponIdsBefore = new Set<number>()
      try {
        const coupons = await fetchMyCoupons()
        coupons.forEach((c) => couponIdsBefore.add(c.memberCouponId))
      } catch {
        /* 미리보기는 쿠폰 조회 실패해도 UI만 확인 */
      }
      onPreview({ couponIdsBefore })
    })()
  }

  const openWithMock = (prize: AttendanceBoxPrize) => {
    onPreview({ couponIdsBefore: new Set(), mockPrize: prize })
  }

  const openNextMock = () => {
    const key = 'jubjub_random_box_preview_cycle'
    const prev = Number(sessionStorage.getItem(key) || '0')
    const next = (prev + 1) % MOCK_CYCLE.length
    sessionStorage.setItem(key, String(next))
    openWithMock(MOCK_CYCLE[next]!)
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.tag}>[개발용 · 삭제 가능]</p>
      <button type="button" className={styles.mainBtn} onClick={openNextMock}>
        랜덤박스 UI 미리보기
      </button>
      <div className={styles.subRow}>
        <button type="button" className={styles.subBtn} onClick={openWithServer}>
          서버 당첨 확인
        </button>
        <button type="button" className={styles.subBtn} onClick={() => openWithMock('1000')}>
          1000원
        </button>
        <button type="button" className={styles.subBtn} onClick={() => openWithMock('100')}>
          100원
        </button>
        <button type="button" className={styles.subBtn} onClick={() => openWithMock('NONE')}>
          꽝
        </button>
      </div>
    </div>
  )
}

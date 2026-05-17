import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import styles from './PaymentsPage.module.css'

export function PaymentsPage() {
  return (
    <>
      <OwnerHeader title="결제내역" subtitle="정산 · 입금 (플레이스홀더)" />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <Icon name="payments" className={styles.icon} />
          </div>
          <h2 className={styles.title}>정산 계좌 · 납부 등록</h2>
          <p className={styles.desc}>
            유저 플로우상 &quot;계좌 유효성 확인 → 납부 등록&quot; 단계를 이 화면에서 다룰 수 있습니다.
            <br />
            현재는 디자인 스켈레톤만 두었습니다.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost}>
              정산 계좌 등록
            </button>
            <button type="button" className={styles.btnPrimary}>
              납부 등록 (데모)
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

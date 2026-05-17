import { OwnerHeader } from '../../components/OwnerHeader'
import { Icon } from '../../components/Icon'
import styles from './ReviewsPage.module.css'

export function ReviewsPage() {
  return (
    <>
      <OwnerHeader
        title="리뷰관리"
        right={
          <div className={styles.headerUser}>
            <div className={styles.headerUserText}>
              <p className={styles.headerName}>Manager Kim</p>
              <p className={styles.headerRole}>Store Admin</p>
            </div>
            <img
              alt=""
              className={styles.headerAvatar}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeiZSUzn3ppweHgz83qE4qGohVN4PShLzGDcevIL4fqzfZD91u5F0mDLxiD3ubtd9ZME6Ezlki_Cc-vOT1wP1UlBiD7XHwldpydINhXu1TH1QLkOHD5Mgmp3MvQUCrVKQDNxFUNJXd9zIpTraLGHcNoGsScihQk9VyAmASIVn5xgfX0zU7uAqKQjcUqP071HrTfPzSSW1us1NkAycO1Ag1Xa7QPlJzujdnUFjCgE3x_4ducvaFvyeUNlGjZmrMVVi_oqaDA0x5X8XF"
            />
          </div>
        }
      />
      <main className={styles.main}>
        <aside className={styles.summary}>
          <div className={styles.summaryHead}>
            <h2 className={styles.summaryKicker}>Review Summary</h2>
            <h3 className={styles.summaryTitle}>리뷰 요약</h3>
          </div>
          <div className={styles.scoreCard}>
            <div className={styles.scoreBig}>4.8</div>
            <div className={styles.stars}>
              {[1, 2, 3, 4].map((i) => (
                <Icon key={i} name="star" filled />
              ))}
              <Icon name="star_half" filled />
            </div>
            <p className={styles.scoreMeta}>총 1,248개의 리뷰 기준</p>
          </div>
          <div className={styles.bars}>
            {[
              { s: 5, w: '82%' },
              { s: 4, w: '12%' },
              { s: 3, w: '4%' },
              { s: 2, w: '1%' },
              { s: 1, w: '1%' },
            ].map((r) => (
              <div key={r.s} className={styles.barRow}>
                <span className={styles.barLabel}>{r.s}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: r.w }} />
                </div>
                <span className={styles.barPct}>{r.w}</span>
              </div>
            ))}
          </div>
          <div className={styles.insight}>
            <p className={styles.insightKicker}>이번 주 인사이트</p>
            <p className={styles.insightBody}>
              긍정 키워드 &quot;맛의 깊이&quot;, &quot;신속한 배달&quot;이 증가했습니다. 답글 작성 속도를 유지해 주세요.
            </p>
          </div>
        </aside>

        <section className={styles.listSection}>
          <div className={styles.toolbar}>
            <div className={styles.filterBtns}>
              <button type="button" className={styles.filterActive}>
                전체 리뷰
              </button>
              <button type="button" className={styles.filterIdle}>
                미답변
              </button>
              <button type="button" className={styles.filterIdle}>
                포토 리뷰
              </button>
            </div>
            <div className={styles.sort}>
              <Icon name="filter_list" style={{ fontSize: '0.875rem' }} />
              <span>최신순</span>
            </div>
          </div>

          <div className={styles.scroll}>
            <article className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                <div className={styles.reviewAuthor}>
                  <div className={styles.avatarPlaceholder} />
                  <div>
                    <h4 className={styles.authorName}>
                      김민지 <span className={styles.badge}>Verified</span>
                    </h4>
                    <div className={styles.metaRow}>
                      <div className={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Icon key={i} name="star" filled />
                        ))}
                      </div>
                      <span className={styles.date}>24.05.20 14:30</span>
                    </div>
                  </div>
                </div>
                <Icon name="more_vert" className={styles.moreBtn} />
              </div>
              <div className={styles.reviewBodyWrap}>
                <p className={styles.reviewText}>
                  스테이크 샐러드 정말 맛있었어요! 고기가 부드럽고 야채도 신선했습니다.
                </p>
                <div className={styles.replyRow}>
                  <button type="button" className={styles.btnReply}>
                    <Icon name="reply" style={{ fontSize: '0.875rem' }} />
                    답글 달기
                  </button>
                </div>
              </div>
            </article>

            <article className={`${styles.reviewCard} ${styles.reviewCardNew}`}>
              <div className={styles.reviewTop}>
                <div className={styles.reviewAuthor}>
                  <div className={styles.avatarPlaceholder} />
                  <div>
                    <h4 className={styles.authorName}>박정훈</h4>
                    <div className={styles.metaRow}>
                      <div className={styles.starRow}>
                        {[1, 2, 3, 4].map((i) => (
                          <Icon key={i} name="star" filled />
                        ))}
                        <Icon name="star" />
                      </div>
                      <span className={styles.date}>24.05.19 19:12</span>
                    </div>
                  </div>
                </div>
                <span className={styles.newPill}>NEW</span>
              </div>
              <div className={styles.reviewBodyWrap}>
                <p className={`${styles.reviewText} ${styles.italic}`}>
                  배달이 예상보다 일찍 왔어요. 따뜻하게 먹을 수 있어서 좋았습니다.
                </p>
                <div className={styles.replyRow}>
                  <button type="button" className={styles.btnReply}>
                    <Icon name="reply" style={{ fontSize: '0.875rem' }} />
                    답글 달기
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <button type="button" className={styles.fab} title="빠른 답글">
        <Icon name="auto_awesome" style={{ fontSize: '1.875rem' }} />
      </button>
    </>
  )
}

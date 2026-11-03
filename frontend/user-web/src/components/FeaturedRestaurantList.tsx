import type { FeaturedRestaurant } from '../constants'
import styles from '../pages/home/HomePage.module.css'

/** 카드 우측 배지 — 카테고리명 (거리·픽업 시간은 메타 줄에 표시) */
function restaurantCategoryBadge(item: FeaturedRestaurant): string | null {
  return (
    item.hashtags
      .map((h) => (h.startsWith('#') ? h.slice(1) : h))
      .find((name) => name && name !== '줍줍') ?? null
  )
}

interface FeaturedRestaurantListProps {
  restaurants: FeaturedRestaurant[]
  onCardClick?: (id: number) => void
}

function FeaturedRestaurantList({ restaurants, onCardClick }: FeaturedRestaurantListProps) {
  return (
    <div className={styles.restaurantList}>
      {restaurants.map((item) => {
        const categoryBadge = restaurantCategoryBadge(item)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onCardClick?.(item.id)}
            className={styles.restaurantCard}
          >
            <div className={styles.restaurantImageWrapper}>
              <img
                src={item.image}
                alt={item.title}
                className={styles.restaurantImage}
                onError={(e) => {
                  if (e.currentTarget.src.endsWith('/logo.png')) return
                  e.currentTarget.src = '/logo.png'
                }}
              />
              <div className={styles.restaurantImageOverlay} />
              <div className={styles.restaurantTags}>
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      tag === '핫 미션'
                        ? 'bg-gradient-to-r from-primary to-pink-400 text-white'
                        : tag === '신규 퀘스트'
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                          : 'bg-white/95 text-primary backdrop-blur-sm'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-xs font-bold text-gray-800">
                  {item.reviews > 0 || item.rating > 0 ? item.rating.toFixed(1) : '—'}
                </span>
                {item.reviews > 0 ? (
                  <span className="text-[10px] text-gray-400">({item.reviews.toLocaleString()})</span>
                ) : null}
              </div>
            </div>
            <div className={styles.restaurantCardBody}>
              <div className={styles.restaurantTitleRow}>
                <div>
                  <h3 className={styles.restaurantTitle}>{item.title}</h3>
                  <p className={styles.restaurantMeta}>
                    {item.delivery}
                    {item.minOrder ? ` · ${item.minOrder}` : ''}
                  </p>
                </div>
                {categoryBadge ? (
                  <span className={styles.restaurantBadgeChip}>{categoryBadge}</span>
                ) : null}
              </div>
              <div className={styles.restaurantHashtags}>
                {item.hashtags.map((tag, idx) => (
                  <span key={idx} className={styles.restaurantHashtag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default FeaturedRestaurantList

import type { FEATURED_RESTAURANTS } from '../constants/categories'
import styles from '../pages/home/HomePage.module.css'

type FeaturedRestaurant = (typeof FEATURED_RESTAURANTS)[number]

interface FeaturedRestaurantListProps {
  restaurants: FeaturedRestaurant[]
  onCardClick?: (id: number) => void
}

function FeaturedRestaurantList({ restaurants, onCardClick }: FeaturedRestaurantListProps) {
  return (
    <div className={styles.restaurantList}>
      {restaurants.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onCardClick?.(item.id)}
          className={styles.restaurantCard}
        >
          <div className={styles.restaurantImageWrapper}>
            <img src={item.image} alt={item.title} className={styles.restaurantImage} />
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
              <span className="text-xs font-bold text-gray-800">{item.rating}</span>
              <span className="text-[10px] text-gray-400">({item.reviews.toLocaleString()})</span>
            </div>
          </div>
          <div className={styles.restaurantCardBody}>
            <div className={styles.restaurantTitleRow}>
              <div>
                <h3 className={styles.restaurantTitle}>{item.title}</h3>
                <p className={styles.restaurantMeta}>
                  {item.delivery} • {item.minOrder}
                </p>
              </div>
              <span className={styles.restaurantPointChip}>포인트 {item.points}</span>
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
      ))}
    </div>
  )
}

export default FeaturedRestaurantList


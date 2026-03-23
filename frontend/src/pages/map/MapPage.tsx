/**
 * MapPage.tsx
 * 지도 페이지 (탭: 지도)
 * - 진행 중 주문 있으면: 픽업 목적지·경로·이동 수단(도보/자전거/차)
 * - 없으면: 주변 매장 목록·거리·픽업 예상 시간
 */

import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import styles from './MapPage.module.css'

interface MapPageProps {
  onBack?: () => void
  onGoHome?: () => void
  onCartClick?: () => void
  onOrdersClick?: () => void
  onOrderStatusClick?: () => void
  onStoreClick?: () => void
  onMypageClick?: () => void
  onFavoritesClick?: () => void
  /** true면 픽업 경로 뷰, false면 주변 매장 리스트 */
  hasActiveOrder?: boolean
  cartCount?: number
}

interface Location {
  lat: number
  lng: number
}

/** 주변 매장 목록 (데모) */
const nearbyStores = [
  {
    id: 1,
    name: '바삭카츠 강남점',
    category: '돈카츠',
    distance: '180m',
    rating: 4.8,
    pickupTime: '15-20분',
    image: 'https://images.unsplash.com/photo-1554306274-f23873500f28?w=200&h=200&fit=crop',
    lat: 37.4979,
    lng: 127.0276,
  },
  {
    id: 2,
    name: '맘스터치 역삼점',
    category: '버거',
    distance: '250m',
    rating: 4.5,
    pickupTime: '10-15분',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    lat: 37.4985,
    lng: 127.0285,
  },
  {
    id: 3,
    name: '스타벅스 테헤란로점',
    category: '카페',
    distance: '320m',
    rating: 4.7,
    pickupTime: '5-10분',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
    lat: 37.4990,
    lng: 127.0290,
  },
]

/** 진행 중 주문의 픽업 매장 정보 (hasActiveOrder 시 사용) */
const destinationData = {
  storeName: '바삭카츠 강남점',
  storeImage: 'https://images.unsplash.com/photo-1554306274-f23873500f28?w=200&h=200&fit=crop',
  storeAddress: '서울 강남구 테헤란로 123',
  lat: 37.4979,
  lng: 127.0276,
}

function MapPage({ onBack: _onBack, onGoHome, onCartClick, onOrdersClick, onOrderStatusClick, onStoreClick, onMypageClick, onFavoritesClick, hasActiveOrder, cartCount = 0 }: MapPageProps) {
  const [transportMode, setTransportMode] = useState<'walk' | 'bike' | 'car'>('walk')
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [distance, setDistance] = useState('--')
  const [walkTime, setWalkTime] = useState('--')
  const [mapUrl, setMapUrl] = useState('')

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    console.log('[MapPage] 위치 가져오기 시작')
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      console.log('[MapPage] Geolocation API 지원 안됨')
      setLocationError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('[MapPage] 위치 가져오기 성공:', latitude, longitude)
        setCurrentLocation({ lat: latitude, lng: longitude })
        setIsLoadingLocation(false)
        
        // 거리 및 시간 계산 (간단한 직선거리 계산)
        const dist = calculateDistance(latitude, longitude, destinationData.lat, destinationData.lng)
        console.log('[MapPage] 목적지까지 거리:', dist, 'm')
        setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
        
        // 도보 시간 계산 (평균 보행 속도: 분당 80m)
        const walkMinutes = Math.round(dist / 80)
        setWalkTime(`도보 ${walkMinutes}분`)

        // 지도 URL 업데이트
        updateMapUrl(latitude, longitude)
      },
      (error) => {
        console.log('[MapPage] 위치 가져오기 실패:', error.code, error.message)
        setIsLoadingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다. 다시 시도해주세요.')
            break
          default:
            setLocationError('위치를 가져올 수 없습니다.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    )
  }

  // 두 좌표 사이의 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // 지도 URL 업데이트 (OpenStreetMap - 현재 위치와 목적지 둘 다 보이도록)
  const updateMapUrl = (lat: number, lng: number) => {
    const minLat = Math.min(lat, destinationData.lat)
    const maxLat = Math.max(lat, destinationData.lat)
    const minLng = Math.min(lng, destinationData.lng)
    const maxLng = Math.max(lng, destinationData.lng)
    const padding = 0.005
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - padding},${minLat - padding},${maxLng + padding},${maxLat + padding}&layer=mapnik&marker=${lat},${lng}`
    setMapUrl(url)
  }

  // 외부 네비게이션 앱 열기
  const openNavigation = () => {
    const destination = `${destinationData.lat},${destinationData.lng}`
    
    // 이동 수단에 따른 모드 설정
    let mode = 'walking'
    if (transportMode === 'bike') mode = 'bicycling'
    if (transportMode === 'car') mode = 'driving'

    // 현재 위치가 있으면 출발지도 설정
    let url = ''
    if (currentLocation) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}&travelmode=${mode}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`
    }

    window.open(url, '_blank')
  }

  // 컴포넌트 마운트 시 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation()
  }, [])

  // 현재 위치 변경 시 주변 매장 거리 업데이트
  const getDistanceText = (storeLat: number, storeLng: number): string => {
    if (!currentLocation) return '--'
    const dist = calculateDistance(currentLocation.lat, currentLocation.lng, storeLat, storeLng)
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`
  }

  // 도보 시간 계산
  const getWalkTimeText = (storeLat: number, storeLng: number): string => {
    if (!currentLocation) return '--'
    const dist = calculateDistance(currentLocation.lat, currentLocation.lng, storeLat, storeLng)
    const minutes = Math.round(dist / 80)
    return `${minutes}분`
  }

  return (
    <Layout showBackground={false}>
      <div className={styles.root}>
        {hasActiveOrder ? (
          <>
            <Header title="픽업 경로 안내" onFavoriteClick={onFavoritesClick} />

            <div className={styles.transportRow}>
              <button
                onClick={() => setTransportMode('walk')}
                className={`${styles.transportTab} ${transportMode === 'walk' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                도보
              </button>
              <button
                onClick={() => setTransportMode('bike')}
                className={`${styles.transportTab} ${transportMode === 'bike' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                자전거
              </button>
              <button
                onClick={() => setTransportMode('car')}
                className={`${styles.transportTab} ${transportMode === 'car' ? styles.transportTabActive : styles.transportTabInactive}`}
              >
                자동차
              </button>
            </div>

            <div className={styles.searchBarWrap}>
              <div className={styles.searchBar}>
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                <span className={styles.searchLabel}>{destinationData.storeName}</span>
              </div>
            </div>

            <div className={styles.mapWrap}>
              <iframe
                src={mapUrl || `https://www.openstreetmap.org/export/embed.html?bbox=${destinationData.lng - 0.008},${destinationData.lat - 0.005},${destinationData.lng + 0.008},${destinationData.lat + 0.005}&layer=mapnik&marker=${destinationData.lat},${destinationData.lng}`}
                width="100%"
                height="100%"
                className={styles.mapIframe}
                style={{ border: 0 }}
                title="지도"
              />
              <button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className={styles.locationButton}
              >
                {isLoadingLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIconLoading}`}>sync</span>
                ) : (
                  <span className={`material-symbols-outlined ${styles.locationIcon}`}>my_location</span>
                )}
              </button>

              <div className={styles.zoomGroup}>
                <button type="button" className={styles.zoomButton}>
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>add</span>
                </button>
                <button type="button" className={styles.zoomButton}>
                  <span className={`material-symbols-outlined ${styles.zoomIcon}`}>remove</span>
                </button>
              </div>

              {locationError && (
                <div className={styles.locationError}>
                  <p className={styles.locationErrorText}>{locationError}</p>
                </div>
              )}

              <div className={styles.bottomCard}>
                <div className={styles.destCard}>
                  <div className={styles.destCardHeader}>
                    <img
                      src={destinationData.storeImage}
                      alt={destinationData.storeName}
                      className={styles.destImage}
                    />
                    <div className={styles.destInfo}>
                      <h3 className={styles.destTime}>{walkTime}</h3>
                      <p className={styles.destMeta}>
                        {distance} • {currentLocation ? '현재 위치 기준' : '위치 확인 중...'}
                      </p>
                    </div>
                    {currentLocation && (
                      <div className={styles.locationOk}>
                        <span className={`material-symbols-outlined ${styles.locationOkIcon}`}>check_circle</span>
                        <span className={styles.locationOkText}>위치 확인됨</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.destActions}>
                    <button onClick={onOrderStatusClick} className={`${styles.destActionBtn} ${styles.destActionSecondary}`}>
                      <span className={`material-symbols-outlined ${styles.destActionIcon}`}>store</span>
                      매장 정보
                    </button>
                    <button onClick={openNavigation} className={`${styles.destActionBtn} ${styles.destActionPrimary}`}>
                      <span className={`material-symbols-outlined ${styles.destActionIcon}`}>navigation</span>
                      길찾기 시작
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <Header title="주변 매장" onFavoriteClick={onFavoritesClick} />

            <div className={styles.searchBarWrap}>
              <div className={styles.searchBar}>
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                <input
                  type="text"
                  placeholder="장소, 매장 검색"
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.mapWrap}>
              {currentLocation ? (
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.lng - 0.008},${currentLocation.lat - 0.005},${currentLocation.lng + 0.008},${currentLocation.lat + 0.005}&layer=mapnik&marker=${currentLocation.lat},${currentLocation.lng}`}
                  width="100%"
                  height="100%"
                  className={styles.mapIframe}
                  style={{ border: 0 }}
                  title="지도"
                />
              ) : (
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${127.0276 - 0.008},${37.4979 - 0.005},${127.0276 + 0.008},${37.4979 + 0.005}&layer=mapnik&marker=37.4979,127.0276`}
                  width="100%"
                  height="100%"
                  className={styles.mapIframe}
                  style={{ border: 0 }}
                  title="지도"
                />
              )}

              <button
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className={styles.locationButton}
              >
                {isLoadingLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIconLoading}`}>sync</span>
                ) : currentLocation ? (
                  <span className={`material-symbols-outlined ${styles.locationIcon}`}>my_location</span>
                ) : (
                  <span className={`material-symbols-outlined ${styles.locationIconMuted}`}>my_location</span>
                )}
              </button>

              {locationError && (
                <div className={styles.locationError}>
                  <p className={styles.locationErrorText}>{locationError}</p>
                </div>
              )}

              <div className={styles.bottomCard}>
                <div className={styles.storesPanel}>
                  <div className={styles.storesPanelHeader}>
                    <div className={styles.storesPanelHeaderInner}>
                      <div className={styles.storesPanelTitleRow}>
                        <span className={`material-symbols-outlined ${styles.storesPanelIcon}`}>takeout_dining</span>
                        <span className={styles.storesPanelTitle}>내 주변 포장 맛집</span>
                        {currentLocation && (
                          <span className={styles.locationBadge}>
                            <span className={`material-symbols-outlined ${styles.locationBadgeIcon}`}>check_circle</span>
                            위치 확인됨
                          </span>
                        )}
                        {isLoadingLocation && (
                          <span className={styles.loadingBadge}>
                            <span className={`material-symbols-outlined ${styles.loadingBadgeIcon}`}>sync</span>
                            위치 확인 중
                          </span>
                        )}
                      </div>
                      <button type="button" className={styles.moreLink}>더보기</button>
                    </div>
                  </div>
                  <div className={styles.storesList}>
                    {nearbyStores.map((store) => (
                      <button
                        key={store.id}
                        onClick={onStoreClick}
                        className={styles.storeRow}
                      >
                        <img src={store.image} alt={store.name} className={styles.storeRowImage} />
                        <div className={styles.storeRowInfo}>
                          <h3 className={styles.storeRowName}>{store.name}</h3>
                          <div className={styles.storeRowMeta}>
                            <span className={styles.storeRowStar}>
                              <span className={`material-symbols-outlined ${styles.starIcon}`}>star</span>
                              {store.rating}
                            </span>
                            <span className={styles.storeRowDot}>•</span>
                            <span className={styles.storeRowDistance}>
                              {currentLocation ? getDistanceText(store.lat, store.lng) : store.distance}
                            </span>
                            <span className={styles.storeRowDot}>•</span>
                            <span className={styles.storeRowTime}>
                              도보 {currentLocation ? getWalkTimeText(store.lat, store.lng) : store.pickupTime}
                            </span>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined ${styles.storeRowChevron}`}>chevron_right</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 하단 네비게이션 */}
        <BottomNav 
          active="map" 
          cartCount={cartCount}
          onNavigate={(page) => {
            if (page === 'home') onGoHome?.()
            if (page === 'orders') onOrdersClick?.()
            if (page === 'cart') onCartClick?.()
            if (page === 'mypage') onMypageClick?.()
          }}
        />
      </div>
    </Layout>
  )
}

export default MapPage

import styles from '../pages/home/HomePage.module.css'

interface SearchBarProps {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  onSubmit?: () => void
}

function SearchBar({ value, placeholder, onChange, onSubmit }: SearchBarProps) {
  return (
    <div className={styles.searchSection}>
      <div className={styles.searchBar}>
        <span className="material-symbols-outlined text-primary">search</span>
        <input
          type="text"
          placeholder={placeholder ?? '공략할 맛집 던전을 검색하세요!'}
          className={styles.searchInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit?.()
            }
          }}
        />
      </div>
    </div>
  )
}

export default SearchBar


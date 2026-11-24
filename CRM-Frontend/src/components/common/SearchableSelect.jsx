import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

const normalizeSearchText = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const buildUniqueSelectOptions = (items = [], selector) => {
  const seen = new Set()
  const values = []

  for (const item of items) {
    const raw = typeof selector === 'function' ? selector(item) : item?.[selector]
    const trimmed = typeof raw === 'string' ? raw.trim() : ''
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    values.push(trimmed)
  }

  return values
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .map((val) => ({ value: val, label: val }))
}

/**
 * Dropdown com campo de pesquisa em tempo real, suporte a seleção única ou múltipla,
 * fechamento por click outside e navegação por teclado.
 *
 * Props:
 * - label: string (rótulo do campo)
 * - options: Array<{ value: string|number, label: string, subtitle?: string }>
 * - value: string | number | Array<string|number>
 * - onChange: (nextValue) => void
 * - multiple?: boolean (padrão false)
 * - placeholder?: string
 * - searchPlaceholder?: string
 * - emptyValue?: string | number (valor retornado ao limpar seleção única, padrão '')
 * - clearable?: boolean (padrão true)
 * - required?: boolean
 * - disabled?: boolean
 * - error?: string
 * - compact?: boolean
 * - className?: string
 */
function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  emptyValue = '',
  clearable = true,
  required = false,
  disabled = false,
  error = '',
  compact = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const searchInputRef = useRef(null)
  const optionRefs = useRef([])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    } else if (!isOpen) {
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  const normalizedSearch = normalizeSearchText(searchTerm.trim())

  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) return options
    return options.filter((option) => {
      const labelMatch = normalizeSearchText(option.label).includes(normalizedSearch)
      const subMatch = normalizeSearchText(option.subtitle).includes(normalizedSearch)
      return labelMatch || subMatch
    })
  }, [options, normalizedSearch])

  useEffect(() => {
    if (!isOpen) return
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
  }, [isOpen, normalizedSearch, filteredOptions.length])

  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const isEmptySingleValue = (val) =>
    val === undefined || val === null || val === '' || String(val) === String(emptyValue)

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : []).map(String)
    : !isEmptySingleValue(value)
      ? [String(value)]
      : []

  const handleSelectOption = (optionValue) => {
    const strVal = String(optionValue)
    if (multiple) {
      const currentList = Array.isArray(value) ? value : []
      const exists = currentList.some((v) => String(v) === strVal)
      const nextList = exists
        ? currentList.filter((v) => String(v) !== strVal)
        : [...currentList, optionValue]
      onChange(nextList)
    } else {
      onChange(optionValue)
      setIsOpen(false)
    }
  }

  const handleRemoveItem = (e, optionValue) => {
    e.stopPropagation()
    if (disabled) return
    if (multiple) {
      const currentList = Array.isArray(value) ? value : []
      onChange(currentList.filter((v) => String(v) !== String(optionValue)))
    } else {
      onChange(emptyValue)
    }
  }

  const handleClearAll = (e) => {
    e.stopPropagation()
    if (disabled) return
    onChange(multiple ? [] : emptyValue)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'Tab') {
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredOptions.length === 0) return
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredOptions.length === 0) return
      setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetOption =
        highlightedIndex >= 0 ? filteredOptions[highlightedIndex] : filteredOptions[0]
      if (targetOption) {
        handleSelectOption(targetOption.value)
      }
    }
  }

  const selectedItems = useMemo(
    () => options.filter((opt) => selectedValues.includes(String(opt.value))),
    [options, selectedValues]
  )

  return (
    <div
      className={`inputGroup searchableSelectContainer${compact ? ' compact' : ''}${
        className ? ` ${className}` : ''
      }`}
      ref={containerRef}
    >
      {label && (
        <span className="searchableSelectLabel">
          {label} {required && <span className="searchableSelectRequired">*</span>}
        </span>
      )}

      <div
        ref={triggerRef}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className={`searchableSelectTrigger ${isOpen ? 'focused' : ''} ${
          disabled ? 'disabled' : ''
        } ${error ? 'error' : ''}`}
      >
        <div className="searchableSelectValueArea">
          {multiple ? (
            selectedItems.length > 0 ? (
              <div className="searchableSelectChips">
                {selectedItems.map((item) => (
                  <span key={item.value} className="searchableSelectChip">
                    <span className="chipText">{item.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        aria-label={`Remover ${item.label}`}
                        onClick={(e) => handleRemoveItem(e, item.value)}
                        className="chipRemoveBtn"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <span className="searchableSelectPlaceholder">{placeholder}</span>
            )
          ) : selectedItems.length > 0 ? (
            <span className="searchableSelectSingleValue" title={selectedItems[0].label}>
              {selectedItems[0].label}
            </span>
          ) : (
            <span className="searchableSelectPlaceholder">{placeholder}</span>
          )}
        </div>

        <div className="searchableSelectControls">
          {clearable && selectedItems.length > 0 && !disabled && (
            <button
              type="button"
              className="searchableSelectClearBtn"
              aria-label="Limpar seleção"
              onClick={handleClearAll}
            >
              <X size={15} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`searchableSelectArrow ${isOpen ? 'open' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="searchableSelectDropdown">
          <div className="searchableSelectSearchWrapper">
            <Search size={16} className="searchIcon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchableSelectSearchInput"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleSearchKeyDown}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchableSelectClearSearch"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchTerm('')
                  searchInputRef.current?.focus()
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="searchableSelectList" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="searchableSelectNoResults">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selectedValues.includes(String(opt.value))
                const isHighlighted = index === highlightedIndex
                return (
                  <div
                    key={opt.value}
                    ref={(el) => {
                      optionRefs.current[index] = el
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectOption(opt.value)
                    }}
                    className={`searchableSelectOption${isSelected ? ' selected' : ''}${
                      isHighlighted ? ' highlighted' : ''
                    }`}
                  >
                    <div className="optionTextCol">
                      <span className="optionLabel">{opt.label}</span>
                      {opt.subtitle && (
                        <span className="optionSubtitle">{opt.subtitle}</span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="optionCheckIcon" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && <span className="searchableSelectError">{error}</span>}
    </div>
  )
}

export default SearchableSelect

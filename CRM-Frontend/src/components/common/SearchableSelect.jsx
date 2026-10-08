import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

/**
 * Dropdown com campo de pesquisa em tempo real, suporte a seleção única ou múltipla,
 * fechamento por click outside e teclado.
 *
 * Props:
 * - label: string (rótulo do campo)
 * - options: Array<{ value: string|number, label: string, subtitle?: string }>
 * - value: string | number | Array<string|number>
 * - onChange: (nextValue) => void
 * - multiple?: boolean (padrão false)
 * - placeholder?: string
 * - searchPlaceholder?: string
 * - required?: boolean
 * - error?: string
 */
function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  multiple = false,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  required = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Fecha ao clicar fora
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

  // Foco no input de busca ao abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    } else if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const filteredOptions = options.filter((option) => {
    const labelMatch = (option.label ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const subMatch = (option.subtitle ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    return labelMatch || subMatch
  })

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : []).map(String)
    : value !== undefined && value !== null && value !== ''
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
    if (multiple) {
      const currentList = Array.isArray(value) ? value : []
      onChange(currentList.filter((v) => String(v) !== String(optionValue)))
    } else {
      onChange('')
    }
  }

  const getSelectedLabels = () => {
    return options.filter((opt) => selectedValues.includes(String(opt.value)))
  }

  const selectedItems = getSelectedLabels()

  return (
    <div className="inputGroup searchableSelectContainer" ref={containerRef}>
      {label && (
        <span className="searchableSelectLabel">
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </span>
      )}

      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className={`searchableSelectTrigger ${isOpen ? 'focused' : ''} ${
          disabled ? 'disabled' : ''
        }`}
      >
        <div className="searchableSelectValueArea">
          {multiple ? (
            selectedItems.length > 0 ? (
              <div className="searchableSelectChips">
                {selectedItems.map((item) => (
                  <span key={item.value} className="searchableSelectChip">
                    <span className="chipText">{item.label}</span>
                    <button
                      type="button"
                      aria-label={`Remover ${item.label}`}
                      onClick={(e) => handleRemoveItem(e, item.value)}
                      className="chipRemoveBtn"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="searchableSelectPlaceholder">{placeholder}</span>
            )
          ) : selectedItems.length > 0 ? (
            <span className="searchableSelectSingleValue">{selectedItems[0].label}</span>
          ) : (
            <span className="searchableSelectPlaceholder">{placeholder}</span>
          )}
        </div>

        <div className="searchableSelectControls">
          {!multiple && selectedItems.length > 0 && !disabled && (
            <button
              type="button"
              className="searchableSelectClearBtn"
              aria-label="Limpar seleção"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false)
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchableSelectClearSearch"
                onClick={() => setSearchTerm('')}
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
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(String(opt.value))
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectOption(opt.value)
                    }}
                    className={`searchableSelectOption ${isSelected ? 'selected' : ''}`}
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
    </div>
  )
}

export default SearchableSelect

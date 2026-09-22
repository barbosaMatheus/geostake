import { useEffect, useRef } from 'react'

interface HelpOverlayProps {
  open: boolean
  onClose: () => void
}

function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="help-overlay" onClick={onClose}>
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="help-title" className="help-title">
          How to Play GeoStake
        </h2>
        <ul className="help-list">
          <li>Identify the mystery country by guessing its name.</li>
          <li>Each turn begins with one free clue.</li>
          <li>Buy additional clues with geodes.</li>
          <li>You start with 1000 geodes.</li>
          <li>You start with 3 lives.</li>
          <li>An incorrect guess costs a life.</li>
          <li>Buy extra lives when you are running low.</li>
          <li>Running out of lives ends the game.</li>
          <li>Purchasing skips will be available in a future update.</li>
        </ul>
        <button
          ref={closeButtonRef}
          className="button-primary"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default HelpOverlay
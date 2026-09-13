interface SettingsScreenProps {
  onBack: () => void
}

function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="app settings-screen">
      <header>
        <h1>Settings</h1>
      </header>

      <p className="settings-note">
        Settings such as difficulty, themes, and statistics will be added in a
        future update.
      </p>

      <button className="button-secondary" type="button" onClick={onBack}>
        Back to Landing
      </button>
    </div>
  )
}

export default SettingsScreen

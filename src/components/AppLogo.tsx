function AppLogo() {
  return (
    <img
      className="app-logo"
      src={`${import.meta.env.BASE_URL}icons/geostake-192.png`}
      alt=""
      width={192}
      height={192}
    />
  )
}

export default AppLogo

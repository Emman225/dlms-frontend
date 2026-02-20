/*
 * Set Theme (dark mode + color theme)
 */

const lHtml = document.documentElement
const rememberDarkMode = !lHtml.classList.contains('dark-custom-defined')
const rememberTheme = lHtml.classList.contains('remember-theme')

if (rememberDarkMode) {
  const darkModePreference = localStorage.getItem('oneuiDarkMode')
  if (darkModePreference === 'on') {
    lHtml.classList.add('dark')
  } else if (darkModePreference === 'off') {
    lHtml.classList.remove('dark')
  } else if (darkModePreference === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      lHtml.classList.add('dark')
    } else {
      lHtml.classList.remove('dark')
    }
  }
}

if (rememberTheme) {
  const colorTheme = localStorage.getItem('oneuiColorTheme')
  if (colorTheme) {
    const themeEl = document.getElementById('css-theme') as HTMLLinkElement | null
    if (themeEl && colorTheme === 'default') {
      themeEl.parentNode?.removeChild(themeEl)
    } else {
      if (themeEl) {
        themeEl.setAttribute('href', colorTheme)
      } else {
        const themeLink = document.createElement('link')
        themeLink.id = 'css-theme'
        themeLink.setAttribute('rel', 'stylesheet')
        themeLink.setAttribute('href', colorTheme)
        document.getElementById('css-main')?.insertAdjacentElement('afterend', themeLink)
      }
    }
  }
}

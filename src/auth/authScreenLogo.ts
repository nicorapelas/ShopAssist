const AUTH_LOGO_COSMIC = require('../../assets/images/LogoCosmic.png')

export function authScreenLogoSource() {
  return AUTH_LOGO_COSMIC
}

export function authScreenLogoSize(compact: boolean) {
  return compact ? { width: 96, height: 122 } : { width: 148, height: 188 }
}

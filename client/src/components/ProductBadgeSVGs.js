// Product badge SVG icons — download individually or use as React components
// Badge IDs match the tag values stored in product.tags (e.g. "badge:bestseller")

export const BestsellerBadgeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" width="120" height="32">
    <polygon points="0,0 113,0 120,16 113,32 0,32" fill="#166454"/>
    <text x="10" y="12" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#fff">⭐</text>
    <text x="24" y="20" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#fff">BESTSELLER</text>
  </svg>
);

export const NewArrivalBadgeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" width="120" height="32">
    <polygon points="0,0 113,0 120,16 113,32 0,32" fill="#1d4ed8"/>
    <text x="10" y="12" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#fff">✨</text>
    <text x="24" y="20" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#fff">NEW ARRIVAL</text>
  </svg>
);

export const OnSaleBadgeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 32" width="100" height="32">
    <polygon points="0,0 93,0 100,16 93,32 0,32" fill="#dc2626"/>
    <text x="10" y="12" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#fff">🏷️</text>
    <text x="24" y="20" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#fff">ON SALE</text>
  </svg>
);

export const TrendingBadgeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 32" width="110" height="32">
    <polygon points="0,0 103,0 110,16 103,32 0,32" fill="#7c3aed"/>
    <text x="10" y="12" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#fff">🔥</text>
    <text x="24" y="20" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#fff">TRENDING</text>
  </svg>
);

export const LimitedEditionBadgeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 32" width="140" height="32">
    <polygon points="0,0 133,0 140,16 133,32 0,32" fill="#b45309"/>
    <text x="10" y="12" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#fff">💎</text>
    <text x="24" y="20" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#fff">LIMITED EDITION</text>
  </svg>
);

// Standalone SVG strings for download
// Save each as a .svg file and download

export const SVG_DOWNLOAD_STRINGS = {
  "badge-bestseller.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" width="120" height="32"><polygon points="0,0 113,0 120,16 113,32 0,32" fill="#166454"/><text x="10" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff">★ BESTSELLER</text></svg>`,
  "badge-new-arrival.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" width="120" height="32"><polygon points="0,0 113,0 120,16 113,32 0,32" fill="#1d4ed8"/><text x="10" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff">✦ NEW ARRIVAL</text></svg>`,
  "badge-on-sale.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 32" width="100" height="32"><polygon points="0,0 93,0 100,16 93,32 0,32" fill="#dc2626"/><text x="10" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff">% ON SALE</text></svg>`,
  "badge-trending.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 32" width="110" height="32"><polygon points="0,0 103,0 110,16 103,32 0,32" fill="#7c3aed"/><text x="10" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff">↑ TRENDING</text></svg>`,
  "badge-limited-edition.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 32" width="140" height="32"><polygon points="0,0 133,0 140,16 133,32 0,32" fill="#b45309"/><text x="10" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff">◆ LIMITED EDITION</text></svg>`,
};

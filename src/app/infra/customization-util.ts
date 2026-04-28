export const customizationEnabled = new URLSearchParams(window.location.search).get('noCustomization') !== 'true';
export const useLocalCustomPackage = new URLSearchParams(window.location.search).get('useLocalCustomPackage') === 'true';

// Shared by settings storage and renderer pages; names are always displayed as text.
const CatName = {
  normalize(value) {
    if (typeof value !== 'string') return '';
    return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 24).join('');
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = CatName;

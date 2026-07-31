// Módulo de Utilidades - CORREGIDO
class Utils {
  constructor() {}
  
  getLocalDate(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatDisplayDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  parseInputDateToLocal(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return this.getLocalDate(date);
  }
  
  static generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  static getDefaultIcon(categoryName) {
    const iconMap = {
      'cigars': 'fa-smoking',
      'cigarros': 'fa-smoking',
      'limpieza': 'fa-broom',
      'cleaning': 'fa-broom',
      'telefonía': 'fa-mobile-alt',
      'phones': 'fa-mobile-alt',
      'bebidas': 'fa-glass-whiskey',
      'drinks': 'fa-glass-whiskey',
      'snacks': 'fa-cookie',
      'dulces': 'fa-candy-cane',
      'candy': 'fa-candy-cane',
      'ropa': 'fa-tshirt',
      'clothes': 'fa-tshirt',
      'electronicos': 'fa-plug',
      'electronics': 'fa-plug',
      'default': 'fa-tag'
    };
    
    const lowerName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return iconMap.default;
  }
}

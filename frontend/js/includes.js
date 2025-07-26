// Función para cargar includes si SSI no está disponible
async function loadIncludes() {
  const includes = document.querySelectorAll('[data-include]');
  
  for (const element of includes) {
    const file = element.getAttribute('data-include');
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`${file} not found`);
      const html = await response.text();
      element.outerHTML = html;
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }
  
  // Inicializar componentes después de cargar
  initializeComponents();
}

function initializeComponents() {
  // Inicializar modales
  document.getElementById('login-btn')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
  });
  
  document.getElementById('register-btn')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
  });
}

// Cargar includes cuando el DOM esté listo
if (document.querySelector('[data-include]')) {
  document.addEventListener('DOMContentLoaded', loadIncludes);
}
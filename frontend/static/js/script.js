// Función para mostrar el modal de registro
document.getElementById('register-btn').addEventListener('click', function() {
  this.disable = true
  console.log(1)
  var registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
  registerModal.show();
});

// Función para mostrar el modal de login
document.getElementById('login-btn').addEventListener('click', function() {
  var loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
});
document.getElementById('loginModal').addEventListener('hidden.bs.modal', function () {
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
});
document.getElementById('registerModal').addEventListener('hidden.bs.modal', function () {
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
});

// Manejar el formulario de registro
document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const result = await response.json();
    console.log('Resultado registro:', result);
    
    if (response.ok) {
      alert('Registro exitoso!');
      // Cierra el modal
      var registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      registerModal.hide();
      
    } else {
      alert(result.error || 'Error en el registro');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al conectar con el servidor');
  }
});

// Función para obtener deportes
async function getSports() {
    const response = await fetch('http://localhost:5000/api/sports');
    return await response.json();
}

// Función para añadir deporte favorito
async function addFavoriteSport(sportName, token) {
    const response = await fetch(`http://localhost:5000/api/sports/${sportName}/favorite`, {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
        },
    });
    return await response.json();
}

// Ejemplo de uso al hacer clic en el botón de registro
document.getElementById('register-btn').addEventListener('click', async () => {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = await registerUser(name, email, password);
    
    if (!result.error) {
        // Redirigir o mostrar mensaje de éxito
        alert('Registro exitoso!');
    } else {
        alert(result.error);
    }
});

// Función para actualizar la UI según el estado de autenticación
function updateAuthUI(isAuthenticated, userData = null) {
  const guestActions = document.getElementById('guest-actions');
  const userActions = document.getElementById('user-actions');
  const usernameDisplay = document.getElementById('username-display');
  const welcomeMessage = document.getElementById('welcome-message');
  const adminTab = document.getElementById('admin-tab'); // Nueva pestaña admin
  if (isAuthenticated && userData) {
    // Mostrar elementos para usuario autenticado
    if (guestActions) guestActions.style.display = 'none';
    if (userActions) userActions.style.display = 'flex'; // Cambiado a flex para mejor alineación
    
    if (usernameDisplay) {
      usernameDisplay.textContent = userData.name;
      usernameDisplay.setAttribute('title', userData.email); // Tooltip con el email
    }
    
    // Actualizar mensaje de bienvenida
    if (welcomeMessage) {
      welcomeMessage.textContent = `Bienvenido ${userData.name} a SportsWeb`;
      welcomeMessage.classList.add('text-success'); // Añadir estilo visual
    }
    // Mostrar u ocultar pestaña de administrador
    if (adminTab) {
      adminTab.style.display = userData.is_superuser ? 'block' : 'none';
    }
  } else {
    // Mostrar elementos para visitantes
    if (guestActions) guestActions.style.display = 'flex';
    if (userActions) userActions.style.display = 'none';
    
    if (usernameDisplay) usernameDisplay.textContent = '';
    
    // Restablecer mensaje de bienvenida
    if (welcomeMessage) {
      welcomeMessage.textContent = 'Bienvenido a SportsWeb';
      welcomeMessage.classList.remove('text-success');
    }
  }
}

// Función para manejar el login
async function handleLogin(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en el login');
    }

    // Solución rápida: recargar la página después de login exitoso
    window.location.reload();
    
    return data;

  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('login-error').textContent = error.message;
    document.getElementById('login-error').style.display = 'block';
    throw error;
  }
}

// Función para manejar el logout
async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      // Actualizar UI
      updateAuthUI(false);
      window.location.reload();

      return true;
    } else {
      throw new Error('Error al cerrar sesión');
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert(error.message);
    return false;
  }
}

// Verificar estado de autenticación al cargar la página
async function checkAuthState() {
  try {
    const response = await fetch('/api/auth/check-session', {
      method: 'POST',

      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        updateAuthUI(true, data.user);
      } else {
        updateAuthUI(false);
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    updateAuthUI(false);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Verificar estado de autenticación al cargar
  checkAuthState();
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      await handleLogin(email, password);
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  }
  
  // Botones para abrir modales
  document.getElementById('login-btn')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
  });
  
  document.getElementById('register-btn')?.addEventListener('click', () => {
    new bootstrap.Modal(document.getElementById('registerModal')).show();
  });
});
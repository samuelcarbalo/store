// Asegúrate de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Selecciona el formulario correcto (torneo-form en lugar de registerForm)
    const torneoForm = document.getElementById('torneo-form');
    loadTorneos();

    if (torneoForm) {
        torneoForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Esto es lo más importante para evitar la recarga
            
            console.log("Formulario enviado"); // Verificación en consola
            
            const torneoData = {
                nombre: document.getElementById('nombre-torneo').value,
                tipo: document.getElementById('tipo-torneo').value,
                modalidad: document.getElementById('subtipo-torneo').value,
                lugar: document.getElementById('lugar-torneo').value,
                fechaInicio: document.getElementById('fecha-inicio').value,
                temporada: document.getElementById('temporada-torneo').value
            };
            try {
                const response = await fetch('/api/tournaments/torneos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(torneoData)
                });

                // First check if the response is OK
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                // Then try to parse the JSON
                const data = await response.json();
                
                if (data.success) {
                    alert(data.message || 'Torneo creado exitosamente');
                    torneoForm.reset();
                    loadTorneos();
                } else {
                    throw new Error(data.error || 'Error al crear torneo');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
            }
        });
    } else {
        console.error('No se encontró el formulario con ID "torneo-form"');
    }
});

// Función para cargar torneos (debe estar definida)
async function loadTorneos() {
    try {
        const response = await fetch('/api/tournaments/list', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al cargar torneos');
        
        const data = await response.json();
        renderTorneos(data);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar torneos');
    }
}

// Función para renderizar torneos en la tabla
function renderTorneos(torneos) {
    const tableBody = document.getElementById('torneos-table-body');
    tableBody.innerHTML = '';
    
    torneos.forEach(torneo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${torneo.nombre}</td>
            <td>${torneo.tipo}</td>
            <td>Fútbol ${torneo.modalidad}</td>
            <td>${torneo.lugar}</td>
            <td>${torneo.temporada}</td>
            <td>
                <button  class="btn btn-sm btn-outline-primary me-1 config-btn"
                    data-id="${torneo._id}">+ Configuracón
                </button>
            </td>
            <td>
                <button  class="btn btn-sm btn-outline-primary me-1 edit-btn"
                    data-id="${torneo._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${torneo._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    // Añadir event listeners a los botones de edición
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => redirectTorneoForEdit(btn.dataset.id));
    });
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', () => redirectTorneoForConfig(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => delete_item(btn.dataset.id));
    });
}

// Función para cargar datos del torneo a editar
async function redirectTorneoForEdit(torneoId) {
    try {
        window.location.href = `/edit/${torneoId}`;
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar torneo para edición');
    }
}
// Función para cargar datos del torneo a editar
async function redirectTorneoForConfig(torneoId) {
    try {
        window.location.href = `/config/${torneoId}`;
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar torneo para edición');
    }
}
//Función para eliminar torneos
async function delete_item(torneoId) {
    try {
        const response = await fetch(`/api/tournaments/delete/${torneoId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Error al cargar torneos');
        const data = await response.json();
        window.location.reload();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el torneo');
    }
}

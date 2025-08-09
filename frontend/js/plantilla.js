
document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del torneo de la URL
    const pathParts = window.location.pathname.split('/');
    const torneoId = pathParts[1];
    const squadId = pathParts[3];
    // Cargar jugadores al iniciar
    cargarEquipo(torneoId, squadId);
    
    // Manejar el guardado de jugadores
    document.getElementById('btn-guardar-jugador').addEventListener('click', guardarJugador);
});



async function cargarEquipo(torneoId, squadId) {
    try {
        const response = await fetch(`/api/roster/${torneoId}/squad/${squadId}/template`);
        const result_r = await response.json();
        const data = result_r.squad
        const countPlayers = result_r.count_squad
        const countSquad = parseInt(countPlayers)
        const container = document.getElementById('equipos-container');
        container.innerHTML = '';
        
        if (data && data.length > 0) {
            // Mostrar tabla con jugadores existentes
            container.innerHTML = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Edad</th>
                            <th>Telefono</th>
                            <th>Document</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-jugadores">
                        <!-- jugadores se cargarán aquí -->
                    </tbody>
                </table>
                <button class="btn btn-success mt-3" id="btn-guardar-jugador">
                    <i class="fas fa-plus"></i> Agregar Jugador
                </button>
            `;
            
            // Mostrar formularios para crear jugadores 
            const numeroDeElementos = data.length;
            
            document.getElementById('torneo-id').innerText = `Total : ${countSquad} jugadores`;

            const tbody = document.getElementById('lista-jugadores');

            data.forEach(player => {
                tbody.innerHTML += `
                    <tr>
                        <td>
                            ${player.number}
                        </td>
                        <td>${player.name_player}</td>
                        <td>${player.age || ''}</td>
                        <td>${player.phone || ''}<br></td>
                        <td>${player.document || ''}<br></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary editar-jugador" 
                                data-id="${player._id},${player.name_player},${player.tournament_id},${player.squad_id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger eliminar-equipo" 
                                data-id="${player._id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            // Agregar event listeners
            document.querySelectorAll('.editar-jugador').forEach(btn => {
                btn.addEventListener('click', () => cargarJugadorParaEditar(btn.dataset.id));
            });
            
            document.querySelectorAll('.eliminar-equipo').forEach(btn => {
                btn.addEventListener('click', () => eliminarEquipo(btn.dataset.id));
            });
            
            document.getElementById('btn-guardar-jugador').addEventListener('click', mostrarFormularioNuevoEquipo);
            
        } else {


            let html = `
                <div class="alert alert-info">
                    No hay jugadores registrados. Por favor complete la información de los equipos participantes.
                </div>
                <form id="form-equipos-torneo">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Telefono</th>
                                <th>Document</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            
            html += `
                        </tbody>
                    </table>
                    
                    <button class="btn btn-success mt-3" id="btn-guardar-jugador">
                        <i class="fas fa-plus"></i> Agregar Jugador
                    </button>
                </form>
            `;
            
            container.innerHTML = html;
            document.getElementById('btn-guardar-jugador').addEventListener('click', function(event) {
                // Prevent the default action (form submission and page reload)
                event.preventDefault();

                // Now, call your function to show the form
                mostrarFormularioNuevoEquipo();
            });
        }
        
    } catch (error) {
        document.getElementById('equipos-container').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los Jugadores: ${error.message}
            </div>
        `;
    }
}

function mostrarFormularioNuevoEquipo() {
    // Limpiar formulario
    document.getElementById('form-editar-jugador').reset();
    document.getElementById('player-id').value = 'one';
    document.getElementById('modalJugadorTitle').textContent = 'Agregar Nuevo Jugador';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarJugadorModal'));
    modal.show();
}

// Suponiendo que 'player.date_birth' tiene un valor de tipo 'datetime'
function formatDateToInput(dateString) {
    const date = new Date(dateString);  // Convierte el string de fecha a un objeto Date
    return date.toISOString().split('T')[0];  // Convierte a formato 'YYYY-MM-DD'
}


async function cargarJugadorParaEditar(data) {
    result_data = data.split(",");
    const userId = result_data[0];
    const userName = result_data[1];
    const tournament_id = result_data[2];
    const squad_id = result_data[3];
    
    try {
        const response = await fetch(`/api/roster/${tournament_id}/squad/${squad_id}/${userId}`);
        const player = await response.json();
        // Llenar datos básicos
        document.getElementById('player-id').value = player._id;
        
        // Llenar formulario
        document.getElementById('player-name').value = player.name_player || ''; 
        document.getElementById('player-age').value = player.age || '';
        document.getElementById('player-phone').value = player.phone || '';
        document.getElementById('player-email').value = player.email || '';
        document.getElementById('player-document').value = player.document || '';
        
        const formattedDate = formatDateToInput(player.date_birth);
        document.getElementById('player-date_birth').value = formattedDate || '';

        document.getElementById('player-number').value = player.number || 0;
        document.getElementById('player-veteran').value = player.veteran || '';
        document.getElementById('player-guest_church').value = player.guest_church || '';
        
        
        // Mostrar modal
        document.getElementById('modalJugadorTitle').textContent = `Jugador: ${player.name_player}`;
        const modal = new bootstrap.Modal(document.getElementById('editarJugadorModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar jugador para edición');
    }
}

async function guardarJugador() {
    const pathParts = window.location.pathname.split('/');
    const torneoId = pathParts[1];
    const squadId = pathParts[3];
    const _id = document.getElementById('player-id').value
    const equipoData = {
        age: parseInt(document.getElementById('player-age').value, 10),
        phone: parseInt(document.getElementById('player-phone').value, 10),
        email: document.getElementById('player-email').value,
        document: parseInt(document.getElementById('player-document').value, 10),
        date_birth: document.getElementById('player-date_birth').value,
        number: parseInt(document.getElementById('player-number').value, 10),
        veteran: document.getElementById('player-veteran').value,
        guest_church: document.getElementById('player-guest_church').value,
    };
    
    try {
        const url = `/api/roster/${torneoId}/squad/${squadId}/player/${_id}`;
        const method = 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(equipoData)
        });
        const data = await response.json();
        console.log('Response:', data);
        if (!response.ok) throw new Error(data.error);
        alert(data.message || 'Equipo guardado correctamente');
        
        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('editarJugadorModal')).hide();
        cargarEquipo(torneoId, squadId);
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function eliminarEquipo(playerId) {
    if (!confirm('¿Está seguro de eliminar este jugador?')) return;
    
    try {
        const response = await fetch(`/api/roster/player/delete/${playerId}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('Error al eliminar equipo');
        
        const data = await response.json();
        alert(data.message || 'Equipo eliminado correctamente');
        
        // Recargar lista
        const pathParts = window.location.pathname.split('/');
        const torneoId = pathParts[1];
        const squadId = pathParts[3];

        cargarEquipo(torneoId, squadId);
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}






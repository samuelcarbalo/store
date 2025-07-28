
document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del torneo de la URL
    const pathParts = window.location.pathname.split('/');
    const torneoId = pathParts[pathParts.length - 1];
    
    // Cargar equipos al iniciar
    cargarEquipos(torneoId);
    
    // *** NUEVO: Cargar grupos al iniciar ***
    cargarGrupos(torneoId);
    // Manejar el guardado de equipos
    document.getElementById('btn-guardar-equipo').addEventListener('click', guardarEquipo);
    // *** NUEVO: Event listener para generar grupos ***
    document.getElementById('btn-generar-grupos').addEventListener('click', () => generarGrupos(torneoId));
});



async function cargarEquipos(torneoId) {
    try {
        const response = await fetch(`/api/tournaments/config/${torneoId}/squads`);
        const result_r = await response.json();
        const data = result_r.squads
        const cupoEquiposStr = result_r.cupoEquipos
        const cupos = parseInt(cupoEquiposStr)
        const container = document.getElementById('equipos-container');
        container.innerHTML = '';
        
        if (data && data.length > 0) {
            // Mostrar tabla con equipos existentes
            container.innerHTML = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Nombre</th>
                            <th>Representante</th>
                            <th>Contacto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="lista-equipos">
                        <!-- Equipos se cargarán aquí -->
                    </tbody>
                </table>
                <button class="btn btn-success mt-3" id="btn-agregar-equipo">
                    <i class="fas fa-plus"></i> Agregar Equipo
                </button>
            `;
            
            // Mostrar formularios para crear equipos 
            const numeroDeElementos = data.length;
            
            document.getElementById('torneo-id').innerText = `Cupo: ${cupos} equipos`;

            const tbody = document.getElementById('lista-equipos');

            data.forEach(equipo => {
                tbody.innerHTML += `
                    <tr>
                        <td>
                            ${equipo.logo ? 
                              `<img src="${equipo.logo}" alt="${equipo.squad_name}" style="height:30px">` : 
                              '<i class="fas fa-shield-alt fa-lg"></i>'}
                        </td>
                        <td>${equipo.squad_name}</td>
                        <td>${equipo.squad_owner || 'Sin asignar'}</td>
                        <td>
                            ${equipo.squad_email || ''}<br>
                            ${equipo.squad_phone || ''}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary editar-plantilla" 
                                data-id="${equipo._id},${equipo.squad_name}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger eliminar-equipo" 
                                data-id="${equipo._id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            // Agregar event listeners
            document.querySelectorAll('.editar-plantilla').forEach(btn => {
                btn.addEventListener('click', () => cargarPlantillaParaEditar(btn.dataset.id));
            });
            // Agregar event listeners
            // document.querySelectorAll('.editar-equipo').forEach(btn => {
            //     btn.addEventListener('click', () => cargarEquipoParaEditar(btn.dataset.id));
            // });
            
            document.querySelectorAll('.eliminar-equipo').forEach(btn => {
                btn.addEventListener('click', () => eliminarEquipo(btn.dataset.id));
            });
            
            document.getElementById('btn-agregar-equipo').addEventListener('click', mostrarFormularioNuevoEquipo);
            
        } else {
            const numeroDeElementos = data.length;

            const cupoEquipos = numeroDeElementos;

            let html = `
                <div class="alert alert-info">
                    No hay equipos registrados. Por favor complete la información de los equipos participantes.
                </div>
                <form id="form-equipos-torneo">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre del Equipo</th>
                                <th>Representante</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            
            html += `
                        </tbody>
                    </table>
                    
                    <button class="btn btn-success mt-3" id="btn-agregar-equipo">
                        <i class="fas fa-plus"></i> Agregar Equipo
                    </button>
                </form>
            `;
            
            container.innerHTML = html;
            document.getElementById('btn-agregar-equipo').addEventListener('click', function(event) {
                // Prevent the default action (form submission and page reload)
                event.preventDefault();

                // Now, call your function to show the form
                mostrarFormularioNuevoEquipo();
            });
        }
        
    } catch (error) {
        document.getElementById('equipos-container').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los equipos: ${error.message}
            </div>
        `;
    }
}

function mostrarFormularioNuevoEquipo() {
    // Limpiar formulario
    document.getElementById('form-editar-equipo').reset();
    document.getElementById('equipo-id').value = '';
    document.getElementById('modalEquipoTitle').textContent = 'Agregar Nuevo Equipo';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarEquipoModal'));
    modal.show();
}

async function cargarPlantillaParaEditar(data) {
    result_data = data.split(",");
    const equipoId = result_data[0];
    const squad_name = result_data[1];
    
    try {
        const response = await fetch(`/api/groups/squads/${equipoId}/${squad_name}`);
        const equipo = await response.json();
        
        // Llenar datos básicos
        document.getElementById('equipo-id').value = equipo._id;
        
        // Llenar formulario
        document.getElementById('equipo-id').value = equipo._id;
        document.getElementById('equipo-nombre').value = equipo.squad_name;
        document.getElementById('equipo-logo').value = equipo.logo || '';
        document.getElementById('representante-nombre').value = equipo.squad_owner || '';
        document.getElementById('representante-email').value = equipo.squad_email || '';
        document.getElementById('representante-telefono').value = equipo.squad_phone || '';
        
        // Limpiar botones anteriores si existen
        const existingButtons = document.getElementById('botones-plantilla-container');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        // Limpiar input file si existe
        const existingFileInput = document.getElementById('file-input-plantilla');
        if (existingFileInput) {
            existingFileInput.remove();
        }
        
        // Crear contenedor para botones adicionales
        const botonesContainer = document.createElement('div');
        botonesContainer.id = 'botones-plantilla-container';
        botonesContainer.className = 'd-flex justify-content-between mt-4';
        
        // Botón para cargar plantilla desde Excel
        const btnCargarPlantilla = document.createElement('button');
        btnCargarPlantilla.type = 'button'; // ¡Esto es crucial!
        btnCargarPlantilla.className = 'btn btn-primary';
        btnCargarPlantilla.innerHTML = '<i class="fas fa-file-excel me-2"></i>Cargar Plantilla';
        btnCargarPlantilla.onclick = (e) => {
            e.preventDefault(); // Previene el submit del formulario
            document.getElementById('file-input-plantilla').click();
        };
        // Input oculto para subir archivo Excel
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-input-plantilla';
        fileInput.style.display = 'none';
        fileInput.accept = '.xlsx, .xls';
        fileInput.addEventListener('change', function(e) {
            console.log("Archivo seleccionado:", e.target.files[0]); // Verificación
            subirPlantillaExcel(e, equipoId);
        });
        //fileInput.addEventListener('change', (e) => subirPlantillaExcel(e, equipoId));
        
        // Botón para ver plantilla completa
        const btnVerPlantilla = document.createElement('button');
        btnVerPlantilla.type = 'button'; // ¡Esto es crucial!
        btnVerPlantilla.className = 'btn btn-success';
        btnVerPlantilla.innerHTML = '<i class="fas fa-eye me-2"></i>Ver Plantilla Completa';
        btnVerPlantilla.onclick = () => {
            const pathParts = window.location.pathname.split('/');
            const torneoId = pathParts[pathParts.length - 1];
            window.location.href = `/${torneoId}/squad/${equipoId}/template/edit`
        };
        // Agregar elementos al DOM
        botonesContainer.appendChild(btnCargarPlantilla);
        botonesContainer.appendChild(btnVerPlantilla);
        
        // Insertar después del formulario existente
        const form = document.getElementById('form-editar-equipo');
        form.appendChild(botonesContainer);
        form.appendChild(fileInput);
        
        // Mostrar modal
        document.getElementById('modalEquipoTitle').textContent = `Editar ${equipo.squad_name}`;
        const modal = new bootstrap.Modal(document.getElementById('editarEquipoModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error:', JSON.stringify(error));
        alert('Error al cargar equipo para edición');
    }
}

async function subirPlantillaExcel(event, equipoId) {
    // Verificación inicial
    if (!event || !event.target) {
        console.error("Evento no válido");
        return;
    }

    const fileInput = event.target;
    
    if (!fileInput.files || fileInput.files.length === 0) {
        console.log("No se seleccionó ningún archivo");
        return;
    }

    const file = fileInput.files[0];
    console.log("Archivo a subir:", file.name, "Tamaño:", file.size);

    // Validación básica del archivo
    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(`.${fileExt}`)) {
        alert('Por favor sube un archivo Excel válido (.xlsx o .xls)');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('plantilla', file);
        formData.append('equipoId', equipoId);
        
        const pathParts = window.location.pathname.split('/');
        const torneoId = pathParts[pathParts.length - 1];
        console.log("Enviando archivo al servidor...");
        
        const response = await fetch(`/api/roster/${torneoId}/squads/${equipoId}/template/edit`, {
            method: 'POST',
            body: formData
            // No agregues headers Content-Type cuando usas FormData!
            // El navegador lo hará automáticamente con el boundary correcto
        });

        console.log("Respuesta del servidor:", response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("Resultado:", result);
        
        alert(result.message || '✅ Plantilla cargada exitosamente');
        
        // Limpiar el input file para permitir volver a subir el mismo archivo
        fileInput.value = '';
        
    } catch (error) {
        console.error("Error completo:", error);
        alert(`❌ Error al subir plantilla: ${error.message}`);
    }
}

//la reemplace por cargar plantilla para editar
// async function cargarEquipoParaEditar(data) {
//     result_data = data.split(",")
//     const equipoId = result_data[0] 
//     const squad_name = result_data[1]
//     try {
//         const response = await fetch(`/api/groups/squads/${equipoId}/${squad_name}`);
//         const equipo = await response.json();
//         // Llenar formulario
//         document.getElementById('equipo-id').value = equipo._id;
//         document.getElementById('equipo-nombre').value = equipo.squad_name;
//         document.getElementById('equipo-logo').value = equipo.logo || '';
//         document.getElementById('representante-nombre').value = equipo.squad_owner || '';
//         document.getElementById('representante-email').value = equipo.squad_email || '';
//         document.getElementById('representante-telefono').value = equipo.squad_phone || '';
        
//         // Mostrar modal
//         document.getElementById('modalEquipoTitle').textContent = `Editar ${equipo.squad_name}`;
//         const modal = new bootstrap.Modal(document.getElementById('editarEquipoModal'));
//         modal.show();
        
//     } catch (error) {
//         console.error('Error:', error);
//         alert('Error al cargar equipo para edición');
//     }
// }

async function guardarEquipo() {
    const pathParts = window.location.pathname.split('/');
    const torneoId = pathParts[pathParts.length - 1];
    const equipoId = document.getElementById('equipo-id').value;
    
    const equipoData = {
        squad_name: document.getElementById('equipo-nombre').value,
        logo: document.getElementById('equipo-logo').value,
        squad_owner: document.getElementById('representante-nombre').value,
        squad_email: document.getElementById('representante-email').value,
        squad_phone: document.getElementById('representante-telefono').value
    };
    
    try {
        const url = `/api/groups/${torneoId}/squads/update/${equipoId}`;
        const method = 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(equipoData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.warning);
        alert(data.message || 'Equipo guardado correctamente');
        
        // Cerrar modal y recargar
        bootstrap.Modal.getInstance(document.getElementById('editarEquipoModal')).hide();
        cargarEquipos(torneoId);
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function guardarTodosEquipos(torneoId, cupoEquipos) {
    const equipos = [];
    
    for (let i = 1; i <= cupoEquipos; i++) {
        equipos.push({
            squad_name: document.querySelector(`input[name="equipo-nombre-${i}"]`).value,
            squad_owner: document.querySelector(`input[name="representante-nombre-${i}"]`).value,
            squad_email: document.querySelector(`input[name="representante-email-${i}"]`).value,
            squad_phone: document.querySelector(`input[name="representante-telefono-${i}"]`).value
            
        });
    }
    
    try {
        const response = await fetch(`/api/tournaments/config/${torneoId}/update/squads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipos })
        });
        
        if (!response.ok) throw new Error('Error al guardar equipos');
        
        const data = await response.json();
        alert(data.message || 'Equipos guardados correctamente');
        cargarEquipos(torneoId);
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

async function eliminarEquipo(equipoId) {
    if (!confirm('¿Está seguro de eliminar este equipo?')) return;
    
    try {
        const response = await fetch(`/api/groups/squads/delete/${equipoId}`, {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('Error al eliminar equipo');
        
        const data = await response.json();
        alert(data.message || 'Equipo eliminado correctamente');
        
        // Recargar lista
        const pathParts = window.location.pathname.split('/');
        const torneoId = pathParts[pathParts.length - 1];

        cargarEquipos(torneoId);
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}


// *** AÑADIR LAS SIGUIENTES FUNCIONES NUEVAS AL FINAL DEL ARCHIVO ***

async function generarGrupos(torneoId) {
    if (!confirm('¿Estás seguro de que deseas generar los grupos? Si ya existen, se borrarán y se crearán de nuevo.')) {
        return;
    }

    try {
        const response = await fetch(`/api/roster/${torneoId}/generate-groups`, {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Ocurrió un error desconocido.');
        }

        alert(result.message);
        cargarGrupos(torneoId); // Recargar la vista de grupos
        window.location.reload();

    } catch (error) {
        console.error('Error al generar grupos:', error);
        alert(`Error: ${error.message}`);
    }
}

async function cargarGrupos(torneoId) {
    const container = document.getElementById('grupos-container');
    const loadingSpinner = document.getElementById('loading-grupos');
    loadingSpinner.style.display = 'block'; // Mostrar spinner

    try {
        const response = await fetch(`/api/roster/${torneoId}/groups`);
        if (!response.ok) {
            throw new Error('No se pudo obtener la información de los grupos.');
        }
        const grupos = await response.json();
        console.log(JSON.stringify(grupos))
        loadingSpinner.style.display = 'none'; // Ocultar spinner
        container.innerHTML = ''; // Limpiar contenedor
        console.log(grupos)
        if (grupos && grupos.length > 0) {
            const row = document.createElement('div');
            row.className = 'row';

            // Determinar la clase de columna basada en la cantidad de grupos
            let colClass;
            if (grupos.length === 1) {
                colClass = 'col-12'; // Ocupa todo el ancho en todos los tamaños de pantalla
            } else {
                colClass = 'col-md-6 col-lg-4'; // Para múltiples columnas
            }

            grupos.forEach(grupo => {
                const colClass = 'col-12 col-md-6 col-lg-6';

                let equiposHtml = '<div class="table-responsive">';
                equiposHtml += '<table class="table table-hover table-striped table-fixed-layout">';
                equiposHtml += `<thead>
                                    <tr>
                                        <th>Logo</th>
                                        <th>Nombre</th>
                                        <th>Pj</th>
                                        <th>Pg</th>
                                        <th>Pe</th>
                                        <th>Pp</th>
                                        <th>Gf</th>
                                        <th>Gc</th>
                                        <th>Dg</th>
                                        <th>Puntos</th>
                                    </tr>
                                </thead>`;
                equiposHtml += '<tbody>';

                grupo.squads.forEach(equipo => {
                    const logo = equipo.logo ?
                        `<img src="${equipo.logo}" alt="${equipo.squad_name}" class="me-2" style="height:20px; width:20px; object-fit:contain;">` :
                        '<i class="fas fa-shield-alt fa-fw me-2"></i>';

                    // *** CAMBIO AQUÍ: Usar .trim() en squad_name ***
                    const cleanedSquadName = equipo.squad_name ? equipo.squad_name.trim() : 'Nombre no disponible';

                    equiposHtml += `
                        <tr>
                            <td>${logo}</td>
                            <td style="word-break: break-word; white-space: normal;">${cleanedSquadName}</td>
                            <td>${equipo.pj}</td>
                            <td>${equipo.pg}</td>
                            <td>${equipo.pe}</td>
                            <td>${equipo.pp}</td>
                            <td>${equipo.gf}</td>
                            <td>${equipo.gc}</td>
                            <td>${equipo.dg}</td>
                            <td>${equipo.pts}</td>
                            </tr>
                    `;
                });
                equiposHtml += '</tbody></table>';
                equiposHtml += '</div>';

                const col = document.createElement('div');
                col.className = `${colClass} mb-4`;

                col.innerHTML = `
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <strong>Grupo ${grupo.squad_name}</strong>
                        </div>
                        <div class="card-body p-0">
                            ${equiposHtml}
                        </div>
                    </div>
                `;
                row.appendChild(col);
            });
            container.appendChild(row);
        } else {
            container.innerHTML = `
                <div class="alert alert-info">
                    Aún no se han generado los grupos para este torneo. Haz clic en "Generar/Regenerar Grupos" para comenzar.
                </div>
            `;
        }

    } catch (error) {
        loadingSpinner.style.display = 'none'; // Ocultar spinner en caso de error
        console.error('Error al cargar grupos:', error);
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}




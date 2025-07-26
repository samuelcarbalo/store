document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del torneo de la URL
    const pathParts = window.location.pathname.split('/');
    const torneoId = pathParts[pathParts.length - 1];
    console.log(torneoId)
    // Cargar datos del torneo
    loadTorneoData(torneoId);
    
    // Manejar envío del formulario
    const editForm = document.getElementById('edit-torneo-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateTorneo(torneoId);
        });
    }
});

async function loadTorneoData(torneoId) {
    try {
        const response = await fetch(`/api/tournaments/${torneoId}`);
        if (!response.ok) throw new Error('Error al cargar torneo');
        
        const torneo = await response.json();
        console.log(torneo)
        // Llenar formulario con los datos
        document.getElementById('torneo-id').value = torneo._id;
        document.getElementById('nombreTorneo').value = torneo.nombre || '';
        document.getElementById('deporteJuego').value = torneo.tipo || '';
        document.getElementById('subtipoDeporte').value = torneo.modalidad || '';
        document.getElementById('urlImagen').value = torneo.imagenUrl || '';
        document.getElementById('cupoEquipos').value = torneo.cupoEquipos || 8;
        document.getElementById('costoInscripcion').value = torneo.costoInscripcion || '';
        // document.getElementById('costoInscripcion').value = torneo.costoInscripcion || '';
        

        // Fechas y Ubicación
        document.getElementById('fechaFin').value = torneo.fechaFin || '';
        document.getElementById('fechaLimiteInscripcion').value = torneo.fechaLimiteInscripcion || '';
        document.getElementById('lugarTorneo').value = torneo.lugar || '';
        document.getElementById('urlReglamento').value = torneo.urlReglamento || '';
        document.getElementById('contactoOrganizador').value = torneo.contacto || '';
        // Formato del Torneo - Fase de Grupos
        if (torneo.tieneFaseGrupos === true){
            document.getElementById('faseGruposSi').value = true;
            document.getElementById('faseGruposNo').value = false;
            // Assuming 'torneo' object and 'faseGruposSi' checkbox exist
            faseGruposSi.checked = torneo.tieneFaseGrupos;
            toggleSegundaFaseGruposVisibility(); // Call to adjust visibility
            toggleGroupStageVisibility();
        }
        else{
            document.getElementById('faseGruposSi').value = '';
            document.getElementById('faseGruposNo').value = torneo.tieneFaseGrupos;

        }
        document.getElementById('groupStageSettings').value = torneo.groupStageSettings || '';
        document.getElementById('cantidadGrupos').value = torneo.faseGrupos.cantidadGrupos || '4';
        document.getElementById('equiposPorGrupo').value = torneo.faseGrupos.equiposPorGrupo || '5';
        document.getElementById('equiposClasifican').value = torneo.faseGrupos.equiposClasifican || '2';
        document.getElementById('idaVueltaSi').value = torneo.idaVueltaSi || '';
        document.getElementById('idaVueltaNo').value = torneo.idaVueltaNo || '';
        if (torneo.faseGrupos.idaVuelta === true){
            idaVueltaSi.checked = torneo.faseGrupos.idaVuelta
            // Assuming 'torneo' object and 'faseGruposSi' checkbox exist
        }
        else{
            idaVueltaSi.checked = false

        }
        if (torneo.faseGrupos?.segundaFase?.cantidadGrupos !== null) {
            document.getElementById('tieneSegundaFaseGrupos').checked = true;
            toggleSegundaFaseGruposVisibility(); // Mostrar formulario
            document.getElementById('cantidadGrupos2').value = torneo.faseGrupos.segundaFase.cantidadGrupos2 || '2';
            document.getElementById('equiposPorGrupo2').value = torneo.faseGrupos.segundaFase.equiposPorGrupo2 || '3';
            document.getElementById('equiposClasifican2').value = torneo.faseGrupos.segundaFase.equiposClasifican2 || '1';

            if (torneo.faseGrupos.segundaFase.idaVuelta === true) {
                document.getElementById('idaVueltaSi2').checked = true;
            } else {
                document.getElementById('idaVueltaNo2').checked = true;
            }
        }

        // Formato del Torneo - Eliminación Directa
        
        document.getElementById('elimDirectaSi').value = torneo.elimDirectaSi || '';
        document.getElementById('elimDirectaNo').value = torneo.elimDirectaNo || '';
        document.getElementById('eliminationStageSettings').value = torneo.eliminationStageSettings || '';
        document.getElementById('rondaInicialEliminacion').value = torneo.eliminacionDirecta?.rondaInicial || '';

        const partido3erPuestoSi = document.getElementById('tercerPuestoSi');
        const partido3erPuestoNo = document.getElementById('tercerPuestoNo');
        partido3erPuestoSi.checked = torneo.eliminacionDirecta.partido3erPuesto
        
        // --- Funciones de Lógica de Visibilidad ---
        function toggleGroupStageVisibility() {
            if (faseGruposSi.checked) {
                console.log(faseGruposSi.checked)
                groupStageSettings.style.display = 'block';
                // Al activar fase de grupos, por defecto la eliminación directa está activa
                elimDirectaSi.checked = true;
            } else {
                groupStageSettings.style.display = 'none';
                // Si no hay fase de grupos, el torneo debe ser de eliminación directa (o no tiene sentido)
                elimDirectaSi.checked = true; // Forzar a eliminación directa si no hay grupos
            }
            toggleEliminationStageVisibility(); // Recalcular la visibilidad de eliminación directa
        }
        function toggleEliminationStageVisibility() {
            // La fase de eliminación directa se muestra si:
            // 1. Está marcada explícitamente "Sí" para eliminación directa.
            // 2. NO hay fase de grupos (en este caso, se asume eliminación directa como formato principal).
            if (elimDirectaSi.checked || faseGruposNo.checked) {
                eliminationStageSettings.style.display = 'block';
            } else {
                eliminationStageSettings.style.display = 'none';
            }
        }
        function toggleSegundaFaseGruposVisibility() {
            const checkbox = document.getElementById('tieneSegundaFaseGrupos');
            const secondGroupStageSettings = document.getElementById('secondGroupStageSettings');
            if (checkbox.checked) {
                secondGroupStageSettings.style.display = 'block';
            } else {
                secondGroupStageSettings.style.display = 'none';
            }
        }

        // --- Event Listeners ---
        faseGruposSi.addEventListener('change', toggleGroupStageVisibility);
        faseGruposNo.addEventListener('change', toggleGroupStageVisibility);
        document.getElementById('tieneSegundaFaseGrupos').addEventListener('change', toggleSegundaFaseGruposVisibility);

        elimDirectaSi.addEventListener('change', toggleEliminationStageVisibility);
        elimDirectaNo.addEventListener('change', toggleEliminationStageVisibility);

        // Formatear fecha para el input date
        if (torneo.fechaInicio) {
            const fecha = new Date(torneo.fechaInicio);
            document.getElementById('fechaInicio').value = fecha.toISOString().split('T')[0];
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar datos del torneo');
        window.location.href = '/administrador'; // Redirigir si hay error
    }
}


async function updateTorneo(torneoId) {
    const partido3erPuestoSi = document.getElementById('tercerPuestoSi')
    const formData = {
        id: document.getElementById('torneo-id').value,
        nombre: document.getElementById('nombreTorneo').value,
        deporte: document.getElementById('deporteJuego').value,
        modalidad: document.getElementById('subtipoDeporte').value,
        imagenUrl: document.getElementById('urlImagen').value,
        cupoEquipos: document.getElementById('cupoEquipos').value,
        costoInscripcion: document.getElementById('costoInscripcion').value,
        fechaInicio: document.getElementById('fechaInicio').value,
        fechaFin: document.getElementById('fechaFin').value,
        fechaLimiteInscripcion: document.getElementById('fechaLimiteInscripcion').value,
        lugar: document.getElementById('lugarTorneo').value,
        reglamentoUrl: document.getElementById('urlReglamento').value,
        contacto: document.getElementById('contactoOrganizador').value,
        
        tieneFaseGrupos: faseGruposSi.checked,
        faseGrupos: {
            cantidadGrupos: faseGruposSi.checked ? cantidadGrupos.value : null,
            equiposPorGrupo: faseGruposSi.checked ? equiposPorGrupo.value : null,
            equiposClasifican: faseGruposSi.checked ? equiposClasifican.value : null,
            segundaFase: {
                cantidadGrupos2: tieneSegundaFaseGrupos.checked ? cantidadGrupos2.value : null,
                equiposPorGrupo2: tieneSegundaFaseGrupos.checked ? equiposPorGrupo2.value : null,
                equiposClasifican2: tieneSegundaFaseGrupos.checked ? equiposClasifican2.value : null,
            },
            idaVuelta: faseGruposSi.checked ? idaVueltaSi.checked : null
        },
        
        tieneEliminacionDirecta: elimDirectaSi.checked || faseGruposNo.checked, // Es true si se marca o si no hay fase de grupos
        eliminacionDirecta: {
            rondaInicial: (elimDirectaSi.checked || faseGruposNo.checked) ? rondaInicialEliminacion.value : null,
            partido3erPuesto: (elimDirectaSi.checked || faseGruposNo.checked) ? partido3erPuestoSi.checked : null
        }
    };
    // const formData = {
    //     nombre: document.getElementById('nombre').value,
    //     tipo: document.getElementById('tipo').value,
    //     subtipo: document.getElementById('subtipo').value,
    //     lugar: document.getElementById('lugar').value,
    //     fechaInicio: document.getElementById('fecha').value,
    //     temporada: document.getElementById('temporada').value,
    //     imagenUrl: document.getElementById('imagen').value,
    //     equiposParticipantes: document.getElementById('equipos').value
    // };
    
    try {
        const response = await fetch(`/api/tournaments/v1/${torneoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar');
        }
        
        const data = await response.json();
        alert(data.message || 'Torneo actualizado con éxito');
        window.location.href = '/administrador'; // Volver a la lista
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}
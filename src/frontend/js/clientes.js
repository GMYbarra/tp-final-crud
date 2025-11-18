let modalCliente;

document.addEventListener("DOMContentLoaded", () => {
    // inicializar modal
    const modalElement = document.getElementById("modalCliente");
    modalCliente = new bootstrap.Modal(modalElement);

    // botón nuevo
    document.getElementById("btnNuevoCliente")
        .addEventListener("click", abrirModalNuevoCliente);

    // submit del form
    document.getElementById("formCliente")
        .addEventListener("submit", onSubmitCliente);

    // cargar lista
    cargarClientes();
});

async function cargarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes`, {
            headers: {
                "X-Rol": "ADMIN"
            }
        });

        if (!res.ok) {
            alert("Error al obtener clientes (¿tiene rol ADMIN?)");
            return;
        }

        const clientes = await res.json();
        const tbody = document.getElementById("tablaClientes");
        tbody.innerHTML = "";

        clientes.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.dni}</td>
                    <td>${c.nombre}</td>
                    <td>${c.apellido}</td>
                    <td>${c.email ?? ""}</td>
                    <td>${c.telefono ?? ""}</td>
                    <td>${c.direccion ?? ""}</td>
                    <td>
                        <button class="btn btn-warning btn-sm me-1" onclick="editarCliente(${c.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alert("Error al comunicarse con la API de clientes");
    }
}

function abrirModalNuevoCliente() {
    document.getElementById("clienteId").value = "";
    document.getElementById("dni").value = "";
    document.getElementById("nombreCliente").value = "";
    document.getElementById("apellidoCliente").value = "";
    document.getElementById("emailCliente").value = "";
    document.getElementById("telefonoCliente").value = "";
    document.getElementById("direccionCliente").value = "";

    document.getElementById("modalClienteLabel").textContent = "Nuevo cliente";
    modalCliente.show();
}

async function editarCliente(id) {
    try {
        const res = await fetch(`${API_URL}/clientes/${id}`, {
            headers: {
                "X-Rol": "ADMIN"
            }
        });

        if (!res.ok) {
            alert("No se pudo cargar el cliente");
            return;
        }

        const c = await res.json();

        document.getElementById("clienteId").value = c.id;
        document.getElementById("dni").value = c.dni;
        document.getElementById("nombreCliente").value = c.nombre;
        document.getElementById("apellidoCliente").value = c.apellido;
        document.getElementById("emailCliente").value = c.email ?? "";
        document.getElementById("telefonoCliente").value = c.telefono ?? "";
        document.getElementById("direccionCliente").value = c.direccion ?? "";

        document.getElementById("modalClienteLabel").textContent = "Editar cliente";
        modalCliente.show();

    } catch (err) {
        console.error(err);
        alert("Error al cargar el cliente");
    }
}

async function onSubmitCliente(e) {
    e.preventDefault();

    const id = document.getElementById("clienteId").value;
    const dni = document.getElementById("dni").value.trim();
    const nombre = document.getElementById("nombreCliente").value.trim();
    const apellido = document.getElementById("apellidoCliente").value.trim();
    const email = document.getElementById("emailCliente").value.trim();
    const telefono = document.getElementById("telefonoCliente").value.trim();
    const direccion = document.getElementById("direccionCliente").value.trim();

    if (!dni || !nombre || !apellido) {
        alert("DNI, Nombre y Apellido son obligatorios.");
        return;
    }

    // Cuerpo esperado por la API (camelCase, como en tus DTOs)
    const bodyCrear = {
        dni: dni,
        nombre: nombre,
        apellido: apellido,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null
    };

    const bodyActualizar = {
        nombre: nombre,
        apellido: apellido,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null
    };

    try {
        let res;

        if (!id) {
            // POST /clientes
            res = await fetch(`${API_URL}/clientes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Rol": "ADMIN"
                },
                body: JSON.stringify(bodyCrear)
            });

            if (res.status === 201) {
                alert("Cliente creado correctamente");
            } else if (res.status === 409 || res.status === 400) {
                const data = await res.json().catch(() => null);
                alert((data && data.error) || "Error al crear el cliente (¿DNI duplicado?)");
                return;
            } else {
                alert("Error al crear el cliente");
                return;
            }
        } else {
            // PUT /clientes/{id}
            res = await fetch(`${API_URL}/clientes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Rol": "ADMIN"
                },
                body: JSON.stringify(bodyActualizar)
            });

            if (res.ok) {
                alert("Cliente actualizado correctamente");
            } else {
                alert("Error al actualizar el cliente");
                return;
            }
        }

        modalCliente.hide();
        await cargarClientes();

    } catch (err) {
        console.error(err);
        alert("Error al guardar el cliente");
    }
}

async function eliminarCliente(id) {
    const confirmar = confirm("¿Seguro que querés eliminar este cliente?");
    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/clientes/${id}`, {
            method: "DELETE",
            headers: {
                "X-Rol": "ADMIN"
            }
        });

        if (res.status === 204) {
            alert("Cliente eliminado correctamente");
            cargarClientes();
        } else if (res.status === 409 || res.status === 400) {
            const data = await res.json().catch(() => null);
            alert((data && data.error) || "No se pudo eliminar el cliente (puede tener pedidos asociados)");
        } else if (res.status === 404) {
            alert("Cliente no encontrado");
        } else {
            alert("Error al eliminar el cliente");
        }

    } catch (err) {
        console.error(err);
        alert("Error al intentar eliminar el cliente");
    }
}

let modalProducto; // instancia de bootstrap.Modal

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();

    // inicializar modal
    const modalElement = document.getElementById("modalProducto");
    modalProducto = new bootstrap.Modal(modalElement);

    // botón "Nuevo producto"
    const btnNuevo = document.getElementById("btnNuevo");
    btnNuevo.addEventListener("click", () => {
        abrirModalNuevo();
    });

    // submit del formulario
    const form = document.getElementById("formProducto");
    form.addEventListener("submit", onSubmitProducto);
});

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);

        if (!res.ok) {
            alert("Error al obtener productos");
            return;
        }

        const productos = await res.json();
        const tbody = document.getElementById("tablaProductos");
        tbody.innerHTML = "";

        productos.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.codigo}</td>
                    <td>${p.nombre}</td>
                    <td>${p.stock}</td>
                    <td>$ ${p.precio.toFixed(2)}</td>
                    <td>${p.activo ? "Sí" : "No"}</td>
                    <td>
                        <button class="btn btn-warning btn-sm me-1" onclick="editarProducto(${p.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${p.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alert("Error al comunicarse con la API");
    }
}

function abrirModalNuevo() {
    // limpiar formulario
    document.getElementById("productoId").value = "";
    document.getElementById("codigo").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("activo").checked = true;

    document.getElementById("modalProductoLabel").textContent = "Nuevo producto";
    modalProducto.show();
}

// se llama desde el botón Editar de cada fila
async function editarProducto(id) {
    try {
        const res = await fetch(`${API_URL}/productos/${id}`);
        if (!res.ok) {
            alert("No se pudo obtener el producto");
            return;
        }

        const p = await res.json();

        // llenar formulario
        document.getElementById("productoId").value = p.id;
        document.getElementById("codigo").value = p.codigo;
        document.getElementById("nombre").value = p.nombre;
        document.getElementById("descripcion").value = p.descripcion ?? "";
        document.getElementById("precio").value = p.precio;
        document.getElementById("stock").value = p.stock;
        document.getElementById("activo").checked = p.activo;

        document.getElementById("modalProductoLabel").textContent = "Editar producto";
        modalProducto.show();

    } catch (err) {
        console.error(err);
        alert("Error al cargar el producto");
    }
}

async function onSubmitProducto(event) {
    event.preventDefault();

    const id = document.getElementById("productoId").value;
    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const precio = parseFloat(document.getElementById("precio").value);
    const stock = parseInt(document.getElementById("stock").value, 10);
    const activo = document.getElementById("activo").checked;

    if (!codigo || !nombre || isNaN(precio) || isNaN(stock)) {
        alert("Código, nombre, precio y stock son obligatorios.");
        return;
    }

    // cuerpo que espera la API (camelCase, como en Swagger)
    const body = {
        codigo: codigo,
        nombre: nombre,
        descripcion: descripcion,
        precio: precio,
        stock: stock,
        activo: activo
    };

    try {
        let res;

        if (!id) {
            // alta -> POST /productos
            res = await fetch(`${API_URL}/productos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.status === 201) {
                alert("Producto creado correctamente");
            } else if (res.status === 409) {
                const data = await res.json();
                alert(data.error || "Código de producto duplicado");
                return;
            } else {
                alert("Error al crear el producto");
                return;
            }
        } else {
            // edición -> PUT /productos/{id}
            // importante: el DTO de update NO incluye código, pero no pasa nada
            const bodyUpdate = {
                nombre: nombre,
                descripcion: descripcion,
                precio: precio,
                stock: stock,
                activo: activo
            };

            res = await fetch(`${API_URL}/productos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyUpdate)
            });

            if (res.ok) {
                alert("Producto actualizado correctamente");
            } else {
                alert("Error al actualizar el producto");
                return;
            }
        }

        modalProducto.hide();
        await cargarProductos();

    } catch (err) {
        console.error(err);
        alert("Error al guardar el producto");
    }
}

async function eliminarProducto(id) {
    const confirmar = confirm("¿Seguro que querés eliminar este producto?");
    if (!confirmar) return;

    try {
        const res = await fetch(`${API_URL}/productos/${id}`, { method: "DELETE" });

        if (res.status === 204) {
            alert("Producto eliminado correctamente");
            cargarProductos();
        } else {
            alert("No se pudo eliminar el producto (puede estar relacionado a pedidos)");
        }
    } catch (err) {
        console.error(err);
        alert("Error al intentar eliminar el producto");
    }
}

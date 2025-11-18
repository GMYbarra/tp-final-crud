let modalDetalle;
let modalNuevo;

let clientesCache = [];
let productosCache = [];

document.addEventListener("DOMContentLoaded", () => {
    const modalDetalleEl = document.getElementById("modalDetallePedido");
    modalDetalle = new bootstrap.Modal(modalDetalleEl);

    const modalNuevoEl = document.getElementById("modalNuevoPedido");
    modalNuevo = new bootstrap.Modal(modalNuevoEl);

    document.getElementById("btnNuevoPedido")
        .addEventListener("click", abrirModalNuevoPedido);

    document.getElementById("btnGuardarEstado")
        .addEventListener("click", guardarEstadoPedido);

    document.getElementById("btnAgregarItem")
        .addEventListener("click", agregarFilaItem);

    document.getElementById("formNuevoPedido")
        .addEventListener("submit", onSubmitNuevoPedido);

    cargarPedidos();
});

// ======================== LISTADO ========================

async function cargarPedidos() {
    try {
        const res = await fetch(`${API_URL}/pedidos`);

        if (!res.ok) {
            alert("Error al obtener pedidos");
            return;
        }

        const pedidos = await res.json();
        const tbody = document.getElementById("tablaPedidos");
        tbody.innerHTML = "";

        pedidos.forEach(p => {
            const clienteNombre = p.cliente
                ? `${p.cliente.nombre} ${p.cliente.apellido}`
                : `Cliente #${p.clienteId}`;

            const fecha = p.fechaPedido
                ? formatearFecha(p.fechaPedido)
                : "";

            const badgeEstado = getBadgeEstado(p.estado);

            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${clienteNombre}</td>
                    <td>${fecha}</td>
                    <td>${badgeEstado}</td>
                    <td>$ ${p.total.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="verDetalle(${p.id})">
                            Ver detalle
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alert("Error al comunicarse con la API de pedidos");
    }
}

function getBadgeEstado(estado) {
    if (!estado) return "";

    const e = estado.toUpperCase();

    let clase = "bg-secondary";
    if (e === "PENDIENTE") clase = "bg-warning text-dark";
    else if (e === "CONFIRMADO") clase = "bg-success";
    else if (e === "ENVIADO") clase = "bg-primary";
    else if (e === "CANCELADO") clase = "bg-danger";

    return `<span class="badge ${clase}">${e}</span>`;
}

function formatearFecha(fechaIso) {
    const d = new Date(fechaIso);
    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const anio = d.getFullYear();
    const horas = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");

    return `${dia}/${mes}/${anio} ${horas}:${mins}`;
}

// ======================== DETALLE + ESTADO ========================

async function verDetalle(id) {
    try {
        const res = await fetch(`${API_URL}/pedidos/${id}`);

        if (!res.ok) {
            alert("No se pudo obtener el detalle del pedido");
            return;
        }

        const p = await res.json();

        const clienteNombre = p.cliente
            ? `${p.cliente.nombre} ${p.cliente.apellido}`
            : `Cliente #${p.clienteId}`;

        document.getElementById("detPedidoIdHidden").value = p.id;
        document.getElementById("detPedidoId").textContent = p.id;
        document.getElementById("detCliente").textContent = clienteNombre;
        document.getElementById("detFecha").textContent = p.fechaPedido ? formatearFecha(p.fechaPedido) : "";
        document.getElementById("detEstado").innerHTML = getBadgeEstado(p.estado);
        document.getElementById("detObs").textContent = p.observaciones || "";
        document.getElementById("detTotal").textContent = p.total.toFixed(2);

        const selectEstado = document.getElementById("estadoNuevo");
        const estadoActual = (p.estado || "").toUpperCase();
        if (estadoActual) {
            selectEstado.value = estadoActual;
        }

        const tbodyDetalles = document.getElementById("tablaDetalles");
        tbodyDetalles.innerHTML = "";

        if (p.detalles && p.detalles.length > 0) {
            p.detalles.forEach(d => {
                const nombreProd = d.producto ? d.producto.nombre : `Producto #${d.productoId}`;
                tbodyDetalles.innerHTML += `
                    <tr>
                        <td>${nombreProd}</td>
                        <td>$ ${d.precioUnitario.toFixed(2)}</td>
                        <td>${d.cantidad}</td>
                        <td>$ ${d.totalLinea.toFixed(2)}</td>
                    </tr>
                `;
            });
        } else {
            tbodyDetalles.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">Sin ítems</td>
                </tr>
            `;
        }

        modalDetalle.show();

    } catch (err) {
        console.error(err);
        alert("Error al obtener el detalle del pedido");
    }
}

async function guardarEstadoPedido() {
    const id = document.getElementById("detPedidoIdHidden").value;
    const nuevoEstado = document.getElementById("estadoNuevo").value;

    if (!id) {
        alert("No se encontró el ID del pedido.");
        return;
    }

    try {
        const body = { estado: nuevoEstado };

        const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            alert((data && data.error) || "Error al actualizar el estado");
            return;
        }

        const pedidoActualizado = await res.json();
        document.getElementById("detEstado").innerHTML = getBadgeEstado(pedidoActualizado.estado);

        alert("Estado actualizado correctamente");
        cargarPedidos();

    } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado del pedido");
    }
}

// ======================== NUEVO PEDIDO ========================

async function abrirModalNuevoPedido() {
    // limpiar form
    document.getElementById("selectClientePedido").value = "";
    document.getElementById("obsPedido").value = "";
    document.getElementById("tbodyItemsPedido").innerHTML = "";

    // cargar clientes y productos si no los tenemos
    await cargarClientesYProductos();

    // agregar una fila por defecto
    agregarFilaItem();

    modalNuevo.show();
}

async function cargarClientesYProductos() {
    try {
        if (clientesCache.length === 0) {
            const resCli = await fetch(`${API_URL}/clientes`, {
                headers: { "X-Rol": "ADMIN" }
            });
            if (resCli.ok) {
                clientesCache = await resCli.json();
                llenarSelectClientes();
            } else {
                alert("No se pudieron obtener clientes (¿rol ADMIN?)");
            }
        } else {
            llenarSelectClientes();
        }

        if (productosCache.length === 0) {
            const resProd = await fetch(`${API_URL}/productos`);
            if (resProd.ok) {
                productosCache = await resProd.json();
            } else {
                alert("No se pudieron obtener productos");
            }
        }

    } catch (err) {
        console.error(err);
        alert("Error al cargar clientes/productos");
    }
}

function llenarSelectClientes() {
    const select = document.getElementById("selectClientePedido");
    // dejar la opción "Seleccione un cliente" (value = "")
    select.innerHTML = `<option value="">Seleccione un cliente</option>`;
    clientesCache.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.nombre} ${c.apellido} (DNI: ${c.dni})`;
        select.appendChild(opt);
    });
}

function agregarFilaItem() {
    const tbody = document.getElementById("tbodyItemsPedido");

    const tr = document.createElement("tr");
    tr.classList.add("item-pedido-row");

    const tdProducto = document.createElement("td");
    const selectProd = document.createElement("select");
    selectProd.className = "form-select form-select-sm selectProducto";
    selectProd.innerHTML = `<option value="">Seleccione producto</option>`;
    productosCache.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.nombre} (Stock: ${p.stock})`;
        selectProd.appendChild(opt);
    });
    tdProducto.appendChild(selectProd);

    const tdCantidad = document.createElement("td");
    const inputCant = document.createElement("input");
    inputCant.type = "number";
    inputCant.min = "1";
    inputCant.step = "1";
    inputCant.value = "1";
    inputCant.className = "form-control form-control-sm inputCantidad";
    tdCantidad.appendChild(inputCant);

    const tdAcciones = document.createElement("td");
    const btnQuitar = document.createElement("button");
    btnQuitar.type = "button";
    btnQuitar.className = "btn btn-outline-danger btn-sm";
    btnQuitar.textContent = "Quitar";
    btnQuitar.addEventListener("click", () => tr.remove());
    tdAcciones.appendChild(btnQuitar);

    tr.appendChild(tdProducto);
    tr.appendChild(tdCantidad);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
}

async function onSubmitNuevoPedido(e) {
    e.preventDefault();

    const clienteId = document.getElementById("selectClientePedido").value;
    const observaciones = document.getElementById("obsPedido").value.trim();

    if (!clienteId) {
        alert("Debe seleccionar un cliente.");
        return;
    }

    const filas = document.querySelectorAll(".item-pedido-row");
    const items = [];

    filas.forEach(row => {
        const selectProd = row.querySelector(".selectProducto");
        const inputCant = row.querySelector(".inputCantidad");

        const productoId = parseInt(selectProd.value, 10);
        const cantidad = parseInt(inputCant.value, 10);

        if (!isNaN(productoId) && productoId > 0 && !isNaN(cantidad) && cantidad > 0) {
            items.push({
                productoId: productoId,
                cantidad: cantidad
            });
        }
    });

    if (items.length === 0) {
        alert("Debe agregar al menos un ítem con producto y cantidad válida.");
        return;
    }

    const body = {
        clienteId: parseInt(clienteId, 10),
        observaciones: observaciones || null,
        items: items
    };

    try {
        const res = await fetch(`${API_URL}/pedidos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.status === 201) {
            alert("Pedido creado correctamente");
            modalNuevo.hide();
            cargarPedidos();
        } else {
            const data = await res.json().catch(() => null);
            alert((data && data.error) || "Error al crear el pedido");
        }

    } catch (err) {
        console.error(err);
        alert("Error al comunicarse con la API al crear el pedido");
    }
}
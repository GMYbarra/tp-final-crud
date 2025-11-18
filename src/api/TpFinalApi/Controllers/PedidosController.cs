using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TpFinalApi.Data;
using TpFinalApi.DTOs;
using TpFinalApi.Models;

[ApiController]
[Route("[controller]")]
public class PedidosController : ControllerBase
{
    private readonly AppDbContext _db;
    public PedidosController(AppDbContext db) => _db = db;

    // GET /pedidos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
    {
        var pedidos = await _db.Pedidos
                               .Include(p => p.Cliente)
                               .OrderByDescending(p => p.FechaPedido)
                               .ToListAsync();
        return Ok(pedidos);
    }

    // GET /pedidos/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Pedido>> GetPedido(int id)
    {
        var pedido = await _db.Pedidos
                              .Include(p => p.Cliente)
                              .Include(p => p.Detalles)
                                  .ThenInclude(d => d.Producto)
                              .FirstOrDefaultAsync(p => p.Id == id);

        if (pedido is null) return NotFound();
        return Ok(pedido);
    }

    // POST /pedidos
    [HttpPost]
    public async Task<ActionResult<Pedido>> CrearPedido([FromBody] PedidoCreateDTO dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            return BadRequest(new { error = "El pedido debe tener al menos un ítem." });

        var cliente = await _db.Clientes.FindAsync(dto.ClienteId);
        if (cliente is null)
            return BadRequest(new { error = $"No existe cliente con id {dto.ClienteId}." });

        // Cargar productos necesarios en memoria
        var productoIds = dto.Items.Select(i => i.ProductoId).Distinct().ToList();
        var productos = await _db.Productos
                                 .Where(p => productoIds.Contains(p.Id))
                                 .ToDictionaryAsync(p => p.Id);

        // Validaciones de productos / stock
        foreach (var item in dto.Items)
        {
            if (!productos.TryGetValue(item.ProductoId, out var prod))
                return BadRequest(new { error = $"No existe producto con id {item.ProductoId}." });

            if (item.Cantidad <= 0)
                return BadRequest(new { error = $"La cantidad del producto {prod.Nombre} debe ser mayor a 0." });

            if (prod.Stock < item.Cantidad)
                return BadRequest(new { error = $"No hay stock suficiente para el producto {prod.Nombre}." });
        }

        var pedido = new Pedido
        {
            ClienteId = dto.ClienteId,
            FechaPedido = DateTime.Now,
            Estado = "PENDIENTE",
            Observaciones = dto.Observaciones,
            FechaCreacion = DateTime.Now,
            Total = 0m
        };

        foreach (var item in dto.Items)
        {
            var prod = productos[item.ProductoId];

            var detalle = new PedidoDetalle
            {
                ProductoId = prod.Id,
                Cantidad = item.Cantidad,
                PrecioUnitario = prod.Precio,
                TotalLinea = prod.Precio * item.Cantidad
            };

            pedido.Total += detalle.TotalLinea;
            pedido.Detalles.Add(detalle);

            // Actualizar stock
            prod.Stock -= item.Cantidad;
        }

        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
    }

    // PUT /pedidos/{id}/estado
    [HttpPut("{id:int}/estado")]
    public async Task<ActionResult<Pedido>> ActualizarEstado(int id, [FromBody] PedidoEstadoUpdateDTO dto)
    {
        var pedido = await _db.Pedidos.FindAsync(id);
        if (pedido is null) return NotFound();

        var estadoNormalizado = dto.Estado?.ToUpperInvariant();

        // ahora contemplamos los 4 estados de la BD
        var estadosValidos = new[] { "PENDIENTE", "CONFIRMADO", "ENVIADO", "CANCELADO" };
        if (!estadosValidos.Contains(estadoNormalizado))
            return BadRequest(new { error = "Estado inválido. Use PENDIENTE, CONFIRMADO, ENVIADO o CANCELADO." });

        pedido.Estado = estadoNormalizado;
        await _db.SaveChangesAsync();

        return Ok(pedido);
    }
}

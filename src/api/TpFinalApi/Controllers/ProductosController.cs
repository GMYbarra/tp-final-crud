using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TpFinalApi.Data;
using TpFinalApi.DTOs;
using TpFinalApi.Models;

[ApiController]
[Route("[controller]")]
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductosController(AppDbContext db) => _db = db;

    // GET /productos  (opcional: ?q=texto&pagina=1&tamanio=20)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Producto>>> GetProductos([FromQuery] string? q, [FromQuery] int pagina = 1, [FromQuery] int tamanio = 50)
    {
        if (pagina < 1) pagina = 1;
        if (tamanio < 1 || tamanio > 100) tamanio = 50;

        var query = _db.Productos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Nombre.Contains(q) || p.Codigo.Contains(q));

        var items = await query
            .OrderByDescending(p => p.Id)
            .Skip((pagina - 1) * tamanio)
            .Take(tamanio)
            .ToListAsync();

        return Ok(items);
    }

    // GET /productos/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Producto>> GetProducto(int id)
    {
        var prod = await _db.Productos.FindAsync(id);
        return prod is null ? NotFound() : Ok(prod);
    }

    // POST /productos
    [HttpPost]
    public async Task<ActionResult<Producto>> CrearProducto([FromBody] ProductoCreateDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { error = "Codigo y Nombre son obligatorios." });
        if (dto.Precio < 0 || dto.Stock < 0)
            return BadRequest(new { error = "Precio y Stock no pueden ser negativos." });

        // validar código único
        var existe = await _db.Productos.AnyAsync(p => p.Codigo == dto.Codigo);
        if (existe) return Conflict(new { error = "El código ya existe." });

        var prod = new Producto
        {
            Codigo = dto.Codigo,
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            Precio = dto.Precio,
            Stock = dto.Stock,
            Activo = dto.Activo,
            FechaCreacion = DateTime.Now,
            FechaModificacion = DateTime.Now
        };

        _db.Productos.Add(prod);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProducto), new { id = prod.Id }, prod);
    }

    // PUT /productos/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Producto>> ActualizarProducto(int id, [FromBody] ProductoUpdateDTO dto)
    {
        var prod = await _db.Productos.FindAsync(id);
        if (prod is null) return NotFound();

        if (dto.Precio < 0 || dto.Stock < 0)
            return BadRequest(new { error = "Precio y Stock no pueden ser negativos." });

        prod.Nombre = dto.Nombre;
        prod.Descripcion = dto.Descripcion;
        prod.Precio = dto.Precio;
        prod.Stock = dto.Stock;
        prod.Activo = dto.Activo;
        prod.FechaModificacion = DateTime.Now;

        await _db.SaveChangesAsync();
        return Ok(prod);
    }

    // DELETE /productos/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        var prod = await _db.Productos.FindAsync(id);
        if (prod is null) return NotFound();

        _db.Productos.Remove(prod);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

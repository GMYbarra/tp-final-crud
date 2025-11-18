using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TpFinalApi.Data;
using TpFinalApi.DTOs;
using TpFinalApi.Models;

[ApiController]
[Route("[controller]")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _db;
    public ClientesController(AppDbContext db) => _db = db;

    // --- Helper: simulamos autorización por rol vía header ---
    private bool EsAdmin(string? rol)
    {
        return string.Equals(rol, "ADMIN", StringComparison.OrdinalIgnoreCase);
    }

    private ActionResult ForbidAdmin()
    {
        return StatusCode(StatusCodes.Status403Forbidden,
            new { error = "Solo los usuarios con rol ADMIN pueden operar sobre clientes." });
    }

    // GET /clientes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes(
            [FromHeader(Name = "X-Rol")] string? rol)
    {
        if (!EsAdmin(rol)) return ForbidAdmin();

        var list = await _db.Clientes
                            .OrderBy(c => c.Apellido)
                            .ThenBy(c => c.Nombre)
                            .ToListAsync();
        return Ok(list);
    }

    // GET /clientes/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Cliente>> GetCliente(
        int id,
        [FromHeader(Name = "X-Rol")] string? rol)
    {
        if (!EsAdmin(rol)) return ForbidAdmin();

        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente is null) return NotFound();

        return Ok(cliente);
    }

    // POST /clientes
    [HttpPost]
    public async Task<ActionResult<Cliente>> CrearCliente(
        [FromBody] ClienteCreateDTO dto,
        [FromHeader(Name = "X-Rol")] string? rol)
    {
        if (!EsAdmin(rol)) return ForbidAdmin();

        if (string.IsNullOrWhiteSpace(dto.Dni) ||
            string.IsNullOrWhiteSpace(dto.Nombre) ||
            string.IsNullOrWhiteSpace(dto.Apellido))
        {
            return BadRequest(new { error = "Dni, Nombre y Apellido son obligatorios." });
        }

        var existeDni = await _db.Clientes.AnyAsync(c => c.Dni == dto.Dni);
        if (existeDni)
            return Conflict(new { error = $"Ya existe un cliente con DNI {dto.Dni}." });

        var cliente = new Cliente
        {
            Dni = dto.Dni,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Email = dto.Email,
            Telefono = dto.Telefono,
            Direccion = dto.Direccion,
            FechaCreacion = DateTime.Now
        };

        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
    }

    // PUT /clientes/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Cliente>> ActualizarCliente(
        int id,
        [FromBody] ClienteUpdateDto dto,
        [FromHeader(Name = "X-Rol")] string? rol)
    {
        if (!EsAdmin(rol)) return ForbidAdmin();

        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente is null) return NotFound();

        cliente.Nombre = dto.Nombre;
        cliente.Apellido = dto.Apellido;
        cliente.Email = dto.Email;
        cliente.Telefono = dto.Telefono;
        cliente.Direccion = dto.Direccion;

        await _db.SaveChangesAsync();

        return Ok(cliente);
    }

    // DELETE /clientes/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarCliente(
        int id,
        [FromHeader(Name = "X-Rol")] string? rol)
    {
        if (!EsAdmin(rol)) return ForbidAdmin();

        var cliente = await _db.Clientes.FindAsync(id);
        if (cliente is null) return NotFound();

        _db.Clientes.Remove(cliente);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Por si está referenciado por pedidos
            return Conflict(new { error = "No se puede eliminar el cliente porque tiene registros asociados (por ejemplo, pedidos)." });
        }

        return NoContent();
    }
}

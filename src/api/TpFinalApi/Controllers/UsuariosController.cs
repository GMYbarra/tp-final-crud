using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TpFinalApi.Data;
using TpFinalApi.DTOs;
using TpFinalApi.Models;

[ApiController]
[Route("[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsuariosController(AppDbContext context) => _context = context;

    // GET /usuarios  -> listado
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Usuario>>> GetUsuarios()
    {
        var list = await _context.Usuarios
                                 .Include(u => u.Rol)
                                 .Include(u => u.Cliente)
                                 .ToListAsync();
        return Ok(list);
    }

    // GET /usuarios/{id} -> devuelve 1 usuario
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Usuario>> GetUsuario(int id)
    {
        var usuario = await _context.Usuarios
                                    .Include(u => u.Rol)
                                    .Include(u => u.Cliente)
                                    .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null) return NotFound();
        return Ok(usuario);
    }

    // POST /usuarios
    [HttpPost]
    public async Task<ActionResult<Usuario>> CrearUsuario([FromBody] UsuarioCreateDto dto)
    {
        // Validaciones simples
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "username, email y password son obligatorios." });

        // Verificar rol existente
        var rol = await _context.Roles.FindAsync(dto.RolId);
        if (rol == null)
            return BadRequest(new { error = $"Rol con id {dto.RolId} no existe." });

        // Si vino clienteId, verificar que exista
        if (dto.ClienteId.HasValue)
        {
            var cliente = await _context.Clientes.FindAsync(dto.ClienteId.Value);
            if (cliente == null)
                return BadRequest(new { error = $"Cliente con id {dto.ClienteId.Value} no existe." });
        }

        var usuario = new Usuario
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            RolId = dto.RolId,
            ClienteId = dto.ClienteId,
            FechaNacimiento = dto.FechaNacimiento,
            Telefono = dto.Telefono,
            Activo = true,
            FechaCreacion = DateTime.Now
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        // Referencia al GET por id que creamos arriba
        return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, usuario);
    }
}

namespace TpFinalApi.Models
{
    public class Usuario
    {
        public int Id { get; set; }

        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime? FechaNacimiento { get; set; }
        public string? Telefono { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? UltimoLogin { get; set; }

        // relación con Rol
        public int RolId { get; set; }
        public Rol Rol { get; set; }

        // relación con Cliente
        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }
    }
}

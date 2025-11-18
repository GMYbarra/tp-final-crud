namespace TpFinalApi.DTOs
{
    public class UsuarioCreateDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RolId { get; set; }
        public int? ClienteId { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string? Telefono { get; set; }
    }
}

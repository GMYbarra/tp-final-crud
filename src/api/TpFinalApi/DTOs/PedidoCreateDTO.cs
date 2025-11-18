namespace TpFinalApi.DTOs
{
    public class PedidoCreateDTO
    {
        public int ClienteId { get; set; }
        public string? Observaciones { get; set; }
        public List<PedidoItemDTO> Items { get; set; } = new();
    }
}
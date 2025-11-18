namespace TpFinalApi.Models
{
    public class Pedido
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        public DateTime FechaPedido { get; set; }
        public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE / CONFIRMADO / ENVIADO / CANCELADO
        public decimal Total { get; set; }
        public string? Observaciones { get; set; }
        public DateTime FechaCreacion { get; set; }

        public List<PedidoDetalle> Detalles { get; set; } = new();
    }
}
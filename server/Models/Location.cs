namespace NeighborhoodBoard.Api.Models;

public sealed class AdLocation
{
    public string Address { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
}

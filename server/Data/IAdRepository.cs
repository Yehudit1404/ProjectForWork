using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Data;

public interface IAdRepository
{
    Task<List<Ad>> GetAllAsync();
    Task<Ad?> GetByIdAsync(string id);
    Task<Ad> AddAsync(Ad ad);
    Task<Ad?> UpdateAsync(Ad ad);
    Task<bool> DeleteAsync(string id);
}

using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Services;

public interface IAdService
{
    Task<PagedResult<AdResponse>> GetAllAsync(AdQuery query);
    Task<AdResponse> GetByIdAsync(string id);
    Task<AdResponse> CreateAsync(CreateAdRequest request);
    Task<AdResponse> UpdateAsync(string id, string requestOwnerId, UpdateAdRequest request);
    Task DeleteAsync(string id, string requestOwnerId);
}

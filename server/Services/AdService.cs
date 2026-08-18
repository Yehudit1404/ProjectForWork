using NeighborhoodBoard.Api.Data;
using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Services;

public sealed class AdService(IAdRepository repository) : IAdService
{
    // ~2MB of binary data, base64-encoded (base64 is ~4/3 the size of the source bytes).
    private const int MaxImageBase64Length = 2_800_000;

    public async Task<PagedResult<AdResponse>> GetAllAsync(AdQuery query)
    {
        var all = await repository.GetAllAsync();

        IEnumerable<Ad> filtered = all;

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            filtered = filtered.Where(a =>
                a.Title.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                a.Description.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            filtered = filtered.Where(a => string.Equals(a.Category, query.Category, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.OwnerId))
        {
            filtered = filtered.Where(a => a.OwnerId == query.OwnerId);
        }

        var hasReferencePoint = query.Lat.HasValue && query.Lng.HasValue;

        var withDistance = filtered
            .Select(ad => (Ad: ad, DistanceKm: hasReferencePoint && ad.Location is not null
                ? GeoDistanceCalculator.HaversineKm(query.Lat!.Value, query.Lng!.Value, ad.Location.Lat, ad.Location.Lng)
                : (double?)null))
            .ToList();

        if (hasReferencePoint && query.RadiusKm.HasValue)
        {
            withDistance = withDistance
                .Where(x => x.DistanceKm.HasValue && x.DistanceKm.Value <= query.RadiusKm.Value)
                .ToList();
        }

        IEnumerable<(Ad Ad, double? DistanceKm)> sorted = string.Equals(query.SortBy, "distance", StringComparison.OrdinalIgnoreCase) && hasReferencePoint
            ? withDistance.OrderBy(x => x.DistanceKm ?? double.MaxValue)
            : withDistance.OrderByDescending(x => x.Ad.CreatedAt);

        var sortedList = sorted.ToList();
        var totalCount = sortedList.Count;
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 300);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var pageItems = sortedList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => AdResponse.FromAd(x.Ad, x.DistanceKm))
            .ToList();

        return new PagedResult<AdResponse>
        {
            Items = pageItems,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
        };
    }

    public async Task<AdResponse> GetByIdAsync(string id)
    {
        var ad = await repository.GetByIdAsync(id) ?? throw new AdNotFoundException(id);
        return AdResponse.FromAd(ad);
    }

    public async Task<AdResponse> CreateAsync(CreateAdRequest request)
    {
        ValidateCategory(request.Category);
        ValidateImage(request.ImageBase64);

        var now = DateTimeOffset.UtcNow;
        var ad = new Ad
        {
            Id = Guid.NewGuid().ToString(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category,
            Price = request.Price,
            ImageBase64 = request.ImageBase64,
            OwnerId = request.OwnerId,
            OwnerName = request.OwnerName.Trim(),
            Location = ToLocation(request.Location),
            CreatedAt = now,
            UpdatedAt = now,
        };

        var created = await repository.AddAsync(ad);
        return AdResponse.FromAd(created);
    }

    public async Task<AdResponse> UpdateAsync(string id, string requestOwnerId, UpdateAdRequest request)
    {
        ValidateCategory(request.Category);
        ValidateImage(request.ImageBase64);

        var existing = await repository.GetByIdAsync(id) ?? throw new AdNotFoundException(id);
        if (existing.OwnerId != requestOwnerId)
        {
            throw new AdForbiddenException();
        }

        existing.Title = request.Title.Trim();
        existing.Description = request.Description.Trim();
        existing.Category = request.Category;
        existing.Price = request.Price;
        existing.ImageBase64 = request.ImageBase64;
        existing.Location = ToLocation(request.Location);
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        var updated = await repository.UpdateAsync(existing) ?? throw new AdNotFoundException(id);
        return AdResponse.FromAd(updated);
    }

    public async Task DeleteAsync(string id, string requestOwnerId)
    {
        var existing = await repository.GetByIdAsync(id) ?? throw new AdNotFoundException(id);
        if (existing.OwnerId != requestOwnerId)
        {
            throw new AdForbiddenException();
        }

        await repository.DeleteAsync(id);
    }

    private static void ValidateCategory(string category)
    {
        if (!Categories.IsValid(category))
        {
            throw new AdValidationException($"'{category}' is not a recognized category.");
        }
    }

    private static void ValidateImage(string? imageBase64)
    {
        if (imageBase64 is not null && imageBase64.Length > MaxImageBase64Length)
        {
            throw new AdValidationException("Image is too large (maximum ~2MB).");
        }
    }

    private static AdLocation? ToLocation(LocationDto? dto) => dto is null
        ? null
        : new AdLocation { Address = dto.Address, Lat = dto.Lat, Lng = dto.Lng };
}

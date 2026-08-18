using System.ComponentModel.DataAnnotations;

namespace NeighborhoodBoard.Api.Models;

public sealed class LocationDto
{
    [Required, StringLength(300, MinimumLength = 1)]
    public string Address { get; set; } = string.Empty;

    [Range(-90, 90)]
    public double Lat { get; set; }

    [Range(-180, 180)]
    public double Lng { get; set; }
}

public sealed class CreateAdRequest
{
    [Required, StringLength(80, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(1000, MinimumLength = 1)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }

    public string? ImageBase64 { get; set; }

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    [Required, StringLength(60, MinimumLength = 1)]
    public string OwnerName { get; set; } = string.Empty;

    public LocationDto? Location { get; set; }
}

public sealed class UpdateAdRequest
{
    [Required, StringLength(80, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(1000, MinimumLength = 1)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }

    public string? ImageBase64 { get; set; }

    public LocationDto? Location { get; set; }
}

public sealed class AdResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public string? ImageBase64 { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public AdLocation? Location { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public double? DistanceKm { get; set; }

    public static AdResponse FromAd(Ad ad, double? distanceKm = null) => new()
    {
        Id = ad.Id,
        Title = ad.Title,
        Description = ad.Description,
        Category = ad.Category,
        Price = ad.Price,
        ImageBase64 = ad.ImageBase64,
        OwnerId = ad.OwnerId,
        OwnerName = ad.OwnerName,
        Location = ad.Location,
        CreatedAt = ad.CreatedAt,
        UpdatedAt = ad.UpdatedAt,
        DistanceKm = distanceKm,
    };
}

public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

public sealed class CategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool PriceRelevant { get; set; }
    public string Icon { get; set; } = string.Empty;
}

public sealed class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public Dictionary<string, string[]>? Details { get; set; }
}

public sealed class AdQuery
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? OwnerId { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? RadiusKm { get; set; }
    public string SortBy { get; set; } = "newest"; // newest | distance
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

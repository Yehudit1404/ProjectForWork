using Microsoft.AspNetCore.Mvc;
using NeighborhoodBoard.Api.Models;
using NeighborhoodBoard.Api.Services;

namespace NeighborhoodBoard.Api.Controllers;

[ApiController]
[Route("api/ads")]
public sealed class AdsController(IAdService adService) : ControllerBase
{
    private const string OwnerHeaderName = "X-Owner-Id";

    /// <summary>
    /// Returns a filtered, sorted, paginated list of ads. See spec section 4.4
    /// for the full set of supported query parameters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AdResponse>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? ownerId,
        [FromQuery] double? lat,
        [FromQuery] double? lng,
        [FromQuery] double? radiusKm,
        [FromQuery] string sortBy = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = new AdQuery
        {
            Search = search,
            Category = category,
            OwnerId = ownerId,
            Lat = lat,
            Lng = lng,
            RadiusKm = radiusKm,
            SortBy = sortBy,
            Page = page,
            PageSize = pageSize,
        };

        var result = await adService.GetAllAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdResponse>> GetById(string id)
    {
        var ad = await adService.GetByIdAsync(id);
        return Ok(ad);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdResponse>> Create([FromBody] CreateAdRequest request)
    {
        var created = await adService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdResponse>> Update(string id, [FromBody] UpdateAdRequest request)
    {
        var ownerId = GetOwnerIdOrThrow();
        var updated = await adService.UpdateAsync(id, ownerId, request);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var ownerId = GetOwnerIdOrThrow();
        await adService.DeleteAsync(id, ownerId);
        return NoContent();
    }

    private string GetOwnerIdOrThrow()
    {
        if (!Request.Headers.TryGetValue(OwnerHeaderName, out var values) || string.IsNullOrWhiteSpace(values.ToString()))
        {
            throw new AdValidationException($"Missing required '{OwnerHeaderName}' header.");
        }

        return values.ToString();
    }
}

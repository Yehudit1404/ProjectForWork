using Microsoft.AspNetCore.Mvc;
using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
    public ActionResult<List<CategoryDto>> GetAll()
    {
        var result = Categories.All.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.NameHe,
            Color = c.Color,
            PriceRelevant = c.PriceRelevant,
            Icon = c.Icon,
        }).ToList();

        return Ok(result);
    }
}

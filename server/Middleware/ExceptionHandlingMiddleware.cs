using System.Net;
using System.Text.Json;
using NeighborhoodBoard.Api.Models;
using NeighborhoodBoard.Api.Services;

namespace NeighborhoodBoard.Api.Middleware;

// Central place that turns any exception - expected (not found / forbidden /
// validation) or not - into the uniform { error, details } JSON shape the
// client's HTTP error interceptor expects (spec section 4.7).
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, message) = ex switch
            {
                AdNotFoundException => (HttpStatusCode.NotFound, ex.Message),
                AdForbiddenException => (HttpStatusCode.Forbidden, ex.Message),
                AdValidationException => (HttpStatusCode.BadRequest, ex.Message),
                _ => (HttpStatusCode.InternalServerError, "An unexpected server error occurred."),
            };

            if (statusCode == HttpStatusCode.InternalServerError)
            {
                logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);
            }
            else
            {
                logger.LogWarning(ex, "Handled exception ({StatusCode}) while processing {Path}", statusCode, context.Request.Path);
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var response = new ErrorResponse { Error = message };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, _jsonOptions));
        }
    }
}

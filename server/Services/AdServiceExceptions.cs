namespace NeighborhoodBoard.Api.Services;

public sealed class AdNotFoundException(string id) : Exception($"Ad '{id}' was not found.");

public sealed class AdForbiddenException()
    : Exception("The supplied owner does not match the ad's owner; update/delete is not allowed.");

public sealed class AdValidationException(string message) : Exception(message);

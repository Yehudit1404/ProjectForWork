namespace NeighborhoodBoard.Api.Models;

public sealed record CategoryDefinition(string Id, string NameHe, string Color, bool PriceRelevant, string Icon);

public static class Categories
{
    public static readonly IReadOnlyList<CategoryDefinition> All = new List<CategoryDefinition>
    {
        new("BuySell", "מכירה ויד שנייה", "#D6336C", true, "sell"),
        new("Rentals", "השכרות", "#7B1FA2", true, "key"),
        new("Events", "אירועים", "#1976D2", false, "event"),
        new("Travel", "טיולים ופנאי", "#2E7D32", false, "luggage"),
        new("General", "כללי", "#616161", false, "category"),
    };

    private static readonly HashSet<string> ValidIds = All.Select(c => c.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static bool IsValid(string? categoryId) => categoryId is not null && ValidIds.Contains(categoryId);

    public static CategoryDefinition? Find(string categoryId) =>
        All.FirstOrDefault(c => string.Equals(c.Id, categoryId, StringComparison.OrdinalIgnoreCase));
}

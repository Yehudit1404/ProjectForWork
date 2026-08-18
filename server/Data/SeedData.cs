using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Data;

// Sample ads shown on first run, spread across all categories and a few real
// Israeli locations so the "nearby" (Google Maps bonus) filter has something
// meaningful to demonstrate out of the box. Each one gets an illustration
// rendered locally into Data/SeedImages (not fetched from the internet) so
// the board looks fully populated without shipping any external image URLs.
public static class SeedData
{
    public static List<Ad> Generate(string seedImagesDir)
    {
        var now = DateTimeOffset.UtcNow;
        const string demoOwnerId = "00000000-0000-4000-8000-000000000001";

        return new List<Ad>
        {
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "אופניים חשמליים כמעט חדשים",
                Description = "אופניים חשמליים במצב מצוין, נסועים כ-300 ק\"מ בלבד, כולל מטען וקסדה. סיבת מכירה - עברתי לרכב.",
                Category = "BuySell",
                Price = 2400,
                ImageBase64 = LoadImage(seedImagesDir, "01-bicycle.jpg"),
                OwnerId = demoOwnerId,
                OwnerName = "דנה כהן",
                Location = new AdLocation { Address = "רחוב דיזנגוף 100, תל אביב-יפו", Lat = 32.0809, Lng = 34.7806 },
                CreatedAt = now.AddDays(-1),
                UpdatedAt = now.AddDays(-1),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "ספה תלת-מושבית למסירה",
                Description = "ספה נוחה בצבע אפור, מצב טוב, קצת שריטות רגליים. איסוף עצמי בלבד.",
                Category = "BuySell",
                Price = 0,
                ImageBase64 = LoadImage(seedImagesDir, "02-sofa.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000002",
                OwnerName = "יוסי לוי",
                Location = new AdLocation { Address = "שדרות רוטשילד 25, תל אביב-יפו", Lat = 32.0656, Lng = 34.7719 },
                CreatedAt = now.AddDays(-2),
                UpdatedAt = now.AddDays(-2),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "חדר להשכרה בדירת שותפים",
                Description = "חדר מרוהט בדירת 4 חדרים, קרוב לתחבורה ציבורית ולמרכז העיר. כניסה מיידית.",
                Category = "Rentals",
                Price = 2800,
                ImageBase64 = LoadImage(seedImagesDir, "03-room.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000003",
                OwnerName = "מיכל אברהם",
                Location = new AdLocation { Address = "רחוב אבן גבירול 50, תל אביב-יפו", Lat = 32.0837, Lng = 34.7822 },
                CreatedAt = now.AddDays(-3),
                UpdatedAt = now.AddDays(-3),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "השכרת ציוד קמפינג לסוף שבוע",
                Description = "אוהל ל-4 אנשים, שקי שינה ומחצלות. מתאים לטיול קצר, כולל הדרכה קצרה על הרכבה.",
                Category = "Rentals",
                Price = 150,
                ImageBase64 = LoadImage(seedImagesDir, "04-tent.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000004",
                OwnerName = "אלון שגיא",
                Location = new AdLocation { Address = "דרך יפו 45, ירושלים", Lat = 31.7857, Lng = 35.2192 },
                CreatedAt = now.AddDays(-4),
                UpdatedAt = now.AddDays(-4),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "ערב שירה בציבור בפארק השכונתי",
                Description = "מפגש שכונתי חופשי לכולם, מביאים כיסא/שמיכה. יהיו כיבוד קל ותופים לכל מי שרוצה.",
                Category = "Events",
                Price = null,
                ImageBase64 = LoadImage(seedImagesDir, "05-music-event.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000005",
                OwnerName = "ועד השכונה",
                Location = new AdLocation { Address = "פארק הירקון, תל אביב-יפו", Lat = 32.0933, Lng = 34.7873 },
                CreatedAt = now.AddHours(-20),
                UpdatedAt = now.AddHours(-20),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "סדנת בישול קהילתית - מטבח איטלקי",
                Description = "סדנה חד פעמית, מקומות מוגבלים, נא להירשם מראש. מחיר כולל את כל החומרים.",
                Category = "Events",
                Price = 90,
                ImageBase64 = LoadImage(seedImagesDir, "06-cooking-class.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000006",
                OwnerName = "נועה ברק",
                Location = new AdLocation { Address = "רחוב הרצל 10, חיפה", Lat = 32.8156, Lng = 34.9892 },
                CreatedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-5),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "טרמפ/שיתוף נסיעה לטיול בצפון",
                Description = "יוצאים לסוף שבוע בגליל, יש מקום נוסף ברכב. חלוקת דלק והחזר הוצאות.",
                Category = "Travel",
                Price = null,
                ImageBase64 = LoadImage(seedImagesDir, "07-road-trip.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000007",
                OwnerName = "עידו רגב",
                Location = new AdLocation { Address = "כיכר פריז, חיפה", Lat = 32.8258, Lng = 34.9897 },
                CreatedAt = now.AddDays(-6),
                UpdatedAt = now.AddDays(-6),
            },
            new Ad
            {
                Id = Guid.NewGuid().ToString(),
                Title = "מציאה - שולחן עבודה מתכוונן גובה",
                Description = "שולחן עמידה/ישיבה חשמלי, שימוש מועט, מתאים לעבודה מהבית.",
                Category = "General",
                Price = 650,
                ImageBase64 = LoadImage(seedImagesDir, "08-desk.jpg"),
                OwnerId = "00000000-0000-4000-8000-000000000008",
                OwnerName = "רוני שמעוני",
                Location = new AdLocation { Address = "מתחם הבורסה, רמת גן", Lat = 32.0812, Lng = 34.8113 },
                CreatedAt = now.AddDays(-7),
                UpdatedAt = now.AddDays(-7),
            },
        };
    }

    private static string? LoadImage(string seedImagesDir, string fileName)
    {
        var path = Path.Combine(seedImagesDir, fileName);
        if (!File.Exists(path))
        {
            return null;
        }

        var bytes = File.ReadAllBytes(path);
        return $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
    }
}

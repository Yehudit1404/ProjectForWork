using System.Text.Json;
using NeighborhoodBoard.Api.Models;

namespace NeighborhoodBoard.Api.Data;

// Stores every ad as a single JSON array in one file on disk (per the spec's
// "local JSON file" storage requirement). All reads and writes funnel through
// a single semaphore so concurrent requests can never interleave and corrupt
// the file - there is no real database transaction log to fall back on here.
public sealed class JsonAdRepository : IAdRepository
{
    private readonly string _filePath;
    private readonly string _seedImagesDir;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public JsonAdRepository(IConfiguration configuration, IWebHostEnvironment env)
    {
        var configuredPath = configuration["AdsStorage:FilePath"];
        _filePath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.ContentRootPath, "Data", "Storage", "ads.json")
            : Path.Combine(env.ContentRootPath, configuredPath);
        _seedImagesDir = Path.Combine(env.ContentRootPath, "Data", "SeedImages");
    }

    public async Task<List<Ad>> GetAllAsync()
    {
        await _lock.WaitAsync();
        try
        {
            return await ReadAllInternalAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<Ad?> GetByIdAsync(string id)
    {
        var all = await GetAllAsync();
        return all.FirstOrDefault(a => a.Id == id);
    }

    public async Task<Ad> AddAsync(Ad ad)
    {
        await _lock.WaitAsync();
        try
        {
            var all = await ReadAllInternalAsync();
            all.Add(ad);
            await WriteAllInternalAsync(all);
            return ad;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<Ad?> UpdateAsync(Ad ad)
    {
        await _lock.WaitAsync();
        try
        {
            var all = await ReadAllInternalAsync();
            var index = all.FindIndex(a => a.Id == ad.Id);
            if (index == -1)
            {
                return null;
            }

            all[index] = ad;
            await WriteAllInternalAsync(all);
            return ad;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await _lock.WaitAsync();
        try
        {
            var all = await ReadAllInternalAsync();
            var removed = all.RemoveAll(a => a.Id == id);
            if (removed == 0)
            {
                return false;
            }

            await WriteAllInternalAsync(all);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    // Callers must already hold _lock before calling this.
    private async Task<List<Ad>> ReadAllInternalAsync()
    {
        var directory = Path.GetDirectoryName(_filePath)!;
        Directory.CreateDirectory(directory);

        if (!File.Exists(_filePath))
        {
            var seeded = SeedData.Generate(_seedImagesDir);
            await WriteAllInternalAsync(seeded);
            return seeded;
        }

        await using var stream = File.OpenRead(_filePath);
        var ads = await JsonSerializer.DeserializeAsync<List<Ad>>(stream, _jsonOptions);
        return ads ?? new List<Ad>();
    }

    // Callers must already hold _lock before calling this.
    private async Task WriteAllInternalAsync(List<Ad> ads)
    {
        var directory = Path.GetDirectoryName(_filePath)!;
        Directory.CreateDirectory(directory);

        var tempPath = _filePath + ".tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, ads, _jsonOptions);
        }

        File.Move(tempPath, _filePath, overwrite: true);
    }
}

using HealthDashboard.Services;
using HealthDashboard.Data;
using HealthDashboard.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<HealthDataService>();

// Enable Session (Syllabus: Server-Based State Management)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Configure Entity Framework with SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=HealthDashboard.db"));

// Configure ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    
    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure cookie settings
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.SlidingExpiration = true;
});

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Use Session middleware (Syllabus: Server-Based State)
app.UseSession();

// Add cache control headers to prevent browser caching of authenticated/protected pages
// This middleware runs AFTER authentication, so we know the auth state
app.Use(async (context, next) =>
{
    // Register a callback that runs just before the response starts
    // This is the correct way to modify headers
    context.Response.OnStarting(() =>
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";
        
        // Skip static assets (they're already handled by UseStaticFiles)
        if (!path.StartsWith("/lib/") && 
            !path.StartsWith("/css/") && 
            !path.StartsWith("/js/") && 
            !path.StartsWith("/images/") &&
            !path.EndsWith(".css") &&
            !path.EndsWith(".js") &&
            !path.EndsWith(".png") &&
            !path.EndsWith(".jpg") &&
            !path.EndsWith(".ico"))
        {
            // Set aggressive no-cache headers for all HTML pages
            // This forces the browser to always revalidate with the server
            context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "-1";
        }
        return Task.CompletedTask;
    });
    
    await next();
});

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

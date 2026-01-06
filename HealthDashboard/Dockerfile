# Use Microsoft's official .NET image.
# https://hub.docker.com/_/microsoft-dotnet-sdk/
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Copy the project file and restore dependencies
COPY HealthDashboard/HealthDashboard.csproj ./HealthDashboard/
RUN dotnet restore "./HealthDashboard/HealthDashboard.csproj"

# Copy the remaining source code
COPY HealthDashboard/. ./HealthDashboard/
WORKDIR /source/HealthDashboard

# Build and publish the application
RUN dotnet publish -c Release -o /app/publish

# Build the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# Expose the port Render expects (usually detected automatically, but good to be explicit)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "HealthDashboard.dll"]

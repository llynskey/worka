#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Worka.WebApp/Worka.WebApp.csproj", "Worka.WebApp/"]
COPY ["Worka.Services/Worka.Services.csproj", "Worka.Services/"]
RUN dotnet restore "Worka.WebApp/Worka.WebApp.csproj"
COPY . .
WORKDIR "/src/Worka.WebApp"
RUN dotnet build "Worka.WebApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Worka.WebApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Worka.WebApp.dll"]
#Use your choice of image as base. Mine is alpine! 
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-alpine AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-alpine AS build
WORKDIR /src
COPY . .

RUN dotnet restore "Worka/Worka.WebApp.csproj"
WORKDIR "/src/."
COPY . .
RUN dotnet build "Worka/Worka.WebApp.csproj" -c Release -o /app/build

FROM build as publish
RUN dotnet publish "Worka/WebApp.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS http://*:PORT_NUMBER
ENTRYPOINT ["dotnet", "Worka.WebApp.dll"]
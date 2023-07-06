using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Core.Configuration;
using System;
using Worka.Services.Database;

namespace Worka.Services
{
    class Program
    {
        static void Main(string[] args)
        {
            var startup = new Startup();

            var services = new ServiceCollection();
            startup.ConfigureServices(services);
        }     
    }
}

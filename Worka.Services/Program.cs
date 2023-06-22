using MongoDB.Bson;
using MongoDB.Driver;
using System;

namespace Worka.Services
{
    class Program
    {
        static void Main(string[] args)
        {
            const string connectionUri = "mongodb+srv://root:toor@worka.bcgzcvw.mongodb.net/?retryWrites=true&w=majority";
            var settings = MongoClientSettings.FromConnectionString(connectionUri);
            // Set the ServerApi field of the settings object to Stable API version 1
            settings.ServerApi = new ServerApi(ServerApiVersion.V1);
            // Create a new client and connect to the server
            var client = new MongoClient(settings);
            // Send a ping to confirm a successful connection
            try
            {
                var result = client.GetDatabase("Worka").RunCommand<BsonDocument>(new BsonDocument("ping", 1));
                Console.WriteLine("Pinged your deployment. You successfully connected to MongoDB!");
                var dbList = client.ListDatabases().ToList();

                Console.WriteLine("The list of databases on this server is: ");
                foreach (var db in dbList)
                {
                    Console.WriteLine(db);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
    }
}

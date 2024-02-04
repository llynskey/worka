using API.Models;
using Worka.Services.Database.DatabaseModels;
using Quote = Worka.Services.Database.DatabaseModels.Quote;
using User = Worka.Services.Database.Models.User;

namespace Worka.Services.Database
{
    public class MongoHelperContext
    {
        /// <summary>
        /// Database
        /// </summary>
        private readonly IMongoDatabase Database;

        /// <summary>
        /// User collection
        /// </summary>
        public readonly IMongoCollection<User> Users;

        /// <summary>
        /// Quote collection
        /// </summary>
        public readonly IMongoCollection<Quote> Quotes;

        /// <summary>
        /// Job collection
        /// </summary>
        public readonly IMongoCollection<Job> Jobs;

        // TODO: Add other collections i.e Jobs, Customers, Workers etc.

        public MongoHelperContext(IMongoDatabase database)
        {
            Database = database;
            Users = Database.GetCollection<User>("Users");
            Quotes = Database.GetCollection<Quote>("Quotes");
            Jobs = Database.GetCollection<Job>("Jobs");
        }

        public IMongoCollection<User> GetUserCollection()
        {
            return Users;
        }
    }
}
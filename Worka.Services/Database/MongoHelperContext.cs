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

        // TODO: Add other collections i.e Jobs, Customers, Workers etc.

        public MongoHelperContext(IMongoDatabase database)
        {
            Database = database;
            Users = Database.GetCollection<User>("Users");
        }

        public IMongoCollection<User> GetUserCollection()
        {
            return Users;
        }
    }
}
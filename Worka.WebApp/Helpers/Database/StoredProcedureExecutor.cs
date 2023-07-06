using Dapper;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace API.Helpers.Database
{
    public class StoredProcedureExecutor : IStoredProcedureExecutor
    {
        private readonly IDbConnection _connection;

        public StoredProcedureExecutor(IDbConnection connection)
        {
            _connection = connection;
        }

        public Task<T> QuerySingleOrDefault<T>(string storedProcedure, object param = null) =>
            _connection.QuerySingleOrDefaultAsync<T>(storedProcedure, param, commandType: CommandType.StoredProcedure);
        
        public Task<IEnumerable<T>> Query<T>(string storedProcedure, object param = null) =>
            _connection.QueryAsync<T>(storedProcedure, param, commandType: CommandType.StoredProcedure);

        public Task<int> Execute(string storedProcedure, object param = null) =>
            _connection.ExecuteScalarAsync<int>(storedProcedure, param, commandType: CommandType.StoredProcedure);
    }
}

using System.Collections.Generic;
using System.Threading.Tasks;

namespace API.Helpers.Database
{
    public interface IStoredProcedureExecutor
    {
        Task<int> Execute(string storedProcedure, object param = null);
        Task<IEnumerable<T>> Query<T>(string storedProcedure, object param = null);
        Task<T> QuerySingleOrDefault<T>(string storedProcedure, object param = null);
    }
}
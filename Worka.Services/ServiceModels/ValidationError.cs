using Newtonsoft.Json;

namespace Worka.Services.ServiceModels
{
    public class ValidationError
    {
        public string FieldName { get; }

        public string ErrorMessage { get; }

        [JsonIgnore]
        public string ErrorKey { get; }

        public ValidationError(string fieldName, string errorMessage, string errorKey = null)
        {
            FieldName = fieldName;
            ErrorMessage = errorMessage;
            ErrorKey = errorKey;
        }

        private bool Equals(ValidationError other)
        {
            return string.Equals(FieldName, other.FieldName) && string.Equals(ErrorMessage, other.ErrorMessage);
        }

        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj))
            {
                return false;
            }
            if (ReferenceEquals(this, obj))
            {
                return true;
            }
            return obj.GetType() == GetType() && Equals((ValidationError)obj);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                return ((FieldName?.GetHashCode() ?? 0) * 397) ^ (ErrorMessage?.GetHashCode() ?? 0);
            }
        }

        public override string ToString()
        {
            return FieldName + '=' + ErrorMessage;
        }
    }
}

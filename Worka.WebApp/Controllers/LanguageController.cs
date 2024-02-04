using Microsoft.AspNetCore.Mvc;

namespace Worka.WebApp.Controllers
{
    public class LanguageController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

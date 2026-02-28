using Backoffice.Contractor;
using Backoffice.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Security.Claims;
using System.Text;
using Web_Payment.Contractor;
using XAct;

namespace Backoffice
{

    public class BasePageModel : PageModel, IAsyncPageFilter
    {
        public string Token { get; set; }
        public string UseLang { get; private set; }
        public string UserNameLogin { get; set; } = "Null";
        public List<string> headtable { get; set; } = new List<string>();
        public int UserBranchid { get; set; } = 0;
        public string RoleUser { get; set; } 

        protected readonly LocalizationService _localizationService;
        protected readonly IConfiguration _configuration;
        public AccessContractor serviceAccess { get; private set; }
        public ManagementContractor serviceManagement { get; private set; }

        public BasePageModel(LocalizationService localizationService, IConfiguration configuration)
        {
            _localizationService = localizationService;
            serviceAccess = new AccessContractor(this);
            serviceManagement = new ManagementContractor(this);
            _configuration = configuration;
        }

        public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
        {
            try
            {

                if (HttpContext.Session.TryGetValue("AccessKey", out byte[] accessKeyBytes))
                {
                    Token = Encoding.UTF8.GetString(accessKeyBytes);
                    UseLang = Request.Query["lang"].ToString();
                    if (UseLang.IsNullOrEmpty()) { UseLang = _configuration["AppSettings:DefaultLanguage"]; }
                    _localizationService.SetLanguage(UseLang);
                    var ClientToken = await serviceAccess.ClientToken(Token, UseLang);
                    if (ClientToken.Success)
                    {
                        HttpContext.Session.SetString("AccessKey", Token);
                        UserNameLogin = HttpContext.Session.GetString("Username");
                        var branchIdString = User.Claims.FirstOrDefault(c => c.Type == "BranchId")?.Value;
                        UserBranchid = int.TryParse(branchIdString, out int id) ? id : 0;
                        RoleUser = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
                       
                        await next();
                    }
                    else
                    {
                        string message = ClientToken.ResponseMsg.ToString();
                        HttpContext.Session.SetString("showAlert", message);

                        context.Result = new RedirectToPageResult("/Login");
                    }

                }
                else
                {
                    string message = _localizationService.GetLocalizedText("The_token_is_invalid");
                    HttpContext.Session.SetString("showAlert", message);

                    context.Result = new RedirectToPageResult("/Login");
                }
            }
            catch (Exception ex)
            {
                // จับทุก exception และ redirect ไปหน้า error
                HttpContext.Session.SetString("Errormessage", ex.Message.ToString());
                context.Result = new RedirectToPageResult("/Error", new { Messagekey = "Errormessage" });

            }
        }
        // ต้อง implement แต่ไม่ต้องทำงาน
        public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context) => Task.CompletedTask;
    }
}

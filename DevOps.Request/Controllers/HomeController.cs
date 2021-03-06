﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using DevOps.Request.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace DevOps.Request.Controllers
{
    public class HomeController : Controller
    {
        private readonly IConfiguration Configuration;

        public HomeController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<JsonResult> SendRequest(DevOpsWorkItem workItem)
        {
            // must have a title
            if (workItem == null || string.IsNullOrWhiteSpace(workItem.Title))
            {
                return Json(new { success = false });
            }

            var result = await CreateWorkItem(workItem);
            return Json(new { success = true , result = result});
        }

        [HttpPost]
        private async Task<JsonResult> CreateWorkItem(DevOpsWorkItem workItem)
        {
            var organization = Configuration.GetConnectionString("Organization"); // todo add your organization
            var project = Configuration.GetConnectionString("Project"); // todo add your project
            var devOpsKey = Configuration.GetConnectionString("DevOpsKey"); // todo add your devOpsKey

            // default type if not defined
            if (string.IsNullOrWhiteSpace(workItem.Type))
                workItem.Type = "feature";
            workItem.CreatedBy = "who created this"; // todo add who created this work item

            string _UrlServiceCreate = $"https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/${workItem.Type}?api-version=5.0";

            var WorkItem = new List<dynamic>() {
                new
                {
                    op = "add",
                    path = "/fields/System.Title",
                    value = workItem.Title
                },new
                {
                    op = "add",
                    path = "/fields/System.Tags",
                    value = workItem.CreatedBy
                }

            };

            // add description if not empty
            if (!string.IsNullOrWhiteSpace(workItem.Description))
            {
                WorkItem.Add(new
                {
                    op = "add",
                    path = "/fields/System.Description",
                    value = workItem.Description
                });
            }

            var WorkItemValue = new StringContent(JsonConvert.SerializeObject(WorkItem), Encoding.UTF8, "application/json-patch+json");
            var JsonResultWorkItemCreated = await HttpMethod(_UrlServiceCreate, devOpsKey, WorkItemValue, System.Net.Http.HttpMethod.Post);

            return Json(new { workItem = JsonResultWorkItemCreated });
        }

        [HttpPost]
        public async Task<JsonResult> GetDevopsItems()
        {
            var organization = Configuration.GetConnectionString("Organization"); // todo add your organization
            var project = Configuration.GetConnectionString("Project"); // todo add your project
            var devOpsKey = Configuration.GetConnectionString("DevOpsKey"); // todo add your devOpsKey

            var fields = "System.Title,System.State,System.WorkItemType,System.Id,System.CreatedBy,System.CreatedDate,System.Tags";
            var types = "Bug,Feature,Task,Issue";
            string _UrlServiceCreate = $"https://dev.azure.com/{organization}/{project}/_apis/wit/reporting/workitemrevisions?fields={fields}&includeLatestOnly=true&types={types}&includeTagRef=true&api-version=5.0";

            var workItems = HttpMethod(_UrlServiceCreate, devOpsKey, null, System.Net.Http.HttpMethod.Get);
            return Json(new { success = true, workItems = workItems });
        }

        private async Task<string> HttpMethod(string urlService, string token, StringContent postValue, System.Net.Http.HttpMethod httpMethod)
        {
            string request = string.Empty;
            using (HttpClient httpClient = new HttpClient())
            {
                httpClient.DefaultRequestHeaders.Accept.Clear();
                httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(ASCIIEncoding.ASCII.GetBytes(string.Format("{0}:{1}", "", token))));
                using (HttpRequestMessage httpRequestMessage = new HttpRequestMessage(httpMethod, urlService) { Content = postValue })
                {
                    var httpResponseMessage = httpClient.SendAsync(httpRequestMessage).Result;
                    if (httpResponseMessage.IsSuccessStatusCode)
                        request = httpResponseMessage.Content.ReadAsStringAsync().Result;
                }
            }
            return request;

        }

    }
}

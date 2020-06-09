let listObj = null;

$(function () {
    getDevOpsItems();

    $("#request-form").submit(function (event) {

        event.preventDefault();
        const formValues = $(event.target).serializeArray();
        const body = createObj(formValues);

        //todo get user name and add to this list
        let date = new Date().toLocaleDateString();
        let timestamp = new Date().getTime();

        listObj.add({ title: body.title, state: "New", type: body.type, date: date, timestamp: timestamp, tag: window.userName });
        listObj.search($('.search').val());

        $(event.target)[0].reset();

        $.post("/Home/SendRequest",
            {
                "workItem": body
            },
            function (data) {
                console.log(data);
                listObj.sort('timestamp', { order: "desc" });
            });

    });


});

function createObj(formValues) {
    let obj = {};

    formValues.forEach((v) => {
        obj[v.name] = v.value;
    });
    return obj;
}

function getDevOpsItems() {

    $.post("/Home/GetDevopsItems",
        {},
        function (data) {

            const json = JSON.parse(data.workItems);

            console.log(json.values);

            json.values.forEach((i) => {

                let tag = typeof (i.fields["System.Tags"]) === "undefined" ? i.fields["System.CreatedBy"] : i.fields["System.Tags"][0].Name;

                addWorkItem({
                    id: i.fields["System.Id"],
                    title: i.fields["System.Title"],
                    state: i.fields["System.State"],
                    type: i.fields["System.WorkItemType"],
                    tag: tag,
                    date: i.fields["System.CreatedDate"]
                }, false);

            });

            let options = {
                valueNames: ['title', 'state', 'type', 'cb', 'date', { name: 'timestamp', attr: 'data-timestamp' }]
            };

            listObj = new List('devopsList', options);
            listObj.sort('timestamp', { order: "desc" });
        });
}

function addWorkItem(item, prepend) {

    // color of Item Type
    let color = [];
    switch (item.type) {
        case "Bug":
            color.push("red");
            break;
        case "Feature":
            color.push("purple");
            break;
        case "Task":
            color.push("orange");
            break;
        case "Issue":
            color.push("deeppink");
            break;
        default:
            break;
    }

    let date = null;
    let timestamp = null;
    let itemId = "";

    // test for undefined
    if (typeof (item.date) === "undefined") {
        date = new Date().toLocaleDateString();
        timestamp = new Date().getTime();
    } else {
        date = new Date(Date.parse(item.date)).toLocaleDateString();
        timestamp = new Date(Date.parse(item.date)).getTime();
    }
    if (typeof (item.tag) === "undefined") {
        item.tag = window.userName;
    }
    if (typeof (item.id) !== "undefined") {
        itemId = item.id;
    }


    const itemHtml = `<div class="work-item">
                        <div class="title"><span style="text-decoration: underline">${itemId}</span> - ${item.title}</div>
                        <div class="state"> Status: &nbsp <span data-state="${item.state}">${item.state}<span></div>
                        <div class="cb"> <span><span style="color:black">Created By:</span> ${item.tag} </span><span class="date timestamp" data-timestamp="${timestamp}">${date}</span></div>
                        <div class="type" data-color="${color.join("")}">
                            ${item.type}
                        </div>
                    </div>`;

    if (prepend === true) {
        $('.all-items').prepend(itemHtml);
    } else {
        $('.all-items').append(itemHtml);
    }

}
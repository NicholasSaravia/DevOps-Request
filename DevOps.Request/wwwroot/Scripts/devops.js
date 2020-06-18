let listObj = null;

$(function () {
    getDevOpsItems();
    loadFilters();

    $("#request-form").submit(function (event) {

        event.preventDefault();
        const formValues = $(event.target).serializeArray();
        const body = createObj(formValues);

        addWorkItem({
            title: body.title,
            status: "New",
            type: body.type,
            tag: window.userName,
            date: i.fields["System.CreatedDate"]
        }, false);

        search();

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

    $('body ').on('change', '.dropdown-item input', (e) => {

        sortObj = {};

        $('.dropdown-item input:checked').each((index, item) => {
            let group = $(item).attr("data-title") === "Created By" ? "tag" : $(item).attr("data-title").toLowerCase();
            let id = $(item).attr("id");

            if (typeof (sortObj[group]) === "undefined") {
                sortObj[group] = [];
                sortObj[group].push(id);
            } else {
                sortObje[group].push(id);
            }

        });

        console.log(sortObj);
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

    const tags = {
        title: "Created By",
        list: []
    }

    $.post("/Home/GetDevopsItems",
        {},
        function (data) {

            if (data.workItems !== "") {

                let json = null;
                // the reason for this is because sometimes azure returns the stirng in result and other times not.
                try {
                    json = JSON.parse(data.workItems);
                } catch{
                    json = JSON.parse(data.workItems.result);
                }

                console.log(json.values);

                json.values.forEach((i) => {

                    let tag = typeof (i.fields["System.Tags"]) === "undefined" ? i.fields["System.CreatedBy"] : i.fields["System.Tags"][0].name;

                    if (tags.list.indexOf(tag) === -1) {
                        tags.list.push({ value: tag });
                    }

                    addWorkItem({
                        id: i.fields["System.Id"],
                        title: i.fields["System.Title"],
                        status: i.fields["System.State"],
                        type: i.fields["System.WorkItemType"],
                        tag: tag,
                        date: i.fields["System.CreatedDate"]
                    }, false);

                });


                // search() default should order by timestamp
                loadFilterIntoDom(tags);
            }

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
                        <div class="status"> Status: &nbsp <span data-state="${item.status}">${item.status}<span></div>
                        <div class="tag"> <span><span style="color:black">Created By:</span> ${item.tag} </span><span class="date timestamp" data-timestamp="${timestamp}">${date}</span></div>
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

function loadFilters() {

    const types = {
        title: "Types",
        list: [{
            value: 'Tasks'
        }, {
            value: 'Bugs'
        }, {
            value: 'Features'
        }, {
            value: 'Issues'
        }]
    };
    const status = {
        title: "Status",
        list: [{
            value: 'New'
        }, {
            value: 'Active'
        }, {
            value: 'Resolved'
        }, {
            value: 'Closed'
        }]
    }

    $('.filters').append('<div class="sort-by">Filter:</div>');
    loadFilterIntoDom(types);
    loadFilterIntoDom(status);

}

function loadFilterIntoDom(filterObj) {

    let filterElement = ` 
            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    ${filterObj.title}
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">`;

    filterObj.list.forEach((e) => {
        filterElement += `<div class="dropdown-item">
                                    <div class="form-check form-check-inline">
                                        <label class="form-check-label" for="${e.value}">
                                            <input class="form-check-input" type="checkbox" id="${e.value}" data-title="${filterObj.title}" value="${e.value}">
                                            ${e.value}
                                        </label>
                                    </div>
                                </div>`;
    })

    filterElement += `</div></div> `;
    $('.filters').append(filterElement);

}

function search() {
    console.log("searched");
}
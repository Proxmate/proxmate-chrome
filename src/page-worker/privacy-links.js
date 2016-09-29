var container = document.getElementById('proxmate-privacy-container');


if (!container) {
    container = document.createElement("div");
    container.id = 'proxmate-privacy-container';
    container.setAttribute("style", "opacity: 0.5; padding:20px; border-radius: 10px; position:fixed; display: none; background: black; bottom: 20px; right: 20px; z-index: 50000;");
    document.body.appendChild(container);
}

function addButton(name, cb) {
    var button = document.createElement("button");
    button.innerText = name;
    button.id = "toggle-proxmate-debug";
    button.style.display = "none";
    button.onclick = cb;
    container.appendChild(button);
}

addButton("Toggle Alerts", function () {
    chrome.runtime.sendMessage({action: "togglePrivacyAlerts"}, function (response) {
        console.log("Notifications turned  - " + (response ? "ON" : "OFF"))
    });
});

//document.getElementById('toggle-proxmate-debug').click()

chrome.runtime.onMessage.addListener(function (msg, _, sendResponse) {
    if (!window.proxmate_domains) {
        window.proxmate_domains = {}
    }
    container.setAttribute("extension", _.id);
    if (msg.domain in window.proxmate_domains) {
        window.proxmate_domains[msg.domain]++;
    } else {
        container.style.display = "";
        window.proxmate_domains[msg.domain] = 0;
        var domainDiv = document.createElement("div");
        domainDiv.setAttribute("style", "color: white; font-size: 10px");
        domainDiv.setAttribute("extension", _.id);
        domainDiv.innerHTML = msg.domain;
        container.appendChild(domainDiv);
        setTimeout(function () {
            container.style.display = "none"
        }, 5000)
    };
});


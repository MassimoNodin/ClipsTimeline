async function menuButtonClick(open) {
    if (open) {
        document.getElementsByClassName("menuButton")[0].classList.add("open")
        document.getElementsByClassName("mainWebsiteInformation")[0].classList.add("move")
    }
    else {
        document.getElementsByClassName("menuButton")[0].classList.remove("open")
        document.getElementsByClassName("mainWebsiteInformation")[0].classList.remove("move")
    }
}

params = new URLSearchParams(window.location.search);
loginError = params.get('loginError')

if (loginError=="1") {
    document.getElementsByClassName("deniedAccess")[0].classList.add("showing")
    window.history.pushState({ id: "100" },
        "Page", "https://"+window.location.host);
}

async function closeDeniedAccess() {
    document.getElementsByClassName("deniedAccess")[0].classList.remove("showing")
}
userData = null

async function getUserInfo() {
    req = await fetch("/user-info", {method:"POST"})
    userData = (await req.json())["UserInfo"]
    dropdownOptions = document.getElementsByClassName("dropdownOption")
    if (dropdownOptions.length>1 && userData != undefined) {
        dropdownOptions[dropdownOptions.length-1].getElementsByTagName("img")[0].src = userData[3]
        dropdownOptions[dropdownOptions.length-1].href = "https://"+window.location.host+"/profile?id="+userData[0]
        document.getElementsByClassName("profilePic")[0].src = userData[3]
        document.getElementsByClassName("profileName")[0].innerText = userData[1]
        document.getElementsByClassName("profileDiv")[0].getElementsByTagName("a")[0].href = "https://"+window.location.host+"/profile?id="+userData[0]
    }
    else if (userData!=undefined) {
        loginOption = document.getElementsByClassName("websiteOption")[3]
        loginOption.getElementsByTagName("div")[1].innerText = "Profile"
        loginOption.getElementsByTagName("div")[2].innerText = "Profile"
        document.getElementsByClassName("websiteOption")[3].getElementsByClassName("optionTextHolder")[0].href = "/profile?id="+userData[0]
    }
}

async function dropdownToggle() {
    dropdownDiv = document.getElementsByClassName("dropdownNavbar")[0]
    if (dropdownDiv.classList.contains("show")){
        dropdownDiv.classList.remove("show")
    }
    else {
        dropdownDiv.classList.add("show")
    }
    
}

getUserInfo()
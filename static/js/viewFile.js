async function timeSinceStr(date) {
    curDate = new Date()
    
    if (curDate==date) return "today"

    const oneyear = 365 * 24 * 60 * 60 * 1000;
    diffYear = Math.floor(Math.abs((curDate - date) / oneyear));
    if (diffYear!=0) {
        if (diffYear == 1) return "a year ago"
        else return String(diffYear) + " years ago"
    }

    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    diffMonth = Math.floor(Math.abs((curDate - date) / oneMonth));
    if (diffMonth!=0) {
        if (diffMonth == 1) return "a month ago"
        else return String(diffMonth) + " months ago"
    }

    const oneDay = 24 * 60 * 60 * 1000;
    diffDay = Math.floor(Math.abs((curDate - date) / oneDay));
    if (diffDay!=0) {
        if (diffDay == 1) return "a day ago"
        else return String(diffDay) + " days ago"
    }
}

async function pageLoad() {
    vidId = window.location.search.replace("?id=","")
    res = await fetch("/fileInfo?id="+vidId, {method:"POST"})
    fileResponse = (await res.json())
    fileInfo = fileResponse["fileInfo"]
    if (fileInfo.length==0) window.location.href = "https://"+window.location.hostname
    if (fileInfo[11]==1) {
        document.getElementsByClassName("clipView")[0].src = window.location.origin + "/files/" + vidId + "-compressed.mp4"
        document.getElementsByClassName("clipView")[0].poster = window.location.origin + "/files/" + vidId + "-preview.jpg"
    }
    else {
        document.getElementsByClassName("clipView")[0].muted = true
        document.getElementsByClassName("clipView")[0].autoplay = true
        document.getElementsByClassName("clipView")[0].loop = true
        document.getElementsByClassName("clipView")[0].src = window.location.origin + "/static/videos/processingVideo.mp4"
        document.getElementsByClassName("clipView")[0].classList.add("processing")
    }
    titleSplit = document.getElementsByClassName("titleDateSplit")[0]
    if (fileInfo[1].replace(" ","")=="") titleSplit.getElementsByTagName("h1")[0].innerText = "No Title"
    else titleSplit.getElementsByTagName("h1")[0].innerText = fileInfo[1]
    date = new Date(fileInfo[4], fileInfo[5]-1, fileInfo[6]);
    userReq = await fetch("user-info?id="+fileResponse["realOwner"], {method:"POST"})
    profileInfo = (await userReq.json())["UserInfo"]
    document.getElementsByClassName("inlineProfilePic")[0].src = profileInfo[3]
    titleSplit.getElementsByTagName("div")[0].getElementsByTagName("h1")[0].innerText = profileInfo[1]
    titleSplit.getElementsByTagName("div")[0].getElementsByTagName("h1")[1].innerHTML = "<b>from </b>"+await timeSinceStr(date)
    document.getElementsByClassName("inlineProfileDiv")[0].href = "https://"+window.location.host+"/profile?id="+fileInfo[10]
    
    toolTip = document.createElement("span")
    toolTip.classList.add("dateToolTip")
    toolTip.innerText = date.toDateString()
    titleSplit.getElementsByTagName("div")[0].getElementsByTagName("h1")[1].appendChild(toolTip)
    
    if (fileInfo[2].replace(" ","")=="") document.getElementsByClassName("descGameSplit")[0].getElementsByTagName("h1")[0].innerText = "No Description"
    else document.getElementsByClassName("descGameSplit")[0].getElementsByTagName("h1")[0].innerText = fileInfo[2]
    if (fileInfo[7].replace(" ","")=="") document.getElementsByClassName("descGameSplit")[0].getElementsByTagName("h1")[1].innerText = "No Tags"
    else document.getElementsByClassName("descGameSplit")[0].getElementsByTagName("h1")[1].innerText = fileInfo[7]
    gRes = await fetch("/game-logo?gameName="+fileInfo[3], {method:"POST"})
    gameIMG = (await gRes.json())["result"]
    document.getElementsByClassName("gameIMG")[0].src = gameIMG
    if (fileInfo[10]==userData[0]) {
        document.getElementsByClassName("editButton")[0].classList.add("showing")
        document.getElementsByClassName("inlineProfileDiv")[0].href = "https://"+window.location.host+"/profile?id="+fileResponse["realOwner"]
    }
    await videoLoaded()
}

async function downloadButton() {
    dReq = await fetch("/file-size?id=" + vidId, {method: "POST"})
    donwloadSizes = await dReq.json()
    if (donwloadSizes["Success"]) {
        downloadConfirm = document.getElementsByClassName("downloadConfirmation")[0]
        buttons = downloadConfirm.getElementsByTagName("button")
        buttons[1].style = "display:inherit"
        if (parseFloat(donwloadSizes["compressed"].substring(0,donwloadSizes["compressed"].length-1))>parseFloat(donwloadSizes["fullQuality"].substring(0,donwloadSizes["fullQuality"].length-1))) {
            buttons[2].innerText = `Original File (${donwloadSizes["fullQuality"]})`
            buttons[1].style = "display:none"
        }
        else {
            buttons[1].innerText = `Lower Quality (${donwloadSizes["compressed"]})`
            buttons[2].innerText = `Full Quality (${donwloadSizes["fullQuality"]})`
        }
        document.getElementsByClassName("downloadConfirmation")[0].classList.add("showing")
    }
}

async function cancelDownload() {
    document.getElementsByClassName("downloadConfirmation")[0].classList.remove("showing")
}

async function downloadClip(fullQuality) {
    document.getElementsByClassName("downloadConfirmation")[0].classList.add("disabled")
    vidId = window.location.search.replace("?id=","")
    res = await fetch("/fileInfo?id="+vidId, {method:"POST"})
    fileInfo = (await res.json())["fileInfo"]
    var downloadLink = document.createElement("a");
    if (fullQuality) {
        downloadLink.href = "https://"+window.location.hostname+"/files/"+vidId+"."+fileInfo[8]
        downloadLink.download = vidId+"."+fileInfo[8];
    }
    else {
        downloadLink.href = "https://"+window.location.hostname+"/files/"+vidId+"-compressed.mp4"
        downloadLink.download = vidId+"-compressed.mp4";
    }
    downloadLink.click();
    document.getElementsByClassName("downloadConfirmation")[0].classList.remove("showing")
}

pageLoad()

async function editButton() {
    vidId = window.location.search.replace("?id=","")
    window.location.href = "https://"+window.location.hostname+"/upload-manage?id="+vidId
}
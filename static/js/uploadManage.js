function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function textEntryChange(e) {
    if (e!=null) if (e.srcElement.classList.contains("dayEntry") || e.srcElement.classList.contains("monthEntry") || e.srcElement.classList.contains("yearEntry")) e.srcElement.classList.remove("invalid")
    document.getElementsByClassName("updateButton")[0].classList.add("available")
}

async function manageClip() {
    vidId = window.location.search.replace("?id=","")
    vidReq = await fetch("/fileInfo?id=" + vidId, {method: "POST"})
    vidInfo = (await vidReq.json())["fileInfo"]
    if (vidInfo[11]==1) document.getElementsByClassName("clipView")[0].src = window.location.origin + "/files/" + vidId + "-compressed.mp4"
    else {
        document.getElementsByClassName("clipView")[0].autoplay = true
        document.getElementsByClassName("clipView")[0].loop = true
        document.getElementsByClassName("clipView")[0].src = window.location.origin + "/static/videos/processingVideo.mp4"
        document.getElementsByClassName("clipView")[0].classList.add("processing")
        document.getElementsByClassName("updateThumbnailButton")[0].classList.remove("available")
    }
    document.getElementsByClassName("titleEntry")[0].value = vidInfo[1]
    document.getElementsByClassName("descEntry")[0].value = vidInfo[2]
    document.getElementsByClassName("gameEntry")[0].value = vidInfo[3]
    if (vidInfo[3]!= "") document.getElementsByClassName("gameEntry")[0].classList.add("valid")
    document.getElementsByClassName("yearEntry")[0].value = parseInt(vidInfo[4])
    document.getElementsByClassName("monthEntry")[0].value = parseInt(vidInfo[5])
    document.getElementsByClassName("dayEntry")[0].value = parseInt(vidInfo[6])
    document.getElementsByClassName("tagEntry")[0].value = vidInfo[7]
    if (vidInfo[7]!= "") document.getElementsByClassName("tagEntry")[0].classList.add("valid")
    document.getElementsByClassName("clipManageBox")[0].classList.add("showing")
    textAreas = document.getElementsByTagName("textarea")
    for (i=0; i<textAreas.length; i++) if (!textAreas[i].classList.contains("tagEntry") && !textAreas[i].classList.contains("gameEntry")) textAreas[i].addEventListener("input",textEntryChange)
    textInputs = document.getElementsByTagName("input")
    for (i=0; i<textInputs.length; i++) textInputs[i].addEventListener("input",textEntryChange)
    document.getElementsByClassName("tagEntry")[0].addEventListener("input",tagEntryUpdate)
    document.getElementsByClassName("gameEntry")[0].addEventListener("input",gameEntryUpdate)
    while (vidInfo[11]==0) {
        console.log("checking upload")
        vidReq = await fetch("/fileInfo?id=" + vidId, {method: "POST"})
        vidInfo = (await vidReq.json())["fileInfo"]
        await sleep(2000)
    }
    document.getElementsByClassName("clipView")[0].autoplay = false
    document.getElementsByClassName("clipView")[0].src = window.location.origin + "/files/" + vidId + "-compressed.mp4"
    document.getElementsByClassName("clipView")[0].classList.remove("processing")
    document.getElementsByClassName("updateThumbnailButton")[0].classList.add("available")
    await videoLoaded()
}

async function deleteClip() {
    document.getElementsByClassName("deleteConfirmation")[0].classList.add("showing")
}

async function cancelDeleteClip() {
    document.getElementsByClassName("deleteConfirmation")[0].classList.remove("showing")
}

async function confirmDeleteClip() {
    document.getElementsByClassName("deleteClipButton")[0].classList.add("disabled")
    vidId = window.location.search.replace("?id=","")
    vidReq = await fetch("/delete-clip?id=" + vidId, {method: "POST"})
    if ((await vidReq.json())["Success"]) window.location.href = "https://"+window.location.hostname
}

async function updateThumbnail(buttonRef) {
    vidObj = document.getElementsByClassName("clipView")[0]
    document.getElementsByClassName("videoControls")[0].classList.add("hide")
    buttonRef.classList.remove("available")
    vidReq = await fetch("/thumbnailUpdate?id=" + vidId + "&ts=" + String(vidObj.currentTime), {method: "POST"})
    updateSuccess = (await vidReq.json())["Success"]
    if (updateSuccess) {
        vidObj.classList.add("shine")
        await sleep(600)
        vidObj.classList.remove("shine")
    }
    buttonRef.classList.add("available")
    document.getElementsByClassName("videoControls")[0].classList.remove("hide")
}

function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
  
    // Create a 2D array to store the distances
    const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
  
    // Initialize the first row and column
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
  
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
  
    // Calculate the distances
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
  
    // The bottom-right cell contains the Levenshtein distance
    return dp[m][n];
  }
  
  function findClosestMatches(target, strings, numMatches) {
    const closestMatches = [];
  
    for (const str of strings) {
      const distance = levenshteinDistance(target, str);
  
      // Add the current string and its distance to the array
      closestMatches.push({ string: str, distance: distance });
    }
  
    // Sort the array based on distance in ascending order
    closestMatches.sort((a, b) => a.distance - b.distance);
  
    // Return the top N closest matches
    return closestMatches.slice(0, numMatches);
  }

async function gameSelect(buttonRef) {
    document.getElementsByClassName("gameEntry")[0].value = buttonRef.innerText
    document.getElementsByClassName("gameEntry")[0].classList.remove("invalid")
    document.getElementsByClassName("gameEntry")[0].classList.add("valid")
    document.getElementsByClassName("updateButton")[0].classList.add("available")
    vidInfo[3] = buttonRef.innerText
}

async function gameEntryUpdate(start) {
    if (!currentlyGameSearching) {
        currentlyGameSearching = true
        if (start!=true) {
            document.getElementsByClassName("gameEntry")[0].classList.remove("valid")
            document.getElementsByClassName("gameEntry")[0].classList.add("invalid")
            document.getElementsByClassName("updateButton")[0].classList.remove("available")
        }
        gameSearch = document.getElementsByClassName("gameEntry")[0].value
        amountGames = gameList.length
        if (amountGames > 5) amountGames = 5
        searchRank = await findClosestMatches(gameSearch, gameList, amountGames)
        document.getElementsByClassName("gameAbsDrop")[0].innerHTML = ""
        for (i=0; i<searchRank.length; i++) {
            gameTitleDiv = document.createElement("button")
            gameTitleDiv.classList.add("gameTitle")
            gameTitleDiv.innerText = searchRank[i]["string"]
            gameTitleDiv.setAttribute("onclick","gameSelect(this)")
            document.getElementsByClassName("gameAbsDrop")[0].appendChild(gameTitleDiv)
        }
        currentlyGameSearching = false
    }
}

async function tagEntryUpdate() {
    tagEntryAccept = await tagCheck()
    tagEntry = document.getElementsByClassName("tagEntry")[0]
    if (tagEntryAccept==null) {
        tagEntry.classList.remove("invalid")
        tagEntry.classList.remove("valid")
        document.getElementsByClassName("updateButton")[0].classList.add("available")
    }
    else if (tagEntryAccept) {
        await textEntryChange()
        tagEntry.classList.remove("invalid")
        tagEntry.classList.add("valid")
        document.getElementsByClassName("updateButton")[0].classList.add("available")
    }
    else {
        tagEntry.classList.remove("valid")
        tagEntry.classList.add("invalid")
        document.getElementsByClassName("updateButton")[0].classList.remove("available")
    }
}

async function tagCheck() {
    tagEntry = document.getElementsByClassName("tagEntry")[0]
    tagTxt = tagEntry.value
    if (tagTxt.length==0) return null
    tagList = tagTxt.split(" ")
    for (i=0; i<tagList.length; i++) {
        if (tagList[i]=="") tagList.slice(i)
        else if (tagList[i][0]!="#" || tagList[i].length==1) return false
    }
    return true
}

function isValidDate(year, month, day) {
    month = month - 1;
    var d = new Date(year, month, day);
    if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day) {
      return true;
    }
    return false;
}

async function updateInformation(buttonRef) {
    buttonRef.classList.remove("available")
    vidInfo[1] = document.getElementsByClassName("titleEntry")[0].value
    vidInfo[2] = document.getElementsByClassName("descEntry")[0].value
    yearVal = document.getElementsByClassName("yearEntry")[0].value
    monthVal = document.getElementsByClassName("monthEntry")[0].value
    dayVal = document.getElementsByClassName("dayEntry")[0].value
    if (!await isValidDate(yearVal,1,1)) {
        document.getElementsByClassName("yearEntry")[0].classList.add("invalid")
    }
    else if (!await isValidDate(yearVal,monthVal,1)) {
        document.getElementsByClassName("monthEntry")[0].classList.add("invalid")
    }
    else if (!await isValidDate(yearVal,monthVal,dayVal)) {
        document.getElementsByClassName("dayEntry")[0].classList.add("invalid")
    }
    else {
        vidInfo[4] = yearVal
        vidInfo[5] = monthVal
        vidInfo[6] = dayVal
        if (await tagCheck()) vidInfo[7] = document.getElementsByClassName("tagEntry")[0].value
        req = await fetch("/update-clip", {method: "POST", body: JSON.stringify(vidInfo)})
        window.location.href = "https://"+window.location.hostname+"/view-clip?id="+vidInfo[0]
    }   
}

async function gameEntryIn() {
    await gameEntryUpdate(true)
    document.getElementsByClassName("gameEntry")[0].classList.add("focus")
    document.getElementsByClassName("gameDropdown")[0].classList.add("show")
}

async function gameEntryOut() {
    await sleep(100)
    document.getElementsByClassName("gameEntry")[0].classList.remove("focus")
    document.getElementsByClassName("gameDropdown")[0].classList.remove("show")
}

async function gameListLoad() {
    req = await fetch("/game-list", {method: "POST"})
    gameList = (await req.json())["gamesList"]
}

var currentlyGameSearching = false
var gameList = null
var vidInfo = null

gameListLoad()
manageClip()
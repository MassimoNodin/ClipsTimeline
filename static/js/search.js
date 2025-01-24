function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

searchBars = document.getElementsByClassName("searchBar")
if (searchBars.length > 0) {
    searchBars[0].addEventListener("keypress", function(event) {
        if (event.key === "Enter") searchEnter(null)
    })
    if (searchBars[0].disabled) searchPreview()
}

async function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function searchPreview() {
    searches = {
        "steve rage": ["irWQ13oglJ9WIA", "YlqDwYpk1sNL7w"],
        "rocket league": ["8oq0wTqBAaE4FQ","irWQ13oglJ9WIA","JvZahE1IGc0QFQ","ObUR1hRbd70n9Q"],
        "GTA": ["Ib_OvwRt67v2Sw","dP5WqaG7W2H87Q","D1A71e0Jqbecig"]
    }
    await sleep(2000)
    while (true) {
        searchStrings = Object.keys(searches)
        console.log(searchStrings.length)
        for (searchCount=0; searchCount<searchStrings.length; searchCount++) {
            string = searchStrings[searchCount]
            curStr = ""
            for (z=0; z<string.length; z++) {
                curStr += string[z]
                searchBars[0].value = curStr
                await sleep(100 + await getRandomInt(150))
            }
            searchResult = {
                "titleResult":[],
                "descResult":[],
                "audioResult":[],
                "gameResult":[]
            }
            resultChoices = Object.keys(searchResult)
            for (y=0; y<searches[string].length; y++) {
                searchResult[resultChoices[await getRandomInt(3)]].push(searches[string][y])
            }
            await sleep(300)
            await searchEnter(searchResult)
            await sleep(5000)
            document.getElementsByClassName("videoSelect")[0].innerHTML = ""
            curStr = string
            for (z=0; z<string.length; z++) {
                curStr = curStr.slice(0,-1)
                searchBars[0].value = curStr
                await sleep(50 + await getRandomInt(50))
            }
            await sleep(1000)
        }
    }
}

async function createVidPreview(id, mode, presetEntry) {
    res = await fetch("https://" + window.location.host +"/fileInfo?id="+id, {method:"POST"})
    fileInfo = (await res.json())["fileInfo"]

    vidDiv = document.createElement("a")
    if (presetEntry==null) {
        vidDiv.setAttribute("href","/view-clip?id="+fileInfo[0])
        vidDiv.setAttribute("onclick","clipView()")
    }
    vidDiv.classList.add("clipBox")

    clipThumbnail = document.createElement("img")
    clipThumbnail.classList.add("clipThumbnail")
    clipThumbnail.src = "https://" + window.location.host + "/files/" + fileInfo[0] + "-preview.jpg"
    vidDiv.appendChild(clipThumbnail)

    clipTitle = document.createElement("div")
    clipTitle.classList.add("clipPreviewTitle")
    clipTitle.innerText = fileInfo[1]

    if (mode == 0) {
        titleSymbol = document.createElement("i")
        titleSymbol.classList.add("fas","fa-text-height")
        clipTitle.appendChild(titleSymbol)
    }
    else if (mode == 1) {
        descSymbol = document.createElement("i")
        descSymbol.classList.add("far","fa-file-alt")
        clipTitle.appendChild(descSymbol)
    }
    else if (mode == 2) {
        audioSymbol = document.createElement("i")
        audioSymbol.classList.add("far","fa-file-audio")
        clipTitle.appendChild(audioSymbol)
    }
    else if (mode == 3) {
        gameSymbol = document.createElement("i")
        gameSymbol.classList.add("fas","fa-gamepad")
        clipTitle.appendChild(gameSymbol)
    }

    vidDiv.appendChild(clipTitle)

    document.getElementsByClassName("videoSelect")[0].appendChild(vidDiv)
}

async function searchEnter(presetEntry) {
    document.getElementsByClassName("videoSelect")[0].innerHTML = ""
    if (presetEntry==null) {
        val = document.getElementsByClassName("searchBar")[0].value
        if (val.replaceAll(" ","")=="") return
        searchReq = await fetch("/search?searchStr="+val, {method: "POST"})
        searchResult = (await searchReq.json())
    }
    else searchResult = presetEntry
    prevID = []
    for (i=0; i<searchResult["titleResult"].length; i++) {
        currentID = searchResult["titleResult"][i]
        if (prevID.includes(currentID)) continue
        prevID.push(currentID)
        await createVidPreview(currentID,0,presetEntry)
    }
    for (i=0; i<searchResult["descResult"].length; i++) {
        currentID = searchResult["descResult"][i]
        if (prevID.includes(currentID)) continue
        prevID.push(currentID)
        await createVidPreview(currentID,1,presetEntry)
    }
    for (i=0; i<searchResult["audioResult"].length; i++) {
        currentID = searchResult["audioResult"][i]
        if (prevID.includes(currentID)) continue
        prevID.push(currentID)
        await createVidPreview(currentID,2,presetEntry)
    }
    for (i=0; i<searchResult["gameResult"].length; i++) {
        currentID = searchResult["gameResult"][i]
        if (prevID.includes(currentID)) continue
        prevID.push(currentID)
        await createVidPreview(currentID,3,presetEntry)
    }
}
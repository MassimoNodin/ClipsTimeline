function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var data = {}
var movingContainer = false

async function loadTimeline() {
    cRes = await fetch("/column-list?columnName=year", {method:"POST"})
    yearList = (await cRes.json())["colmuns"]
    if (yearList == undefined) return
    for (i=0; i<yearList.length; i++) {
        yRes = await fetch("/timeline-search?year="+yearList[i], {method:"POST"})
        yearInfo = await yRes.json()
        data[yearList[i]] = []
        for (z=0; z<yearInfo["searchResult"].length; z++) {
            if (!(yearInfo["searchResult"][z][3] in data[yearList[i]])) data[yearList[i]].push(yearInfo["searchResult"][z][3])
        }
        clipAmount = yearInfo["searchResult"].length

        yearButton = document.createElement("button")
        yearButton.classList.add("yearButton")
        yearButton.classList.add("yearComponent")
        yearButton.setAttribute("onclick","selectComponent(this)")
        yearButton.id = yearList[i]

        yearTitle = document.createElement("h1")
        yearTitle.innerText = yearList[i]
        yearButton.appendChild(yearTitle)

        yearClips = document.createElement("h2")
        if (clipAmount==1) yearClips.innerText = clipAmount + " Clip"
        else yearClips.innerText = clipAmount + " Clips"
        yearButton.appendChild(yearClips)

        document.getElementsByClassName("yearTimeline")[0].appendChild(yearButton)
    }
    params = new URLSearchParams(window.location.search);
    year = params.get('year')
    game = params.get('game')
    if (year==null || game==null) document.getElementsByClassName("yearTimeline")[0].classList.add("reveal")
    else {
        await yearSelect(year)
        document.getElementById(year).classList.add("selected")
        document.getElementById(game).classList.add("selected")
        await gameSelect(game)
        document.getElementsByClassName("yearTimeline")[0].classList.add("hiddenAbove")
        document.getElementsByClassName("gameSelect")[0].classList.replace("hiddenBelow","hiddenAbove")
        document.getElementsByClassName("videoSelect")[0].classList.add("istant")
        document.getElementsByClassName("videoSelect")[0].classList.remove("hiddenBelow")
        document.getElementsByClassName("aboveButton")[0].classList.add("buttonShowing")
        await sleep(100)
        document.getElementsByClassName("videoSelect")[0].classList.remove("istant")
        document.getElementsByClassName("yearTimeline")[0].classList.add("reveal")
    }
}

async function gameSelect(game) {
    year = parseInt(document.getElementsByClassName("yearTimeline")[0].getElementsByClassName("selected")[0].innerText)
    document.getElementsByClassName("videoSelect")[0].innerHTML = ""
    ygRes = await fetch("/timeline-search?year="+year+"&game="+game, {method:"POST"})
    searchResult = await ygRes.json()
    if (searchResult["Success"]) {
        vids = searchResult["searchResult"]
        for (i=0; i<vids.length; i++) {
            vidDiv = document.createElement("a")
            vidDiv.setAttribute("href","/view-clip?id="+vids[i][0])
            vidDiv.classList.add("clipBox")
            vidDiv.setAttribute("onclick","clipView()")

            clipThumbnail = document.createElement("img")
            clipThumbnail.classList.add("clipThumbnail")
            clipThumbnail.src = "https://" + window.location.host + "/files/" + vids[i][0] + "-preview.jpg"
            vidDiv.appendChild(clipThumbnail)

            clipTitle = document.createElement("div")
            clipTitle.classList.add("clipPreviewTitle")
            clipTitle.innerText = vids[i][1]
            vidDiv.appendChild(clipTitle)

            document.getElementsByClassName("videoSelect")[0].appendChild(vidDiv)
        }
    }
}

async function yearSelect(year) {
    document.getElementsByClassName("gameSelect")[0].innerHTML = ""
    gameList = data[parseInt(year)]
    prevGames = []
    for (i=0; i<gameList.length; i++) {
        if (prevGames.includes(gameList[i])) continue
        prevGames.push(gameList[i])
        gameChoice = document.createElement("button")
        gameChoice.classList.add("gameChoice")
        gameChoice.setAttribute("onclick","selectComponent(this)")
        gameChoice.id = gameList[i]

        gRes = await fetch("/game-logo?gameName="+gameList[i], {method:"POST"})
        gameIMG = (await gRes.json())["result"]
        gameLogo = document.createElement("img")
        gameLogo.src = gameIMG
        gameChoice.appendChild(gameLogo)

        gameTitle = document.createElement("h1")
        gameTitle.innerText = gameList[i]
        gameChoice.appendChild(gameTitle)

        document.getElementsByClassName("gameSelect")[0].appendChild(gameChoice)
    }
}

async function selectComponent(buttonRef) {
    if (movingContainer) return
    if (buttonRef.classList.contains("selected")) {
        allSelectedDivs = [].slice.call(document.getElementsByClassName("selected"));
        buttonIndex = allSelectedDivs.findIndex((element) => element == buttonRef);
        for (let i=buttonIndex; i<allSelectedDivs.length; i++) {
            allSelectedDivs[i].classList.remove("selected")
        }

        buttonRef.classList.remove("selected");
        document.getElementsByClassName("belowButton")[0].classList.remove("buttonShowing")
        history.pushState({}, "", "https://"+window.location.host+ "/timeline")
    }
    else {
        buttonRef.classList.add("selected");
        if (buttonRef.classList.contains("yearComponent")) await yearSelect(buttonRef.getElementsByTagName("h1")[0].innerText)
        if (buttonRef.classList.contains("gameChoice")) await gameSelect(buttonRef.getElementsByTagName("h1")[0].innerText)
        await containerMovement(false);
    }
}

async function containerMovement(previousSection) {
    if (movingContainer) return
    movingContainer = true
    dCChildren = [].slice.call(document.getElementsByClassName("discoveryContainer")[0].children);
    hiddenBelow = [].slice.call(document.getElementsByClassName("discoveryContainer")[0].getElementsByClassName("hiddenBelow"));
    hiddenAbove = [].slice.call(document.getElementsByClassName("discoveryContainer")[0].getElementsByClassName("hiddenAbove"));
    firstFilter = dCChildren.filter(x => !hiddenBelow.includes(x))
    currentDiv = firstFilter.filter(x => !hiddenAbove.includes(x))[0]
    divIndex = dCChildren.findIndex((element) => element == currentDiv)
    if (currentDiv==null) {
        currentDiv = document.createElement("div")
        previousSibling = dCChildren[dCChildren.length-1]
        nextSibling = document.createElement("div")
    }
    else {
        previousSibling = currentDiv.previousElementSibling;
        nextSibling = currentDiv.nextElementSibling;
    }
    if (previousSection) {
        if (previousSibling!=null) previousSibling.classList.add("appear");
        if (divIndex == 1) document.getElementsByClassName("aboveButton")[0].classList.remove("buttonShowing")
        currentDiv.classList.add("dissapearBelow");
        await sleep(1000);
        if (previousSibling!=null) {
            if (previousSibling.getElementsByClassName("selected").length!=0) document.getElementsByClassName("belowButton")[0].classList.add("buttonShowing")
            previousSibling.classList.remove("appear")
            previousSibling.classList.remove("hiddenAbove");
        }
        currentDiv.classList.remove("dissapearBelow");
        currentDiv.classList.add("hiddenBelow")
    }
    else {
        if (nextSibling!=null) {
            if (nextSibling.getElementsByClassName("selected").length==0) document.getElementsByClassName("belowButton")[0].classList.remove("buttonShowing")
            nextSibling.classList.add("appear");
        }
        currentDiv.classList.add("dissapearAbove");
        await sleep(1000);
        if (divIndex == 0) document.getElementsByClassName("aboveButton")[0].classList.add("buttonShowing")
        currentDiv.classList.remove("dissapearAbove");
        if (nextSibling!=null) {
            nextSibling.classList.remove("appear");
            nextSibling.classList.remove("hiddenBelow");
        }
        currentDiv.classList.add("hiddenAbove")
    }
    movingContainer = false
}

async function clipView() {
    year = document.getElementsByClassName("yearTimeline")[0].getElementsByClassName("selected")[0].getElementsByTagName("h1")[0].innerText
    game = document.getElementsByClassName("gameSelect")[0].getElementsByClassName("selected")[0].innerText
    history.pushState({}, "", "https://"+window.location.host+ "/timeline?year="+year+"&game="+game);
}

loadTimeline()
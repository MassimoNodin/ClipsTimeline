async function profileLoad() {
    profileID = window.location.search.replace("?id=","")
    userReq = await fetch("user-info?id="+profileID, {method:"POST"})
    profileInfo = (await userReq.json())["UserInfo"]
    req = await fetch("user-clips?id="+profileID, {method:"POST"})
    userClips = (await req.json())["userClips"].reverse()
    document.getElementsByClassName("fullProfilePic")[0].src = profileInfo[3]
    profileH1s = document.getElementsByClassName("userInformation")[0].getElementsByTagName("h1")
    profileH1s[0].innerText = profileInfo[1]
    suffix = " clips"
    if (userClips.length==1) suffix = " clip"
    profileH1s[1].innerText = String(userClips.length)+suffix
    for (i=0; i<userClips.length; i++) {
        vidDiv = document.createElement("a")
        vidDiv.setAttribute("href","/view-clip?id="+userClips[i][0])
        vidDiv.classList.add("clipBox")

        clipThumbnail = document.createElement("img")
        clipThumbnail.classList.add("clipThumbnail")
        clipThumbnail.src = "https://" + window.location.host + "/files/" + userClips[i][0] + "-preview.jpg"
        vidDiv.appendChild(clipThumbnail)

        clipTitle = document.createElement("div")
        clipTitle.classList.add("clipPreviewTitle")
        clipTitle.innerText = userClips[i][1]
        vidDiv.appendChild(clipTitle)

        document.getElementsByClassName("userClips")[0].appendChild(vidDiv)
    }
}

profileLoad()
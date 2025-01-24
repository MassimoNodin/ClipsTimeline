function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

keysPressed = []

video = document.getElementsByClassName("clipView")[0]
isFullscreen = false
mousemoveDelay = false

async function videoLoaded() {
    res = await fetch("/fileInfo?id="+vidId, {method:"POST"})
    fileInfo = (await res.json())["fileInfo"]
    document.getElementsByClassName("playerVideoVideoLength")[0].innerText = await millisToMinutesAndSeconds(fileInfo[17]*1000)
    document.getElementsByClassName("playerVideoCurrentTime")[0].innerText = "00:00"
}

async function updateVolumeBar(volumePercentage) {
    document.getElementsByClassName('volumeInnerBar')[0].style.height = `${volumePercentage*80/100}px`
    document.getElementsByClassName('volumeCircle')[0].style = `margin-bottom:calc(${volumePercentage*80/100}px - 10px)`
    document.getElementsByClassName('volumeCircle')[0].getElementsByTagName("div")[0].innerText = `${Math.round(volumePercentage)}%`
    await volumeIconUpdate(volumePercentage)
}

async function keyDown(e) {
    if (!e) return
    if (e.srcElement.tagName=="TEXTAREA" || e.srcElement.tagName=="INPUT") return
    if (e.keyCode == '38') {
        volumePercentage = Math.min(Math.max(video.volume + 0.05,0),1)
        video.volume = volumePercentage
        await updateVolumeBar(volumePercentage*100)
        await mouseMove()
    }
    else if (e.keyCode == '40') {
        volumePercentage = Math.min(Math.max(video.volume - 0.05,0),1)
        video.volume = volumePercentage
        await updateVolumeBar(volumePercentage*100)
        await mouseMove()
    }
    else if (e.keyCode == '37') {
        video.currentTime = Math.min(Math.max(video.currentTime - 5,0),video.duration)
        await mouseMove()
    }
    else if (e.keyCode == '39') {
        video.currentTime = Math.min(Math.max(video.currentTime + 5,0),video.duration)
        await mouseMove()
    }
    else if (e.keyCode == '70') {
        await fullscreenButton()
    }
}

document.addEventListener("keydown", keyDown)

video.parentElement.addEventListener("fullscreenchange", (event) => {
    if (isFullscreen) isFullscreen = false
    else isFullscreen = true
});

async function mouseMove() {
    if (isFullscreen && !mousemoveDelay) {
        mousemoveDelay = true
        document.getElementsByClassName("videoControls")[0].classList.add("tempshow")
        video.parentElement.classList.add("tempshow")
        await sleep(2800)
        mousemoveDelay = false
        await sleep(200)
        if (!mousemoveDelay) {
            document.getElementsByClassName("videoControls")[0].classList.remove("tempshow")
            video.parentElement.classList.remove("tempshow")
        }
    }
}

document.addEventListener("mousemove",mouseMove)

video.addEventListener("timeupdate",videoTimeUpdate)

async function videoTimeUpdate() {
    let curr = (video.currentTime / video.duration) * 100
    document.getElementsByClassName("playerVideoCurrentTime")[0].innerText = await millisToMinutesAndSeconds(video.currentTime*1000)
    if(video.ended){
        document.getElementsByClassName("togglePause")[0].classList.remove("playing")
    }
    document.getElementsByClassName('videoTimelineBarInner')[0].style.width = `${curr}%`
}

async function togglePause(buttonRef) {
    if (buttonRef.classList.contains("clipView") && /iPad|iPhone|iPod/.test(navigator.userAgent)) return await mouseMove()
    document.getElementsByClassName("togglePause")[0].focus()
    if(video.paused){
        document.getElementsByClassName("togglePause")[0].classList.add("playing")
        video.play()
    }
    else{
        document.getElementsByClassName("togglePause")[0].classList.remove("playing")
        video.pause()
    }
    mouseMove()
}

document.getElementsByClassName("videoControls")[0].addEventListener("onclick", (event) => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) mouseMove()
})

try {
    data = {
        title: "Clips Viewer Video Share",
        text: "Learn web development on MDN!",
        url: "https://" + window.location.host
    };
    if (navigator.canShare(data)) document.getElementsByClassName("shareButton")[0].classList.add("showing")
} catch {}


async function shareButton() {
    try {
        data = {
            title: "Clips Viewer Video Share",
            text: "Learn web development on MDN!",
            url: "https://" + window.location.host +"/view-clip?id="+vidId,
        };
        await navigator.share(data)
    }
    catch {}
}

const fullscreenButton = () => {
    if (!isFullscreen) {
        elem = video.parentElement
        if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            elem.requestFullscreen();
            document.getElementsByClassName("togglePause")[0].focus()
        } else {
            video.webkitEnterFullscreen()
            isFullscreen = true
        }
        mouseMove()
    }
    else {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            video.webkitExitFullscreen()
            isFullscreen = false
        }
        else document.exitFullscreen()
    }
}

async function millisToMinutesAndSeconds(millis) {
    var hours = Math.floor(millis / 3.6e+6)
    var minutes = Math.floor((millis % 3.6e+6) / 60000)
    var seconds = Math.floor((millis % 60000) / 1000);
    return (hours == 0 ? "": hours + ":") + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function timelineClick(event) {
    timelineOuterBar = document.getElementsByClassName("videoTimelineBar")[0]
    var rect = timelineOuterBar.getBoundingClientRect();
    timelineWidth = rect.right - rect.left
    timelineProgress = 100 * Math.min(Math.max((event.x - rect.left) / timelineWidth,0),1)
    seekTime = video.duration * timelineProgress / 100
    video.currentTime = seekTime
}

async function timelineMouseOver(event) {
    timelineOuterBar = document.getElementsByClassName("videoTimelineBar")[0]
    var rect = timelineOuterBar.getBoundingClientRect();
    if (event.x > rect.left && event.x < rect.right) {
        document.getElementsByClassName("seekBar")[0].classList.add("showing")
        timelineWidth = rect.right - rect.left
        timelineProgress = 100 * (event.x - rect.left) / timelineWidth
        document.getElementsByClassName('seekBar')[0].style.width = `${timelineProgress}%`
        document.getElementsByClassName('seekCircle')[0].style = `margin-left:calc(${timelineProgress}% - 10px)`
        document.getElementsByClassName('seekCircle')[0].getElementsByTagName("div")[0].innerText = await millisToMinutesAndSeconds(video.duration * timelineProgress * 10)
    }
}

async function timelineMouseOut() {
    document.getElementsByClassName("seekBar")[0].classList.remove("showing")
}

async function volumeClick(event) {
    if (video.muted === true) video.muted = false
    volumeOuterBar = document.getElementsByClassName("volumeOuterBar")[0]
    var rect = volumeOuterBar.getBoundingClientRect();
    if (event.y > rect.bottom) return
    volumeHeight = rect.bottom - rect.top
    volumePercentage = Math.min(Math.max((rect.bottom - event.y) / volumeHeight,0),1)
    await updateVolumeBar(volumePercentage*100)
    await volumeIconUpdate(volumePercentage)
    video.volume = volumePercentage
}

async function volumeIconUpdate(volumePercentage) {
    volumeIcon = document.getElementsByClassName("volumeSelect")[0].getElementsByTagName("i")[0]
    if (volumePercentage==0) {
        volumeIcon.classList.remove("fa-volume-down","fa-volume-mute","fa-volume-up","fa-volume-off")
        volumeIcon.classList.add("fa-volume-mute")
    }
    else if (0 < volumePercentage && volumePercentage <= 0.2) {
        volumeIcon.classList.remove("fa-volume-down","fa-volume-mute","fa-volume-up","fa-volume-mute")
        volumeIcon.classList.add("fa-volume-off")
    }
    else if (0.2 < volumePercentage && volumePercentage <= 0.6) {
        volumeIcon.classList.remove("fa-volume-off","fa-volume-mute","fa-volume-up","fa-volume-mute")
        volumeIcon.classList.add("fa-volume-down")
    }
    else {
        volumeIcon.classList.remove("fa-volume-off","fa-volume-mute","fa-volume-down","fa-volume-mute")
        volumeIcon.classList.add("fa-volume-up")
    }
}

async function volumeMouseOver(event) {
    volumeOuterBar = document.getElementsByClassName("volumeOuterBar")[0]
    var rect = volumeOuterBar.getBoundingClientRect();
    if (event.y > (rect.top - 10) && event.y < rect.bottom) {
        volumeHeight = rect.bottom - rect.top
        
        volumePercentage = 100 * Math.min(Math.max((rect.bottom - event.y) / volumeHeight,0),1)
        document.getElementsByClassName('volumePotInnerBar')[0].style.height = `${volumePercentage}%`
        document.getElementsByClassName('volumeCircle')[0].style = `margin-bottom:calc(${volumePercentage*80/100}px - 0.5vw)`
        document.getElementsByClassName('volumeCircle')[0].getElementsByTagName("div")[0].innerText = `${Math.round(volumePercentage)}%`
    }
    else {
        await volumeMouseOut()
    }
}

async function volumeMouseOut() {
    if (video.muted === true) volumePerc = 0
    else volumePerc = video.volume
    document.getElementsByClassName('volumeInnerBar')[0].style.height = `${volumePerc*80}px`
    document.getElementsByClassName('volumePotInnerBar')[0].style.height = `${volumePerc}%`
    document.getElementsByClassName('volumeCircle')[0].getElementsByTagName("div")[0].innerText = `${Math.round(volumePerc*100)}%`
    document.getElementsByClassName('volumeCircle')[0].style = `margin-bottom:calc(${volumePerc*80}px - 0.5vw)`
}

async function toggleMute() {
    if (video.muted === true) {
        video.muted = false;
        volumePercentage = video.volume
        await volumeIconUpdate(volumePercentage)
    }
    else {
        video.muted = true;
        document.getElementsByClassName('volumePotInnerBar')[0].style.height = `0%`
        volumePercentage = 0
    }
    await volumeIconUpdate(volumePercentage)
    document.getElementsByClassName('volumeInnerBar')[0].style.height = `${volumePercentage*80}px`
    document.getElementsByClassName('volumeCircle')[0].style = `margin-bottom:calc(${volumePercentage*80}px - 10px)`
    document.getElementsByClassName('volumeCircle')[0].getElementsByTagName("div")[0].innerText = `${Math.round(volumePercentage*100)}%`
}

volumeMouseOut()
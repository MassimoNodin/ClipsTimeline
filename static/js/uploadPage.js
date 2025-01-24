uploadButton = document.getElementsByClassName("uploadInput")[0]
progressBar = document.getElementsByClassName("innerBar")[0]
uploadButton.addEventListener("input", uploadStart)

async function uploadStart() {
    document.getElementsByClassName("uploadField")[0].classList.add("uploading")
    let videoFile = uploadButton.files[0];

    var date = new Date(videoFile.lastModified);
    day = date.getDate()
    month = date.getMonth()
    year = date.getFullYear()

    let formData = new FormData();
    formData.append("videoFile", videoFile);

    xhr = new XMLHttpRequest();
    xhr.open('POST', `/upload?day=${day}&month=${month+1}&year=${year}`, true);
    xhr.upload.addEventListener('progress', function (event) {
        updateProgressBar(event)
    })

    xhr.addEventListener('load', function () {
        window.location.href = window.location.origin + "/upload-manage?id=" + JSON.parse(xhr.response)["id"]
      });
    
      xhr.addEventListener('error', function () {
        console.error('Error during upload');
      });

      xhr.send(formData);
}

function updateProgressBar(event) {
    if (event.lengthComputable) {
        progressText = document.getElementsByClassName("progressPercentage")[0]
        progress = (event.loaded / event.total) * 98;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }
}
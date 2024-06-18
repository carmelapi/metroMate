// -----------------------------DEFINE VARIABLES---------------------------------------
// Select element from DOM
let inputBtn = document.querySelector(".section__input .input__btn");
let modale = document.querySelector(".modale");
let values = document.querySelector(".section__values");
let valueLine = document.querySelector(".value--line");
let valueWalkingTime = document.querySelector(".value--walking-time");
let selectDirection = document.querySelector(".select--direction");
let alertSection = document.querySelector(".alert");
let alertSquare = document.querySelector(".alert__square");
let alertText = document.querySelector(".alert__text");
let alertDisplay = document.querySelector(".display");
let alertMessage = document.querySelector(".message");
let alertNextTrain = document.querySelector(".nextTrain");

// Set global variable
let trains = [];
let resultExpected = [];
let selectedOptionValue;
let currentTime;
let expectedTime;

// --------------------------------------------------------------------
async function getData(lineValue, walkingTimeValue) {
  // Extrapolate hours and minutes of NewData
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = ("0" + date.getSeconds()).slice(-2);
  currentTime = `${hours}:${minutes}:${seconds}`;

  inputBtn.addEventListener("click", () => {
    // Get values of the inputs
    let lineValue = document.querySelector(".input--line").value;
    let walkingTimeValue = document.querySelector(".input--walkingTime").value;

    if (walkingTimeValue.length === 1) {
      walkingTimeValue = `0${walkingTimeValue}`;
    }

    // Show the values in html
    let showLine = document.createElement("h2");
    showLine.innerHTML = lineValue;
    valueLine.appendChild(showLine);
    let showWalkingTime = document.createElement("h2");
    showWalkingTime.innerHTML = walkingTimeValue;
    valueWalkingTime.appendChild(showWalkingTime);

    // Hide modale and show values
    modale.style.display = "none";
    values.style.visibility = "visible";

    // Pass values to getData function
    getData(lineValue, walkingTimeValue);
  });

  // GET DATA API
  let url = `https://transport.integration.sl.se/v1/sites/1002/departures?transport=METRO&line=${lineValue}&forecast=60`;
  const response = await fetch(url);
  const result = await response.json();
  // console.log("result", result);

  // Create option in direction
  let mapDirection = [
    ...new Set(result.departures.map((element) => element.direction)),
  ];
  mapDirection.forEach((direction) => {
    let option = document.createElement("option");
    option.text = direction;
    option.value = direction;
    selectDirection.add(option);
  });

  selectDirection.addEventListener("change", (event) => {
    selectedOptionValue = event.target.value;
    getExpectedTime(selectedOptionValue);
    alertSection.style.visibility = "visible";
  });

  // create a new array with the elements that have the destination - as "Fruängen"
  function getExpectedTime(selectedOptionValue) {
    // Filter trains for directions
    trains = result.departures.filter(
      (element) => element.direction === selectedOptionValue
    );
    console.log("train", trains);

    // Extrapolate hours and minutes of Expected
    let expectedEl;
    let trainsSchedule = trains.map((el) => {
      expectedEl = el.expected;
      for (let i = 0; i < expectedEl.length; i++) {
        if (expectedEl[i] === "T") {
          expectedTime = expectedEl.slice(i + 1, i + 9);
        }
      }

      return expectedTime;
    });
    console.log("trainsSchedule", trainsSchedule);

    // Function to subtract two times
    function subtractTimes(time1, time2) {
      const toSeconds = (time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      };

      const secondsToTime = (seconds) => {
        // Calculate hours, minutes and seconds
        const hours = Math.floor(seconds / 3600);
        // Calculate minutes: The remainder of the division of the total seconds by 3600 is divided by 60
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(secs).padStart(2, "0")}`;
      };

      const seconds1 = toSeconds(time1);
      const seconds2 = toSeconds(time2);
      // abs to avoid negative values
      const diffInSeconds = Math.abs(seconds1 - seconds2);

      return secondsToTime(diffInSeconds);
    }

    // Calculate the difference between expected time and newData
    let trainMinutes = subtractTimes(trainsSchedule[0], currentTime);

    // Create an array with the time of the train and the minutes to walk
    let walkingTime = "00:" + walkingTimeValue + ":00";

    // ----------------- CODE LOGIC -----------------
    console.log("trainMinutes", trainMinutes);

    console.log("walkingTime", walkingTime);

    const arr = trainMinutes.split(":").slice(1);
    console.log("arr2", arr);

    // Messages to display of the current train
    let textDisplay = document.createElement("h2");
    textDisplay.innerHTML = `${trainMinutes} min`;
    alertDisplay.appendChild(textDisplay);
    // Messages to display of the next train
    let textNextTrain = document.createElement("h2");
    textNextTrain.innerHTML = `${subtractTimes(
      trainsSchedule[1],
      currentTime
    )} min`;
    alertNextTrain.appendChild(textNextTrain);

    // different conditions to display the color of the alert
    // Red
    if (trainMinutes > walkingTime) {
      alertSquare.style.backgroundColor = "#ff0000";

      alertMessage.innerHTML = "Now is not the time!!";
      alertSquare.appendChild(alertMessage);

      // Yellow
    } else if (trainMinutes === walkingTime) {
      alertSquare.style.backgroundColor = "#fff500";

      alertMessage.innerHTML = "Hurry! You have to go out now!";
      alertSquare.appendChild(alertMessage);

      // Green
    } else {
      alertSquare.style.backgroundColor = "#00ff75";
      alertSquare.style.color = "#000E31";

      alertMessage.innerHTML = "You can leave now";
    }
  }
}

// upload the api data to the page every 60 seconds
getData();
setInterval(function () {
  location.reload();
}, 60000);

const floorHeightInPx = getComputedStyle(document.querySelector("html")).getPropertyValue("--floor-height");
const floorHeight = parseInt(floorHeightInPx.slice(0, floorHeightInPx.length - 2));
let liftsCount, floorsCount;
const liftsAvailability = new Map();
const liftAt = new Map();
const floorLiftMap = new Map();
const pendingCalls = [];

document.querySelector("button#submit").addEventListener("click", (event) => {
    event.preventDefault(); //to stop page from reloading and showing values in the url i.e. preventing default submit behaviour

    const floorsInput = document.querySelector("#floors-input");
    const liftsInput = document.querySelector("#lifts-input");
    floorsCount = floorsInput.value;
    liftsCount = liftsInput.value;

    //if liftsCount or floorsCount is invalid, show alert and return
    if (floorsCount <= 0 || floorsCount > 500 || liftsCount <= 0 || liftsCount > 10) {
        alert("Invalid input! Try again.");
        return;
    }

    //if the code execution comes here means we have valid input and hence we can proceed with generating UI
    const inputBox = document.querySelector("#input-box");
    inputBox.style.display = "none";

    //showing user entered floors and lifts count
    const floorsCountContainer = document.querySelector("#floors-count");
    const liftsCountContainer = document.querySelector("#lifts-count");
    floorsCountContainer.textContent = `Floor count - ${floorsCount}`;
    liftsCountContainer.textContent = `Lift count - ${liftsCount}`;

    renderFloors(floorsCount);
    renderLifts(liftsCount);

    //listen to click events on buttons - up/down
});

function handleLiftCall(event) {
    const calledFloor = event?.target.parentElement.parentElement;
    const floorId = calledFloor.id;
    if (floorLiftMap.get(floorId) != null) {
        const mappedLiftId = floorLiftMap.get(floorId);
        if (liftsAvailability.get(mappedLiftId)) {
            liftsAvailability.set(mappedLiftId, false);
            openAndCloseDoors(floorId, mappedLiftId);
        }
        return;
    }
    //search for a freeLift
    for (let liftNumber = 1; liftNumber <= liftsCount; liftNumber++) {
        const liftId = `lift-${liftNumber}`;
        if (liftsAvailability.get(liftId)) {
            moveLift(floorId, liftId);
            return;
        }
    }

    pendingCalls.push(floorId);
}

function moveLift(floorId, liftId) {
    if (floorLiftMap.get(floorId) != null) {
        const mappedLiftId = floorLiftMap.get(floorId);
        if (liftsAvailability.get(mappedLiftId)) {
            liftsAvailability.set(mappedLiftId, false);
            openAndCloseDoors(floorId, mappedLiftId);
        }
        return;
    }

    liftsAvailability.set(liftId, false);
    floorLiftMap.set(floorId, liftId);
    //unmap previous floor-lift mapping with current lift
    floorLiftMap.forEach((value, key) => {
        if (key !== floorId && value === liftId) {
            floorLiftMap.set(key, null);
        }
    });

    const floor = document.querySelector(`#${floorId}`);
    const lift = document.querySelector(`#${liftId}`);
    const arr = floorId.split('-');
    const floorNumber = parseInt(arr[arr.length - 1]);

    const prevFloor = liftAt.get(liftId);
    const diff = Math.abs(prevFloor - floorNumber);
    const transitionDuration = diff * 1 + 5; // Adding 5 seconds for door open/close

    lift.style.transform = `translateY(-${floorNumber * floorHeight}px)`;
    lift.style.transition = `all ${transitionDuration}s`;
    setTimeout(() => {
        openAndCloseDoors(floorId, liftId);
    }, transitionDuration * 1000);

    liftAt.set(liftId, floorNumber);
}

function openAndCloseDoors(floorId, liftId) {
    const lift = document.querySelector(`#${liftId}`);
    const leftDoor = lift.querySelector(".left-door");
    const rightDoor = lift.querySelector(".right-door");
    leftDoor.classList.add("left-move");
    rightDoor.classList.add("right-move");
    setTimeout(() => {
        leftDoor.classList.remove("left-move");
        rightDoor.classList.remove("right-move");
        //this lift will be free after 2500ms
        setTimeout(() => {
            liftsAvailability.set(liftId, true);
            if (pendingCalls.length > 0) {
                const floorIdFromRemainingCalls = pendingCalls[0];
                pendingCalls.shift();
                moveLift(floorIdFromRemainingCalls, liftId);
            }
        }, 2500);
    }, 2500);
}

function renderFloors(totalFloors) {
    const floorsContainer = document.querySelector("#floors-container");
    for (let floorNumber = totalFloors; floorNumber > 0; floorNumber--) {
        const currentFloor = document.createElement("section");
        currentFloor.className = "floor";
        const floorId = `floor-${floorNumber}`;
        currentFloor.id = floorId;
        currentFloor.innerHTML =
            `
                <section class="floor-details">
                    <button class="lift-control up">UP</button>
                    <p class="floor-number">Floor-${floorNumber}</p>
                    <button class="lift-control down">DOWN</button>
                </section>
        `;
        currentFloor.querySelector(".up").addEventListener("click", (event) => handleLiftCall(event));
        currentFloor.querySelector(".down").addEventListener("click", (event) => handleLiftCall(event));

        floorsContainer.appendChild(currentFloor);
        floorLiftMap.set(floorId, null);
    }
    const groundFloor = document.createElement("section");
    groundFloor.className = "floor";
    groundFloor.id = `floor-0`;
    groundFloor.innerHTML =
        `
            <section class="floor-details">
                <button class="lift-control up">UP</button>
                <p class="floor-number">Floor-0</p>
            </section>
    `;
    groundFloor.querySelector(".up").addEventListener("click", (event) => handleLiftCall(event));
    floorsContainer.appendChild(groundFloor);
    floorLiftMap.set("floor-0", null);

    floorsContainer.style.visibility = "visible";
    floorsContainer.style.border = `2px solid var(--primary-color)`;
}

function renderLifts(totalLifts) {
    const groundFloor = document.querySelector("#floor-0");
    for (let liftNumber = 1; liftNumber <= totalLifts; liftNumber++) {
        const currentLift = document.createElement("section");
        currentLift.className = "lift";
        currentLift.id = `lift-${liftNumber}`;
        currentLift.innerHTML =
            `
            <section class="door left-door"></section>
            <section class="door right-door"></section>
        `;
        liftsAvailability.set(`lift-${liftNumber}`, true);
        liftAt.set(`lift-${liftNumber}`, 0);
        groundFloor.appendChild(currentLift);
    }
}
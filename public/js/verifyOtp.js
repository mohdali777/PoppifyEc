const resendLink = document.getElementById('resend-link');
  const resendTimer = document.getElementById('resend-timer');

  let countdown = 10; // 10 seconds
  resendLink.style.pointerEvents = "none"; // Disable the link
  resendLink.style.color = "gray"; // Change appearance to indicate it's disabled

  function updateTimer() {
    if (countdown > 0) {
      resendTimer.textContent = `(${countdown} seconds)`; // Update the timer near the link
      countdown--;
    } else {
      resendTimer.textContent = ''; // Clear the timer
      resendLink.style.pointerEvents = "auto"; // Enable the link
      resendLink.style.color = "blue"; // Restore normal appearance
      clearInterval(timerInterval); // Stop the timer
    }
  }

  // Start the countdown
  const timerInterval = setInterval(updateTimer, 1000);

  // Initial display
  updateTimer();
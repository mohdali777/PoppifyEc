async function renderRevenueChart() {
    try {
      const FilterData = document.getElementById("timePeriod").value || "monthly";
  
      const response = await fetch(`/admin/dashChart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Specify the request format
        },
        body: JSON.stringify({ filter: FilterData }), // Send the filter type in the body
      });
      const data = await response.json();
  
      if (data.success) {
        const ctx = document.getElementById("revenueChart").getContext("2d");
  
        if (window.revenueChart && typeof window.revenueChart.destroy === "function") {
          window.revenueChart.destroy();
        }
  
        // Create the new chart
        window.revenueChart = new Chart(ctx, {
          type: "bar",
          data: {
              labels: data.labels, 
            datasets: [
              {
                label: "Revenue",
                data: data.data, 
                backgroundColor: "#3b82f6",
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (value) => "$" + value + "k" }, // Adding "$" and "k" to the y-axis labels
              },
            },
          },
        });
  
       
      } else {
        console.error("Error fetching revenue data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  
  // Automatically load the chart on window load
  window.onload = renderRevenueChart;
  
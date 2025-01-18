function addmoney(){
    const container = document.getElementById("addmoneyContainer")
    container.style.display = "block"
    }
    
    
    let currentPage = 1;
        const rowsPerPage = 10;
        let transactions = []; // Store all transactions here
    
        function fetchTransactionData() {
            fetch("/transactionDeatails", { method: "GET" })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    transactions = data.transactions;
                    Cardbalance = data.balance
                    displayTransactions();
                })
                .catch((error) => {
                    console.error("Error fetching transaction data:", error);
                });
        }
    
        function displayTransactions() {
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const currentTransactions = transactions.slice(startIndex, endIndex);
            const balance = document.getElementById("card-balance");
    
            const tableBody = document.getElementById('transactionTableBody');
            tableBody.innerHTML = ''; // Clear previous rows
    
            currentTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.transactionId}</td>
                    <td>${new Date(transaction.transactionDate).toLocaleString()}</td>
                    <td>${transaction.description}</td>
                    <td class="${transaction.type === 'debit' ? 'text-danger' : 'text-success'}">
                        ${transaction.type === 'debit' ? '-' : '+'} ${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                `;
                tableBody.appendChild(row);
            });
            console.log(balance);
            
            balance.textContent = Cardbalance;
    
            updatePaginationInfo();
        }
    
        function changePage(direction) {
            const totalPages = Math.ceil(transactions.length / rowsPerPage);
            currentPage += direction;
    
            if (currentPage < 1) {
                currentPage = 1;
            } else if (currentPage > totalPages) {
                currentPage = totalPages;
            }
    
            displayTransactions();
        }
    
        function updatePaginationInfo() {
            const totalPages = Math.ceil(transactions.length / rowsPerPage);
            document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        }
    
    
    
    window.onload = fetchTransactionData;
    
    
    document.getElementById("closeModal").addEventListener("click",function(e){
    e.preventDefault()
    const container = document.getElementById("addmoneyContainer")
    container.style.display = "none"
    })
    function addmoneyToWallet(e) {
        e.preventDefault();
        const amount = document.getElementById("amount").value;
    
        // Validate the input
        if (!amount) {
            return alert("Please enter an amount.");
        }
    
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return alert("Please enter a valid positive number.");
        }
    
        
        const requestBody = JSON.stringify({ amount: numericAmount });
    
      
        fetch("/addmoney", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: requestBody,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to add money to wallet.");
            }
            return response.json();
        })
        .then(data => {
            if (data.razorpayOrderId) {
                      console.log('enterrazorpay');    
                initializeRazorpay(data.razorpayOrderId, requestBody.amount, data.keyId);
                
            }else{
                alert("an error occured During add money")
            }
        })
        .catch(error => {
            console.error(error);
            alert("An error occurred. Please try again.");
        });
    }
    
    function initializeRazorpay(razorpayOrderId, amount, keyId) {
        console.log("Initializing Razorpay...");
        console.log("Razorpay Order ID:", razorpayOrderId);
    
        const options = {
            key: keyId, 
            amount: Math.round(amount * 100), // Convert to paisa
            currency: "INR",
            name: "Poppify",
            description: "Add money to Wallet",
            order_id: razorpayOrderId,
            handler: function (response) {
                console.log("Payment successful response:", response);
                verifyPayment(response, razorpayOrderId);
            },
            prefill: {
                name: "first name",
                email:" orderDetails.email",
                contact: "orderDetails.phone",
            },
            theme: {
                color: "#3399cc",
            },
        };
    
        const razorpay = new Razorpay(options);
        razorpay.open();
    }
    
    function verifyPayment(response, razorpayOrderId) {
        console.log("Verifying Payment...");
        console.log("Response:", response);
    
        fetch('/verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                type:"Wallet"
            }),
        })
            .then(res => res.json())
            .then(data => {
                console.log("Payment verification data:", data);
                if (data.success) {
                    swal({
                        title: "Payment Successful",
                        text: "Money added to wallet Successfull!",
                        icon: "success",
                        button: "OK",
                    }).then(()=>{
                        fetchTransactionData()
                        const container = document.getElementById("addmoneyContainer")
                        container.style.display = "none"
                    });
                    
                } else {
                    swal({
                        title: "Payment Failed",
                        text: data.message,
                        icon: "error",
                        button: "OK",
                    });
                }
            })
            .catch(err => {
                console.error("Payment verification failed:", err);
                alert("Failed to verify payment. Please contact support.");
            });
    }
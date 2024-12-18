
function formvalidation(e){
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById("password").value; 
    let email = document.getElementById("email").value;
    const phonenumber = document.getElementById("phonenumber").value;
    const confirmpassword = document.getElementById("confirmpassword").value;

    if(username == ""||password ==""|| email==""||phonenumber==""||confirmpassword==""){
        alert("enter all feilds")
        return false
    }else if(password.length <8 ){
        alert("enter 8 Charecter")
        return false
    }else if(password !== confirmpassword){
        alert ("password sosent match")
        return false;
    }else if(phonenumber.length<10){
alert("Enter 10 Digit Mobile Number")
return false;
    }
    else{
        e.currentTarget.submit();
        return true
    }

}

document.getElementById("formsignup").addEventListener("submit",formvalidation)

// sigin validation start



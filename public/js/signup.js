
function formvalidation(e){
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById("password").value; 
    let email = document.getElementById("email").value

    if(username == ""||password ==""|| email==""){
        alert("enter all feilds")
        return false
    }else if(password.length <8 ){
        alert("enter 8 Charecter")
        return false
    }
    else{
        e.currentTarget.submit();
        return true
    }

}

document.getElementById("formsignup").addEventListener("submit",formvalidation)

// sigin validation start



  async function verificarLogin(){

    const sessionStorage = localStorage.getItem("usuarioLogado");

    if(!sessionStorage){

        window.location.href = "/login.html";
        return;

    }

    const session = JSON.parse(sessionStorage);

    // verifica expiração
    const agora = Math.floor(Date.now() / 1000);

    if(session.expires_at < agora){

        localStorage.removeItem("usuarioLogado");

        window.location.href = "/login.html";

        return;

    }

    //console.log("Usuário autenticado");

  }

verificarLogin();

window.addEventListener("DOMContentLoaded", () => {

   const menuBtn = document.getElementById("menuBtn");
   const sidebar = document.getElementById("sidebar");
   const overlay = document.getElementById("overlay");

   if(menuBtn){

      menuBtn.addEventListener("click", () => {

         sidebar.classList.toggle("active");
         overlay.classList.toggle("active");

      });

   }

   if(overlay){

      overlay.addEventListener("click", () => {

         sidebar.classList.remove("active");
         overlay.classList.remove("active");

      });

   }

});
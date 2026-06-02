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

// vamos verificar os niveis de acesso dele

async function validarAcesso(){

   const { data: auth } =
   await supabaseGet.auth.getUser();

   if(!auth.user){

      window.location.href = "/login";

      return;

   }

   const { data: usuario } =
   await supabaseGet
   .from("usuarios")
   .select("perfil")
   .eq("id", auth.user.id)
   .single();

   return usuario;

}

validarAcesso();

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

function toggleUsuarios(){

   const content =
   document.getElementById("usuariosContent");

   const icon =
   document.getElementById("usuariosIcon");

   content.classList.toggle("active");

   if(content.classList.contains("active")){

      icon.innerText = "▲";

   } else {

      icon.innerText = "▼";

   }

}

async function carregarUsuarios(){

  const perfil = await validarAcesso();

  if(perfil.perfil == "ADMIN"){
      // mostrar cabealhos de edição
      document.getElementById("thEditar").style.display = "table-cell"
      document.getElementById("thExcluir").style.display = "table-cell"
   }

   const { data, error } = await supabaseGet
      .from("usuarios")
      .select(`
         id,
         nome,
         email,
         perfil,
         conjunto,
         status,
         created_at
      `)
      .order("id", { ascending: false })

   if(error){

      console.log(error)
      return

   }

   console.log(data)

   const tbody = document.getElementById("tbodyUsuarios")

   tbody.innerHTML = ""

   for (const item of data) {

      const dataFormatada = new Date(item.created_at)
      .toLocaleString("pt-BR")


      tbody.innerHTML += `

         <tr>
           
            <td>${item.id}</td>

            <td>${item.nome || "-"}</td>

            <td>${item.email || "-"}</td>

            <td>${item.perfil || "-"}</td>

            <td>${item.conjunto || "-"}</td>

            <td>${item.status || "-"}</td>

            <td>${dataFormatada}</td>

             ${
               
               perfil.perfil == "ADMIN"
               ?
               `
                  <td>
                     <button
                        class="btn-action btn-edit"
                        onclick='editarUsuario(${JSON.stringify(item)})'
                     >
                        Editar
                     </button>
                  </td>

                  <td>
                     <button
                        class="btn-action btn-delete"
                        onclick="excluirUsuario(${item.id})"
                     >
                        Excluir
                     </button>
                  </td>
               `
               :
               ""
            }

         </tr>


      `

   }

}

carregarUsuarios()

function editarUsuario(usuario){

   usuarioEditando = usuario.id;

   document
   .getElementById("tituloModalUsuario")
   .innerText = "Editar Usuário";

   document
   .getElementById("inputNomeUsuario")
   .value = usuario.nome || "";

   document
   .getElementById("inputEmailUsuario")
   .value = usuario.email || "";

   document
   .getElementById("inputPerfilUsuario")
   .value = usuario.perfil.toUpperCase() || "";

   document
   .getElementById("inputConjuntoUsuario")
   .value = usuario.conjunto || "";

   document
   .getElementById("inputStatusUsuario")
   .value = usuario.status.toUpperCase() || "ATIVO";

   document
   .getElementById("modalUsuario")
   .classList.add("active");

}

function fecharModalUsuario(){

   document
   .getElementById("modalUsuario")
   .classList.remove("active");

}
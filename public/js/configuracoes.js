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

function toggleManual(){

   const content =
   document.getElementById("manualContent");

   const icon =
   document.getElementById("manualIcon");

   content.classList.toggle("active");

   if(content.classList.contains("active")){

      icon.innerText = "▲";

   } else {

      icon.innerText = "▼";

   }

}

function toggleRuas(){

   const content =
   document.getElementById("ruasContent");

   const icon =
   document.getElementById("ruasIcon");

   content.classList.toggle("active");

   if(content.classList.contains("active")){

      icon.innerText = "▲";

      carregarRuas()

   } else {

      icon.innerText = "▼";

   }

}

 async function carregarRuas(){

   const { data, error } = await supabaseGet
      .from('ruas')
      .select('*')
      .order("id", { ascending: true })

   if(error){

      console.log(error)

      return

   }

   const tableRuas =
   document.getElementById("tbodyRuas")

   tableRuas.innerHTML = ""

   data.forEach((rua) => {

      tableRuas.innerHTML += `

         <tr>

            <td>
               ${rua.id}
            </td>

            <td>
               ${rua.nome || "-"}
            </td>

            <td>
               ${rua.slug || "-"}
            </td>

             <td>
               ${rua.responsavel || "-"}
            </td>

            <td>

               <span class="${
                  rua.status == "ATIVO"
                  ? "status-ativa"
                  : "status-inativa"
               }">

                  ${rua.status || "-"}

               </span>

            </td>

            <td>
               ${rua.conjunto || "-"}
            </td>

            <td>
               <button class="btn-qr" onclick="abrirQRCode('${rua.slug}')">
                  <i class="bi bi-qr-code"></i> Abrir
               </button>
            </td>

            <td>

               <button
                  class="btn-action"
                  onclick='editarRua(${JSON.stringify(rua)})'
               >
                  ✏
               </button>

               <button
                  class="btn-action"
                  onclick="excluirRua(${rua.id})"
               >
                  🗑
               </button>

            </td>

         </tr>

      `

   })

}

function abrirQRCode(slug){

   let link = `https://projeto-monitoramento-one.vercel.app/painel-cliente/${slug}`

   document.getElementById("modalQR").style.display = "flex"

   QRCode.toCanvas(
      document.getElementById("canvasQR"),
      link,
      {
         width: 300
      }
   )
}

function fecharQR(){
   document.getElementById("modalQR").style.display = "none"

   let canvas = document.getElementById("canvasQR")
   let ctx = canvas.getContext("2d")

   ctx.clearRect(0,0,canvas.width,canvas.height)
}

// =========================
// MODAL
// =========================

function abrirModalRua(){

   ruaEditando = null;

   document
   .getElementById("tituloModalRua")
   .innerText = "Nova Rua";

   document
   .getElementById("inputNomeRua")
   .value = "";

   document
   .getElementById("inputResponsavelRua")
   .value = "";

   document
   .getElementById("inputConjuntoRua")
   .value = "";

   document
   .getElementById("inputStatusRua")
   .value = "ATIVO";

   document
   .getElementById("modalRua")
   .classList.add("active");

}

function fecharModalRua(){

   document
   .getElementById("modalRua")
   .classList.remove("active");

}

// =========================
// EDITAR
// =========================

function editarRua(rua){

   ruaEditando = rua.id;

   document
   .getElementById("tituloModalRua")
   .innerText = "Editar Rua";

   document
   .getElementById("inputNomeRua")
   .value = rua.nome || "";


   document
   .getElementById("inputResponsavelRua")
   .value = rua.responsavel || "";

   document
   .getElementById("inputConjuntoRua")
   .value = rua.conjunto || "";

   document
   .getElementById("inputStatusRua")
   .value = rua.status || "ATIVO";

   document
   .getElementById("modalRua")
   .classList.add("active");

}

// =========================
// SALVAR
// =========================



async function salvarRua(){

   const nome =
   document.getElementById("inputNomeRua").value;

   const slug = nome.split(",")[0].toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .replace(/\s+/g, "-") + nome.split(",")[1].trim();

   const responsavel =
   document.getElementById("inputResponsavelRua").value;

   const conjunto =
   document.getElementById("inputConjuntoRua").value;

   const status =
   document.getElementById("inputStatusRua").value;

   if(!nome){

      alert("Digite a rua");
      return;

   }

   if(ruaEditando){

      await supabaseGet
      .from("ruas")
      .update({
         nome,
         slug,
         responsavel,
         conjunto,
         status
      })
      .eq("id", ruaEditando);

   } else {

      await supabaseGet
      .from("ruas")
      .insert({
         nome,
         slug,
         responsavel,
         conjunto,
         status
      });

   }

   fecharModalRua();

   carregarRuas();

}

// =========================
// EXCLUIR
// =========================

async function excluirRua(id){

   const confirmar =
   confirm("Deseja excluir a rua?");

   if(!confirmar){
      return;
   }

   await supabaseGet
   .from("ruas")
   .delete()
   .eq("id", id);

   carregarRuas();

}
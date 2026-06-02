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

// validar acesso
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

let alertaAtual = null;

window.addEventListener("DOMContentLoaded", () => {

      console.log("Dashboard carregado");

      const menuBtn = document.getElementById("menuBtn");
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("overlay");

      menuBtn.addEventListener("click", () => {

          sidebar.classList.toggle("active");
          overlay.classList.toggle("active");

      });

      overlay.addEventListener("click", () => {

          sidebar.classList.remove("active");
          overlay.classList.remove("active");

      });

    });

async function carregarHistorico(){

   const { data, error } = await supabaseGet
      .from("mensagens_alertas")
      .select(`
         id,
         created_at,
         atendente,
         id_rua,
         tipo_servico,
         dispositivo,
         conexao
      `)
      .order("id", { ascending: false })

   if(error){

      console.log(error)
      return

   }

   console.log(data)

   const tbody = document.getElementById("tbodyHistorico")

   tbody.innerHTML = ""

   for (const item of data) {

      const dataFormatada = new Date(item.created_at)
      .toLocaleString("pt-BR")

      const atendimentos = await buscarAtendimentos(item.id)

      let htmlAtendimentos = "";

        atendimentos.forEach(atendimento => {

        htmlAtendimentos += `

            <div class="card-atendimento">

                <strong>Operador:</strong>
                ${atendimento.operador}

                <br><br>

                <strong>Status:</strong>
                ${atendimento.status}

                <br><br>

                <strong>Observações:</strong>
                ${atendimento.observacoes || "-"}

                <br><br>

                <strong>Observações:</strong>
                ${atendimento.prioridade || "-"}

            </div>

        `

        })

      tbody.innerHTML += `

         <tr>
           
           <td>

                <button onclick="toggleDetalhes('${item.id}')">
                    ▶
                </button>

            </td>

            <td>${item.id}</td>

            <td>${dataFormatada}</td>

            <td>${item.atendente || "-"}</td>

            <td>${atendimentos.length || "-"}</td>

            <td>${item.id_rua || "-"}</td>

            <td>${item.tipo_servico || "-"}</td>

            <td>${item.dispositivo || "-"}</td>

            <td>${item.conexao || "-"}</td>

             <td>
               <button 
                  class="btn-action btn-qr"
                  onclick="abrirFormularioAtendimento('${item.id}', '${item.id_rua}')"
               >
                  Anotar Atendimento
               </button>
            </td>

         </tr>
         <tr
            id="detalhes-${item.id}"
            class="linha-detalhes hidden"
            >

            <td colspan="8">

                ${htmlAtendimentos}

            </td>

         </tr>

      `

   }

}

const mensagens = []

async function carregarMensagens(){

   const perfil = await validarAcesso();

   const { data, error } = await supabaseGet
      .from("mensagens")
      .select(`
         id,
         created_at,
         rua_nome,
         nome,
         email,
         assunto,
         mensagem,
         status,
         anexos
      `)
      .order("id", { ascending: false })

   if(error){

      console.log(error)
      return

   }

   console.log(data)

   const tbody = document.getElementById("tbodyMensagens")

   tbody.innerHTML = ""

   for (const item of data) {

      mensagens.push(item);

      const dataFormatada = new Date(item.created_at)
      .toLocaleString("pt-BR")


      tbody.innerHTML += `

         <tr>
           
           <td>

                <button onclick="toggleDetalhes('${item.id}')">
                    ▶
                </button>

            </td>

            <td>${item.id}</td>

            <td>${dataFormatada}</td>

            <td>${item.rua_nome || "-"}</td>

            <td>${item.nome || "-"}</td>

            <td>${item.email || "-"}</td>

            <td>${item.assunto || "-"}</td>

            <td>${item.mensagem || "-"}</td>

            ${
               
               perfil.perfil == "ADMIN"
               ? `

                  <td class="status-select status-${item.status}">

                  <select
                     onchange="alterarStatus(${item.id}, this.value)"
                  >

                     <option
                        value="ABERTO"
                        ${item.status == "ABERTO" ? "selected" : ""}
                     >
                        ABERTO
                     </option>

                     <option
                        value="PENDENTE"
                        ${item.status == "PENDENTE" ? "selected" : ""}
                     >
                        PENDENTE
                     </option>

                     <option
                        value="FECHADO"
                        ${item.status == "FECHADO" ? "selected" : ""}
                     >
                        FECHADO
                     </option>

                  </select>

               </td>

               
               ` :

                 ` <td class="status-select status-${item.status}">${item.status || "-"}</td> `
            
            }

            

             <td>
               <button 
                  class="btn-action btn-qr"
                  onclick="abrirAnexos('${item.id}')"
               >
                  Abrir Anexos
               </button>
            </td>

         </tr>
      `

   }

}

async function alterarStatus(idMensagem, novoStatus){

   console.log(
      idMensagem,
      novoStatus
   );

   const { error } = await supabaseGet
   .from("mensagens")
   .update({
      status: novoStatus
   })
   .eq("id", idMensagem);

   if(error){

      console.log(error);

      alert(
         "Erro ao alterar status"
      );

      return;

   }

   alert(`Mensagem ${idMensagem} atualizada para ${novoStatus}`);

}

async function abrirAnexos(id){

    const mensagem = mensagens.find(m => m.id == id);

    const anexos = mensagem.anexos || [];

    const container = document.getElementById("containerAnexos");

    container.innerHTML = "";

    for(const anexo of anexos){

        const { data } = supabaseGet.storage
            .from("mensagens")
            .getPublicUrl(anexo.caminho);

        const url = data.publicUrl;

        container.innerHTML += `

            <div class="anexo-card">

                <h4>${anexo.nome}</h4>

                ${
                    anexo.tipo.includes("pdf")
                    ?
                    `<iframe
                        src="${url}"
                        width="40%"
                        height="600"
                        style="border:1px solid #ccc;border-radius:8px;">
                    </iframe>`
                    :
                    `<img
                        src="${url}"
                        style="
                            width:40%;
                            max-height:800px;
                            object-fit:contain;
                            border-radius:8px;
                        "
                    >`
                }

            </div>

        `;

    }

    document.getElementById("modalAnexos").showModal();

}

function trocarPreview(url){

    document.getElementById("previewAnexo").src = url;

}

function toggleHistorico(){

   const content =
   document.getElementById("hstoricoContent");

   const icon =
   document.getElementById("ruasIconAlertas");

   content.classList.toggle("active");

   if(content.classList.contains("active")){

      icon.innerText = "▲";

      carregarHistorico()

   } else {

      icon.innerText = "▼";

   }

}

function toggleMensagens(){

   const content =
   document.getElementById("mensagensContent");

   const icon =
   document.getElementById("ruasIconMensagens");

   content.classList.toggle("active");

   if(content.classList.contains("active")){

      icon.innerText = "▲";

      carregarMensagens()

   } else {

      icon.innerText = "▼";

   }

}

function abrirFormularioAtendimento(idMensagem, idRua){

   alertaAtual = { idAlerta: idMensagem, idRua: idRua };

   document.getElementById("texto-registro").textContent = "Registro de Atendimento - ID: " + idMensagem;

      document
      .getElementById("modalAtendimento")
      .classList.add("active");
   

}

// salvar atendimento
    async function salvarAtendimento(){

      const status =
      document.getElementById("statusAtendimento").value;

      const prioridade =
      document.getElementById("prioridadeAtendimento").value;

      const suporteExterno =
      document.getElementById("suporteExterno").value;

      const observacoes =
      document.getElementById("observacoesAtendimento").value;

      const usuario = JSON.parse(
          localStorage.getItem("usuarioDados")
      );

      const { data, error } = await supabaseGet
          .from("atendimentos")
          .insert({

            id_alerta: alertaAtual?.idAlerta || null,

            id_rua: alertaAtual?.idRua || null,

            operador: usuario?.email || "OPERADOR",

            status,

            prioridade,

            suporte_externo: suporteExterno,

            observacoes

          });

      if(error){

          console.log(error);

          alert("Erro ao salvar");

          return;

      }

      alert("Atendimento salvo!");

      fecharModalAtendimento();

    }

// fecha modal
   function fecharModalAtendimento(){

   document
         .getElementById("modalAtendimento")
         .classList.remove("active");

   }

function toggleDetalhes(id){

   const linha =
   document.getElementById(`detalhes-${id}`);

   linha.classList.toggle("hidden");

}

async function buscarAtendimentos(idAlerta){
    const { data, error } = await supabaseGet
      .from("atendimentos")
      .select("*")
      .eq("id_alerta", idAlerta)
      .order("created_at", { ascending:false })

   if(error){

      console.log(error)
      return

   }

   console.log("Atendimentos relacionados", data)

   return data;
}


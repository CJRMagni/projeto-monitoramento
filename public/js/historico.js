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



carregarHistorico()
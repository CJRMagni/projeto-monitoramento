

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

   const canalAlertas = supabaseGet
    .channel("alertas_push")

    .on(
      "postgres_changes",
      {
          event: "INSERT",
          schema: "public",
          table: "mensagens_alertas",
      },

      async (payload) => {

          console.log("payload", payload);

          const alerta = payload.new;

          mostrarNotificacao(alerta);

      }

    )

    .subscribe();

    function mostrarNotificacao(alerta){

    console.log("Mostrando notificação para alerta:", alerta);

   if(Notification.permission !== "granted"){
      return;
   }

   navigator.serviceWorker.ready
   .then(registration => {

      registration.showNotification(

         "🚨 Novo Alerta",

         {
            body:
            `Rua: ${alerta.id_rua}`,

            vibrate: [200,100,200],

            tag: "novo-alerta",

            data: {
               url:
               `/dashboard/lapa1`
            }

         }

      );

   });

}

   

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado")
    );
    
    window.addEventListener("load", () => {
        setTimeout(() => {
        alert("Para receber alertas sonoros, clique em OK para habilitar o som.");
        document.getElementById("btnAtivarSom").click()
        }, 2000);
    });


    const btnAtivarSom = document.getElementById("btnAtivarSom")

    if(btnAtivarSom){

      btnAtivarSom.addEventListener("click", () => {

          somGlobalHabilitado = true;

          alertaSom.play().catch(err => {
              //console.warn("Som bloqueado");
          });

          alert("Som liberado!");

      })

    }

    
    const CHANNEL_NAME = "kallimage_rua1";
    const rua = "atendente"; // Aqui você pode dinamizar com parâmetro p=rua1

    const listaRuas = []

    async function carregarRua(){

      const slug = window.location.pathname.split('/').pop()

      console.log("slug", slug)

      const { data, error } = await supabaseGet
          .from('ruas')
          .select('*')
          .eq('conjunto', slug)
          .eq('status', 'ATIVO')

      //console.log("ruas", data)

      if(error){
      console.log(error)
          return
      }

      const cardsColumn = document.getElementById("cardsColumn")

      cardsColumn.innerHTML = ""

      data.forEach((rua, index) => {

         listaRuas.push(rua.slug)

          cardsColumn.innerHTML += `

            <div class="card-row">

                <div 
                  id="${rua.slug}" 
                  class="card"
                >
                  ${rua.nome}
                </div>

                <button 
                  class="mute-btn" 
                  onclick="toggleMute('${rua.slug}')"
                >
                  🔊
                </button>

                <div 
                  id="status-${rua.slug}" 
                  class="status status-hidden"
                >
                </div>

            </div>

          `

      })

      //console.log("Lista ruas", listaRuas)

    }

  carregarRua()



    const alertaSom  = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

    // DEBUG helper
    function dbg(...args){ console.log("[PRESENCE]", ...args); }

    dbg("perfil local:");

    const usuarioAtual = {
      id: rua,
      nome: rua,
      email: usuario.email,
      online: true,
      perfil: "atendente"
    };

    console.log("usuarioAtual", usuarioAtual)

    // cria o canal (nome da sala)
    const canalChat = supabaseGet.channel(CHANNEL_NAME, {
      config: {
        presence: { key: usuarioAtual.id.toString() }
      }
    });

    // listener de sync (quando o estado muda)
    canalChat.on("presence", { event: "sync" }, () => {
      try {
        const estado = canalChat.presenceState();
        const online = Object.values(estado).flat();
        dbg("Estado presence:", estado);
        dbg("Array online:", online);
        //console.log("online", online)
        // vamos mostrar todos os usuarios menos o usuarios atual
        //var conectados = online.filter(c => c.id !== usuarioGet.id);
        atualizarListaOnline(online); // sua função de UI
      } catch (e) {
        console.error("Erro lendo presenceState:", e);
      }
    });

    // subscribe e track (IMPORTANTE: usar canalChat.track, não canal.track)
    canalChat.subscribe(async (status) => {
      dbg("subscribe status:", status);
      if (status === "SUBSCRIBED") {
        try {
          // track retorna uma promise; aguarde para ter certeza que foi enviado
          await canalChat.track(usuarioAtual);
          dbg("Track enviado:", usuarioAtual);
        } catch (err) {
          console.error("Erro no track():", err);
        }
      } else {
        // pode exibir outros status para debug: "ERROR", "TIMED_OUT", etc.
        dbg("subscribe non-subscribed status:", status);
      }
    });

    function atualizarListaOnline(lista) {

      // vamos desabilitar todos os alertas
      const todosCards = document.querySelectorAll(".card");
      //console.log(todosCards)
      todosCards.forEach(c => c.classList.remove("alerta"));

      // vamos desabilitar todos os alertas
      const todosStatus = document.querySelectorAll(".status");

      todosStatus.forEach(c => c.classList.add("status-hidden"));

      // vamos remover todas as opções de texto....

      // Marca cada rua ativa
      const idsOnline = lista
        .filter(u => u.id !== "atendente")
        .map(u => u.id);

        console.log("IDs online:", idsOnline)
        console.log("idsEmSala:", idsEmSala)

        // se o ID com sala aberta não estiver na lista de abertos, vamos fechar a sala

        if (!idsOnline.some(id => idsEmSala.includes(id))) {
            // Nenhum ID online está em idsEmSala
            console.log("Ninguém da lista online está em sala!");
            document.getElementById("jaas-container").innerHTML = "";
            document.getElementById('previewWrap').style.display = 'none'
        }

      // Para cada card, decide se toca som
      listaRuas.forEach(ruaId => {
        const ativo = idsOnline.includes(ruaId);

        if (ativo) {
          document.getElementById(ruaId).classList.add("alerta");
        }

        tocarAlertaDaRua(ruaId, ativo);
      });
    }




    let somGlobalHabilitado = false;

    // Tocar 1x quando o atendente permitir som
    function ativarSomGlobal() {
      alertaSom.play().catch(()=>{});
      somGlobalHabilitado = true;
      alert("Som ativado!");
    }

    // Intervalo repetido por rua
    const intervalosPorRua = {};

    // Status de mutado por rua
    const mutado = {
      rua1: false,
      rua2: false,
      rua3: false,
      rua4: false,
      rua5: false,
    };

    // Botão de mutar
    function toggleMute(ruaId) {
      mutado[ruaId] = !mutado[ruaId];

      const btn = document.querySelector(`button[onclick="toggleMute('${ruaId}')"]`);
      btn.classList.toggle("muted", mutado[ruaId]);
      btn.innerText = mutado[ruaId] ? "🔇" : "🔊";
    }


    function tocarAlertaDaRua(ruaId, ativo) {

      if (!somGlobalHabilitado) return;

      if (ativo) {

        // já existe intervalo? Não cria outro.
        if (intervalosPorRua[ruaId]) return;

        //console.log(`Iniciando alerta para ${ruaId}`);

        // toca imediatamente
        alertaSom.play().catch(()=>{});

        // repete a cada 10s
        intervalosPorRua[ruaId] = setInterval(() => {

          if (!mutado[ruaId] && somGlobalHabilitado) {
            console.log(`Tocando novamente para ${ruaId}`);
            alertaSom.play().catch(()=>{});
          }
          
        }, 5000);

      } else {
        // parar som
        if (intervalosPorRua[ruaId]) {

            const divStatus = document.getElementById("status-" + ruaId);

            const idMensagem = divStatus.dataset.idMensagem;

          abrirFormularioAtendimento(idMensagem, ruaId);
          console.log(`Parando alerta para ${ruaId}`);
          clearInterval(intervalosPorRua[ruaId]);
          delete intervalosPorRua[ruaId];
        }
      }
    }


    // vamos informar o atendente o que o usuario esta fazendo...

    let conversasAbertas = []; // { conversaId, targetId, targetNome, elWindow }
    let conversasRecentes = []; // carregado do supabase
    let usuariosOnline = []; // array formatado [{id,nome,perfil,online}]

    const canal = supabaseGet
    .channel("mensagens_realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mensagens_alertas",
      },
      (payload) => {
        const msg = payload.new;

        console.log("Nova mensagem recebida:", msg);

        const ruaId = msg.id_rua
        const tipo_servico = msg.tipo_servico

        let statusTexto = ""
        let idMensagem = msg.id
      


        if(tipo_servico == "btnVideo"){

          statusTexto = "CHAMADA POR VÍDEO"

          // se for chamada por vídeo, vamos abrir a tela para o atendente

          abrirChamadaDeVideo(ruaId)

        } else if(tipo_servico == "btnPhone"){

          statusTexto = "LIGAÇÃO TELEFONE"

        } else if(tipo_servico == "btnWhats"){

          statusTexto = "CONTATO POR WHATS APP"

        }

        atualizarStatus(ruaId, statusTexto, idMensagem)

      }
    )
    .subscribe();

    function atualizarStatus(
      ruaId,
      statusTexto,
      idMensagem
    ){

      const divStatus =
      document.getElementById("status-" + ruaId);

      if (!divStatus) return;

      // salva o id da mensagem
      divStatus.dataset.idMensagem = idMensagem;

      if (!statusTexto || statusTexto.trim() === "") {

          // oculta o status
          divStatus.textContent = "";

          divStatus.classList.add("status-hidden");

      } else {

          // exibe o status
          divStatus.textContent = statusTexto;

          divStatus.classList.remove("status-hidden");

      }

    }

    // todos ids em alerta atual
    const idsEmSala = []

    function abrirChamadaDeVideo(ruaId){

      idsEmSala.push(ruaId)

      document.getElementById("jaas-container").innerHTML = "";
      document.getElementById('previewWrap').style.display = 'block'

      const api = new JitsiMeetExternalAPI("8x8.vc", {
              roomName: "vpaas-magic-cookie-99e1f2c24e7b4ec9a7a157ab0126c6b8/" + ruaId,
              parentNode: document.querySelector('#jaas-container'),
              interfaceConfigOverwrite: {},
              configOverwrite: {},
              iframeConfigOverwrite: {
                allow: "camera; microphone; display-capture"
              },  
              userInfo: {
                displayName: "atendente"
              }
							// Make sure to include a JWT if you intend to record,
							// make outbound calls or use any other premium features!
							// jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtOTllMWYyYzI0ZTdiNGVjOWE3YTE1N2FiMDEyNmM2YjgvZTk1ZGY0LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NjM1Njg4NDMsImV4cCI6MTc2MzU3NjA0MywibmJmIjoxNzYzNTY4ODM4LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtOTllMWYyYzI0ZTdiNGVjOWE3YTE1N2FiMDEyNmM2YjgiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDExMTQ4MjUyNjYyMjAxOTA5ODc1NiIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.PA_5Q6eDb64JsjgIdx17rFtyJ3wE5PK4X7tY3FXJ6sqwQJ60LI_g_NH-7LLyJCfGisNe8g3ZXfZ4Hl_9FZ0-3-zpZccliX1cq2a_XPZUi0un2joZDfT-qzQak4lswydxlVpjevCzMBo7tNBXmenai3puWwTNk0AjdbMXsHK1DGcbfaXbqLnKldvLrr3610gpiRcnWcir8g76LaworZ-0E_cRQBJBUc47VkU-QYK0YTbdfQf2-9DkO9tDajt_SLN66P4GBe_bi4NDAEOiv8uTfnym0iR9lQUPMczjeUWuneroCH4HKvZlJc3kKM5s0JUMfbPajnck6yf95xZq6FWiZw"
            });

          api.addEventListener('videoConferenceLeft', () => {
            console.log("Call finalizada");

            // atualizar supabase
            supabaseGet
              .from("mensagens_alertas")
              .insert({ tipo_servico: "VIDEO_FINALIZADO" });

            // limpar tela
            document.getElementById("jaas-container").innerHTML = "";
            document.getElementById("previewWrap").style.display = "none"

            // message
            alert("Chamada finalizada!");
          });  

          api.addListener("participantLeft", async () => {
            const participants = await api.getParticipantsInfo();

            if (participants.length === 1) {
              console.log("Agora só tem você, atendente encerrou.");
              // Execute sua lógica
            }
          });

          // Detecta quando um participante sai
          api.addListener("participantLeft", (event) => {
            console.log("Alguém saiu:", event);

            // aqui você faz o que quiser:
            // atualizar Supabase, fechar preview, mostrar alerta etc.
          });


        
          
    }

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

    async function logout(){

      await supabaseGet.auth.signOut();

      window.location.href = "/login";

    }

    let alertaAtual = null;

    // abre modal
    function abrirFormularioAtendimento(idMensagem, idRua){

      alertaAtual = { idAlerta: idMensagem, idRua: idRua };

      document
          .getElementById("modalAtendimento")
          .classList.add("active");

    }

    // fecha modal
    function fecharModalAtendimento(){

      document
          .getElementById("modalAtendimento")
          .classList.remove("active");

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

    async function pedirPermissaoNotificacao(){

      const permissao =
      await Notification.requestPermission();

      console.log(permissao);

      if(permissao === "granted"){

          alert("Notificações ativadas!");

      }

    }

    function notificacaoTeste(){

        if(Notification.permission !== "granted"){

            alert("Permissão negada");

            return;

        }

        navigator.serviceWorker.ready.then(registration => {

            registration.showNotification(
              "🚨 Novo Alerta",
              {
                  body: "Rua Central acionou atendimento.",
                  icon: "/icon.png",
                  badge: "/icon.png",

                  vibrate: [200, 100, 200],

                  data: {
                    url: "/dashboard/lapa1"
                  }

              }
            );

        });

    }


    let recorder;
    let chunks = [];

    document.getElementById("btnGravar").addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true    // captura áudio da aba + do jitsi
        });

        recorder = new MediaRecorder(stream);

        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "gravacao.webm";
          a.click();

          chunks = [];
        };

        recorder.start();

        document.getElementById("btnGravar").style.display = "none";
        document.getElementById("btnParar").style.display = "inline-block";

      } catch (err) {
        console.error("Erro ao iniciar gravação:", err);
      }
    });

    document.getElementById("btnParar").addEventListener("click", () => {
      recorder.stop();
      
      document.getElementById("btnGravar").style.display = "inline-block";
      document.getElementById("btnParar").style.display = "none";
    });


    


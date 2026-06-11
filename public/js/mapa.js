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

   let idsOnline = [];

   async function iniciarSistema() {

   await carregarRua();
   iniciarRealtimeMensagens()
   console.log("Ruas carregadas, iniciando canal de mensagens...")

   criarCanal()
   }

   iniciarSistema();


   window.addEventListener("load", () => {
        setTimeout(() => {
        alert("Para receber alertas sonoros, clique em OK para habilitar o som.");
        document.getElementById("btnAtivarSom").click()
        }, 2000);
    });


   const CHANNEL_NAME = "kallimage_rua1";
   const rua = "atendente"; // Aqui você pode dinamizar com parâmetro p=rua1
   const markersRuas = {};

   const listaRuas = []

    const map = L.map('map').setView(
    [-23.55052, -46.633308],
    12
    )

    L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
    ).addTo(map)

    // Status de mutado por rua
    const mutado = {};

    async function carregarRua(){

   const slug = window.location.pathname.split('/').pop()

   console.log("Slug do conjunto:", slug)

   const { data, error } = await supabaseGet
      .from('ruas')
      .select('*')
      .eq('conjunto', slug)
      .eq('status', 'ATIVO')

   if(error){
      console.log(error)
      return
   }

   for(const rua of data){

      listaRuas.push(rua.slug)

      // buscar as mensagens ativas para a rua

      const mensagensAtivas = await buscarMensagem(rua.slug);

      criarPopupAlerta(rua.slug);

      mutado[rua.slug] = false; // inicia como não mutado
      
      console.log(
         rua.nome,
         rua.lat,
         rua.long
      )

      // verifica se tem coordenadas
      if(!rua.lat || !rua.long){
         return
      }

      // converte pra número
      const lat = parseFloat(rua.lat)
      const lng = parseFloat(rua.long)

      console.log(lat, lng)

      // cria marcador
      const marker = L.marker([
         lat,
         lng
      ],
         {
            icon: criarIcone(
               "#16a34a",
               "12",
               rua,
               mensagensAtivas
            )
         }
      ).addTo(map)

      markersRuas[rua.slug] = marker;


      // conteúdo popup
      marker.bindPopup(`

         <div class="popup-alerta">

            <div onclick="ativarPopupAlerta('${rua.slug}')" id="popupHeader-${rua.slug}" class="popup-header popup-header-hidden">
               🚨 ALERTA ATIVO
            </div>

            <div class="popup-info">

               <p>
                     <strong>Rua:</strong><br>
                     ${rua.nome}
               </p>

            </div>

            <div class="popup-actions">

            <!--   <button
                     onclick="abrirVideo('${rua.slug}')"
                     class="btn-video"
               >
                     📹 Vídeo
               </button>

               <button
                     onclick="ligar('${rua.slug}')"
                     class="btn-phone"
               >
                     📞 Ligar
               </button>

               <button
                     onclick="abrirWhatsapp('${rua.slug}')"
                     class="btn-whats"
               >
                     💬 WhatsApp
               </button> -->

               <button
                     onclick="abrirCamera('${rua.slug}')"
                     class="btn-camera"
               >
                     📷 Câmeras
               </button>

            </div>

         </div>

         `);

         marker.on("popupopen", () => {

            const ativo =
               idsOnline.includes(rua.slug);

            document
               .getElementById(
                  `popupHeader-${rua.slug}`
               )
               ?.classList.toggle(
                  "popup-header-hidden",
                  !ativo
               );

         });

   }

  

}



function criarCanal(){

   console.log("Criando canal de mensagens...")

// vamos criar um canal para ouvir a tabela de mensagens, para mostrar na tela...
const channelMensagens = supabaseGet
  .channel('atualizacao_mensagens')

  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'mensagens'
    },

    async (payload) => {

      console.log("atualizacao_mensagens", payload)

      const novaMensagem = payload.new;

      const mensagensAtivas = await buscarMensagem(novaMensagem.rua_slug);

      const marker =
         markersRuas[
            novaMensagem.rua_slug
         ];

         marker.setIcon(

            criarIcone("#16a34a",
               "12",
               {nome:novaMensagem.rua_nome}, 
               mensagensAtivas)

         );       

    }

  )

  .subscribe();

}

function centralizarTodasRuas(){

   const bounds = [];

   Object.values(markersRuas).forEach(marker => {

      bounds.push([
         marker.getLatLng().lat,
         marker.getLatLng().lng
      ]);

   });

   if(bounds.length === 0){
      return;
   }

   if(bounds.length === 1){

      map.setView(
         bounds[0],
         17
      );

   }else{

      map.fitBounds(
         bounds,
         {
            padding:[50,50]
         }
      );

   }

}




 async function buscarMensagem(slug){

   // busca mensagens ativas para a rua

   const { data, error } = await supabaseGet
      .from('mensagens')
      .select('*')
      .eq('rua_slug', slug)
      .eq('status', 'ABERTO')

    if(error){
         console.log(error)
         return
      }

      console.log("Mensgens Rua", slug, data)

      return data;

}

// vamos informar o atendente o que o usuario esta fazendo...

    let conversasAbertas = []; // { conversaId, targetId, targetNome, elWindow }
    let conversasRecentes = []; // carregado do supabase
    let usuariosOnline = []; // array formatado [{id,nome,perfil,online}]

    function iniciarRealtimeMensagens(){

    const canal = supabaseGet
    .channel("mensagens_realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mensagens_alertas",
      },
      (payload) => {
        const msg = payload.new;

        console.log("Nova mensagem recebida:", msg);

        const ruaId = msg.id_rua
        const tipo_servico = msg.tipo_servico
        const status = msg.status
        const distancia = msg.distancia
        const sistema = msg.dispositivo.match(/\(([^)]+)\)/)?.[1];

        let statusTexto = ""
        let idMensagem = msg.id
      
        if(tipo_servico == "btnVideo" && status == "ABERTURA"){

          statusTexto = "CHAMADA POR VÍDEO"

          // se for chamada por vídeo, vamos abrir a tela para o atendente

          abrirChamadaDeVideo(ruaId)

        } else if(tipo_servico == "btnPhone" && status == "ABERTURA"){

          statusTexto = "LIGAÇÃO TELEFONE"

        } else if(tipo_servico == "btnWhats" && status == "ABERTURA"){

          statusTexto = "CONTATO POR WHATS APP"

        }

        atualizarStatus(ruaId, statusTexto, idMensagem, distancia, sistema, status)

      }
    )
    .subscribe();

// DEBUG helper
    function dbg(...args){ console.log("[PRESENCE]", ...args); }

    dbg("perfil local:");

   const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado")
    );

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

   }

    const idsEmSala = []

    function atualizarListaOnline(lista) {

      // vamos desabilitar todos os alertas
      const todosCards = document.querySelectorAll(".pin-rua");
      console.log(todosCards)
      todosCards.forEach(c => c.classList.remove("marker-alerta"));

      // vamos desabilitar todos os alertas
      /*const todosStatus = document.querySelectorAll(".status");

      todosStatus.forEach(c => c.classList.add("status-hidden"));*/

      // vamos remover todas as opções de texto....

      // Marca cada rua ativa
       idsOnline = lista
        .filter(u => u.id !== "atendente")
        .map(u => u.id);

        console.log("IDs online:", idsOnline)
        console.log("idsEmSala:", idsEmSala)

        // se o ID com sala aberta não estiver na lista de abertos, vamos fechar a sala

        if (!idsOnline.some(id => idsEmSala.includes(id))) {
            // Nenhum ID online está em idsEmSala
            console.log("Ninguém da lista online está em sala!");
            //document.getElementById("jaas-container").innerHTML = "";
            //document.getElementById('previewWrap').style.display = 'none'
        }

      // Para cada card, decide se toca som

      const markersAtivos = [];

      listaRuas.forEach(ruaId => {
        const ativo = idsOnline.includes(ruaId);

        console.log("Atualizando rua", ruaId, "ativo?", ativo)

        if (ativo) {

           ativarPopupAlerta(ruaId);

            document
            .getElementById('marker-' + ruaId).classList.add("marker-alerta");

         
            // pega marker leaflet
            const marker =
            markersRuas[ruaId];

            if(marker){

               //marker.openPopup();

               map.setView(
                  marker.getLatLng(),
                  18
               );

            }

            markersAtivos.push(marker);

         } else {
            // desativa alerta

            const divStatus = document.getElementById("status-" + ruaId);

            console.log("teste2",  document.getElementById('status-' + ruaId), ruaId)

            document.getElementById('marker-' + ruaId).classList.remove("marker-alerta");

            console.log("Parando alerta da rua", ruaId, "com status", divStatus);

            const idMensagem = divStatus.dataset.idMensagem;

            if(idMensagem){

                abrirFormularioAtendimento(idMensagem, ruaId);

            }

            fecharPopupAlerta(ruaId)

         }

         // se existir alertas
      if(markersAtivos.length > 0){

         // apenas 1
         if(markersAtivos.length == 1){

            map.setView(
               markersAtivos[0].getLatLng(),
               18
            );

         }

         // vários
         else {

            const group =
            L.featureGroup(markersAtivos);

            map.fitBounds(
               group.getBounds(),
               {
                  padding:[80,80]
               }
            );

         }

      }

        tocarAlertaDaRua(ruaId, ativo);
      });

      if(idsOnline.length === 0){
         centralizarTodasRuas();
      }
    }

    function fecharVideo(){

      videoWindow.style.display = "none";

   }

   function minimizarVideo(){

      const body = videoWindow.querySelector(".video-body");

      if(body.style.display == "none"){

         body.style.display = "block";
         videoWindow.style.height = "350px";

      } else {

         body.style.display = "none";
         videoWindow.style.height = "50px";

      }

      }

    function abrirChamadaDeVideo(ruaId){

      idsEmSala.push(ruaId)

      videoWindow.style.display = "block";

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

    function atualizarStatus(
      ruaId,
      statusTexto,
      idMensagem,
      distancia,
      sistema,
      status
    ){

      console.log("Atualizando status da rua", ruaId, "para", statusTexto, "com idMensagem", idMensagem)



      const divStatus =
      document.getElementById("status-" + ruaId);

      const infoSistema = document.getElementById("info-sistema-" + ruaId);

      if (!divStatus) return;

      // salva o id da mensagem
      divStatus.dataset.idMensagem = idMensagem;

      if (!statusTexto || statusTexto.trim() === "") {

          // oculta o status
          divStatus.textContent = "";
          infoSistema.textContent = "";

          divStatus.classList.add("status-hidden");

      } else {

          // exibe o status
          divStatus.textContent = "ID: " + idMensagem + " - " + statusTexto
          infoSistema.textContent = "Dispositivo: " + sistema + " - Distancia: " + parseFloat(distancia).toFixed(0) + " metros"; 

          divStatus.classList.remove("status-hidden");

      }

      if(status == "ENCERRADO"){
          fecharVideo()
         alert("Atendimento encerrado para a rua " + ruaId)
      }

    }

   // ativar pop alert
  
   function ativarPopupAlerta(ruaId){
      document.getElementById("popup-" + ruaId).classList.remove("alert-display-none");
   }

   function fecharPopupAlerta(ruaId){
      document.getElementById("popup-" + ruaId).classList.add("alert-display-none");
      const statusTexto = "";
      const idMensagem = "";
      atualizarStatus(ruaId, statusTexto, idMensagem)
   }

// =========================
// CRIAR POPUP ALERTA
// =========================

function criarPopupAlerta(ruaId){

   const container =
   document.getElementById(
      "alertsContainer"
   );

   // evita duplicar popup
   if(
      document.getElementById(
         "popup-" + ruaId
      )
   ){
      return;
   }

   const hora =
   new Date()
   .toLocaleTimeString(
      "pt-BR"
   );

   container.innerHTML += `

      <div 
         id="popup-${ruaId}"
         class="alert-popup alertando alert-display-none"
      >

         <div class="alert-header">

            <div class="alert-title">
               🚨 ALERTA ATIVO
            </div>

            <button 
               class="mute-btn" 
               onclick="abrirImagens('${rua.slug}')"
               >
             Acessos
            </button>

            <button 
               class="mute-btn" 
               onclick="toggleMute('${rua.slug}')"
               >
            🔊
            </button>

         </div>

         <div class="alert-body">

           <div>

            <div class="alert-rua">
               ${ruaId}
            </div>

            <div class="alert-info">

               Novo atendimento solicitado.

            </div>

          </div>  

         <div>

            <button
               class="btn-alerta btn-close-alert"
               onclick="fecharPopupAlerta('${ruaId}')"
            >
               ✖
            </button>

         </div>

         </div>

         <div id="status-${ruaId}"  class="status status-hidden">

           <!-- <button
               class="btn-alerta btn-video"
            >
               📹 Vídeo
            </button>

            <button
               class="btn-alerta btn-phone"
            >
               📞 Telefone
            </button> -->

         </div>
         <div id="info-sistema-${ruaId}" >
         </div>

          

      </div>

   `;

}

 // Botão de mutar
    function toggleMute(ruaId) {
      mutado[ruaId] = !mutado[ruaId];

      const btn = document.querySelector(`button[onclick="toggleMute('${ruaId}')"]`);
      btn.classList.toggle("muted", mutado[ruaId]);
      btn.innerText = mutado[ruaId] ? "🔇" : "🔊";
    }

    function abrirImagens(ruaSlug){

       const body =
      document.getElementById("cameraBody");

       body.innerHTML = `
         <iframe src="http://192.168.15.55/ISAPI/Streaming/Channels/101/httpPreview" >Click!
           
         </iframe>
      `;

      /*body.innerHTML = `
         <video controls>
            <source src="rtsp://admin:Kallimage1@192.168.15.55:554/Streaming/Channels/101" type="video/webm">
         </video>
      `;*/

      cameraWindow.style.display = "block";

    }

    function fecharCamera(){

      cameraWindow.style.display = "none";

    }

    const cameraWindow =
document.getElementById("cameraWindow");

const cameraHeader =
document.getElementById("cameraHeader");

let dragging = false;

let offsetX = 0;
let offsetY = 0;

cameraHeader.addEventListener("mousedown", (e) => {

  dragging = true;

  offsetX = e.clientX - cameraWindow.offsetLeft;
  offsetY = e.clientY - cameraWindow.offsetTop;

});

document.addEventListener("mousemove", (e) => {

  if(!dragging) return;

  cameraWindow.style.left =
    (e.clientX - offsetX) + "px";

  cameraWindow.style.top =
    (e.clientY - offsetY) + "px";

});

document.addEventListener("mouseup", () => {

  dragging = false;

});



// abre modal
    function abrirFormularioAtendimento(idMensagem, idRua){

      console.log("Abrindo formulário de atendimento para", idMensagem, idRua)

      alertaAtual = { idAlerta: idMensagem, idRua: idRua };

      if(idMensagem){

         document.getElementById("texto-registro").textContent = "Registro de Atendimento - ID: " + idMensagem;

          document
          .getElementById("modalAtendimento")
          .classList.add("active");

      }

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


    function ativarAlertaMarker(marker, rua){

      // adiciona animação
      marker._icon.classList.add(
         "marker-alerta"
      );

      // conteúdo popup
      marker.bindPopup(`

         <div class="popup-alerta">

            <div class="popup-header">
               🚨 ALERTA ATIVO
            </div>

            <div class="popup-info">

               <p>
                     <strong>Rua:</strong><br>
                     ${rua.nome}
               </p>

            </div>

            <div class="popup-actions">

               <button
                     onclick="abrirVideo('${rua.slug}')"
                     class="btn-video"
               >
                     📹 Vídeo
               </button>

               <button
                     onclick="ligar('${rua.slug}')"
                     class="btn-phone"
               >
                     📞 Ligar
               </button>

               <button
                     onclick="abrirWhatsapp('${rua.slug}')"
                     class="btn-whats"
               >
                     💬 WhatsApp
               </button>

               <button
                     onclick="abrirCamera('${rua.slug}')"
                     class="btn-camera"
               >
                     📷 Câmeras
               </button>

            </div>

         </div>

         `);

      // centraliza mapa
      map.setView(
         marker.getLatLng(),
         18
      );

      // abre popup
      marker.openPopup();

   }

    let somGlobalHabilitado = false;
        // Intervalo repetido por rua
    const intervalosPorRua = {};

    const alertaSom  = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

    function tocarAlertaDaRua(ruaId, ativo) {

      console.log(`tocarAlertaDaRua: ruaId=${ruaId}, ativo=${ativo}`)

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
         console.log(`Parando alerta para ${ruaId}`);
        // parar som
        if (intervalosPorRua[ruaId]) {

           // const divStatus = document.getElementById("status-" + ruaId);

            //console.log("Parando alerta da rua", ruaId, "com status", divStatus);

           // const idMensagem = divStatus.dataset.idMensagem;

          //abrirFormularioAtendimento(idMensagem, ruaId);
          console.log(`Parando alerta para ${ruaId}`);
          clearInterval(intervalosPorRua[ruaId]);
          delete intervalosPorRua[ruaId];
        }
      }
    }



function criarIcone(cor, texto, rua, mensagensAtivas){

   const totalMensagens =
   mensagensAtivas.length;

   console.log("Criando ícone para", rua.nome, "com", totalMensagens, "mensagens ativas");

   return L.divIcon({

      className: "custom-pin-wrapper",

      iconAnchor: [15, 42],

      popupAnchor: [0, -40],

      html: `

      <div
         style="
            position:relative;
         "

         id="marker-${rua.slug}"
      >

         ${
            totalMensagens > 0
            ?
            `
               <div title='${totalMensagens} mensagens ATIVAS' class="marker-badge">

                  ${totalMensagens}

               </div>
            `
            :
            ""
         }

         <div
         id="marker-${rua.slug}"
         class="custom-pin pin-rua"
         style="
            background:${cor};
         "
      >

         ${abreviarRua(rua.nome)}

      </div>

   </div>

`
   })

}

function abreviarRua(nome){
   // numero da rua
   const numero = nome.match(/\d+/)?.[0] || "";
   //primeira letra do nome
   const letraNome2 = nome.split(" ")[1]?.[0] || "";

   const textoPin = nome[0].toUpperCase() + letraNome2.toUpperCase() + numero;

   return textoPin    

}

const videoWindow = document.getElementById("videoWindow");
const videoHeader = document.getElementById("videoHeader");

let isDragging = false;

let offsetX2 = 0;
let offsetY2 = 0;

videoHeader.addEventListener("mousedown", (e) => {

  isDragging = true;

  offsetX2 = e.clientX - videoWindow.offsetLeft;
  offsetY2 = e.clientY - videoWindow.offsetTop;

});

document.addEventListener("mousemove", (e) => {

  if(!isDragging) return;

  videoWindow.style.left = (e.clientX - offsetX2) + "px";
  videoWindow.style.top = (e.clientY - offsetY2) + "px";

});

document.addEventListener("mouseup", () => {

  isDragging = false;

});


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

       //navigator.mediaDevices.getDisplayMedia()

   let mediaRecorder;
   let chunks = [];

async function btnGravarTela() {

      console.log("Solicitando permissão para gravar a tela...");

  try {

    const stream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

    chunks = [];

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {

      if (e.data.size > 0) {
        chunks.push(e.data);
      }

    };

    mediaRecorder.onstop = () => {

      const blob = new Blob(chunks, {
        type: "video/webm"
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download =
        `gravacao_${Date.now()}.webm`;

      a.click();

      URL.revokeObjectURL(url);

    };

    mediaRecorder.start();

    console.log("Gravação iniciada");

  } catch (erro) {

    console.error(erro);

  }

}

  const rua = window.location.pathname.split('/').pop()

  console.log("rua", rua)

  window.onload = function() {


    // === CONFIGURAÇÕES ===
    var VIDEO_MEETING_URL = 'https://meet.jit.si/' + rua;
    var PHONE_NUMBER = '08007700051';
    var EXTENSION = '1';

    // 1️⃣ Mapa de ruas detalhado
    var mapaRuas = {
      "veriano-pereira63": { telefone: "+551123657643", endereco: "Rua: Veriano Pereira, Nº 63, Vila Saúde" },
      "avenida-paulista": { telefone: "5511988888888", endereco: "Av. Paulista, Nº 1000, Bela Vista" },
      "rua-das-flores": { telefone: "5511977777777", endereco: "Rua das Flores, Nº 300, Jardim Primavera" }
    };

    // 2️⃣ Identificar local pela URL
    function obterIdentificadorDaURL() {
      var params = new URLSearchParams(window.location.search);
      var paramLocal = params.get("local");
      var hash = window.location.hash.replace("#", "");
      return paramLocal || hash || "rua-santos";
    }

    var identificador = obterIdentificadorDaURL();
    var dados = mapaRuas[identificador];

    // 3️⃣ Dados do WhatsApp
    var WHATS_NUMBER = (dados && dados.telefone) ? dados.telefone : "5511951694600";
    var enderecoMsg = (dados && dados.endereco) ? dados.endereco : "local não identificado";
    var WHATS_MESSAGE = encodeURIComponent(
      "Olá! Preciso de ajuda aqui em " + enderecoMsg + " (ID: " + identificador + ")."
    );

    // 4️⃣ Referências
    var btnVideo = document.getElementById('btnVideo');
    var btnPhone = document.getElementById('btnPhone');
    var btnWhats = document.getElementById('btnWhats');
    var previewWrap = document.getElementById('previewWrap');
    var localVideo = document.getElementById('localVideo');

    // 5️⃣ Funções auxiliares
    function buildTelWithExtension(number, extension, pauseCount) {
      if (!pauseCount) pauseCount = 3;
      var pauses = Array(pauseCount + 1).join(',');
      return 'tel:' + number + pauses + extension;
    }

    // 6️⃣ Eventos dos botões
    btnVideo.addEventListener('click', function() {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function(stream) {
          //localVideo.srcObject = stream;
          previewWrap.style.display = 'block';
        })
        .catch(function() {
          alert('Não foi possível acessar a câmera. Verifique permissões.');
        });
      enviarMensagem("btnVideo")
      //window.open(VIDEO_MEETING_URL, '_blank');
    });

    btnPhone.addEventListener('click', function() {
      enviarMensagem("btnPhone")
      var tel = buildTelWithExtension(PHONE_NUMBER, EXTENSION);
      window.location.href = tel;
    });

    btnWhats.addEventListener('click', function() {
      enviarMensagem("btnWhats")
      var url = "https://wa.me/" + WHATS_NUMBER + "?text=" + WHATS_MESSAGE;
      window.open(url, '_blank');
    });

  };



    const CHANNEL_NAME = "kallimage_rua1";
    

    // DEBUG helper
    function dbg(...args){ console.log("[PRESENCE]", ...args); }

    dbg("perfil local:");

    const usuarioAtual = {
      id: rua,
      nome: rua,
      email: "email",
      online: true,
      perfil: "Cliente"
    };

    // cria o canal (nome da sala)
    const canalChat = supabaseGet.channel(CHANNEL_NAME, {
      config: {
        presence: { key: usuarioAtual.id.toString() }
      }
    });

    console.log("canalChat", canalChat)

    // listener de sync (quando o estado muda)
    canalChat.on("presence", { event: "sync" }, () => {
      try {
        console.log("canalChat", canalChat)
        const estado = canalChat.presenceState();
        const online = Object.values(estado).flat();
        dbg("Estado presence:", estado);
        dbg("Array online:", online);
        console.log("online", online)
        // vamos mostrar todos os usuarios menos o usuarios atual
        //var conectados = online.filter(c => c.id !== usuarioGet.id);
        atualizarListaOnline(online); // sua função de UI
      } catch (e) {
        console.error("Erro lendo presenceState:", e);
      }
    });

      console.log("canalChat", canalChat)

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


    const statusDiv = document.getElementById("statusAtendente");

    function setOnline() {
      statusDiv.textContent = "Atendente Online";
      statusDiv.style.background = "#28a745";
    }

    function setOffline() {
      statusDiv.textContent = "Nenhum atendente disponível";
      statusDiv.style.background = "#adb5bd";
    }

    // Estado inicial
    setOffline();

    let emailAtendente = ""
    

    function atualizarListaOnline(lista){

      console.log("Lista online:", lista)

      // verificar atendentes online
      const onlineAtendente = lista.filter(c => c.id == 'atendente');

      console.log("Online atendente", onlineAtendente)

      if(onlineAtendente.length > 0){

        emailAtendente = onlineAtendente[0].email || ""
        
        setOnline()

      } else {

        setOffline();

      }

    }


    // envio de mensagens ao clicar os botoes

    // tabela que iremos salvar os eventos de clique do usuário
    const CHAT_TABLE = "mensagens_alertas";

    // quando o usuario clicar em algum dos itens, vamos enviar para o atendente....

      async function enviarMensagem(btnID){

        const dispositivoTipo = navigator.userAgent;
        const conexaoTipo = navigator.connection;

        const marcaCelular =  detectarMarca(navigator.userAgent)

        console.log("Marca dispositivo", marcaCelular)

      //  const input = document.getElementById(`cw_input_${targetId}`);
      //  const idAnexo = document.getElementById(`file_${targetId}`).dataset.idAnexo;

        console.log("enviar mensagem", btnID)

        // inserir no supabase
        try {
          const { data, error } = await supabaseGet
            .from("mensagens_alertas")
            .insert({
              id_rua: rua,
              tipo_servico: btnID,
              atendente : emailAtendente,
              dispositivo: dispositivoTipo,
              conexao: conexaoTipo
            });

          if (error) console.error(error);
          else console.log("OK:", data);
        } catch(e){ console.error("erro enviar", e); }

        if(btnID == "btnVideo"){
          abrirChamadaDeVideo()
        }
        
      }

      function detectarMarca(userAgent) {
        const ua = userAgent.toLowerCase();

        if (ua.includes("samsung") || ua.includes("sm-")) return "Samsung";
        if (ua.includes("motorola") || ua.includes("moto")) return "Motorola";
        if (ua.includes("xiaomi") || ua.includes("redmi") || ua.includes("miui"))
          return "Xiaomi";
        if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios"))
          return "Apple";
        if (ua.includes("huawei")) return "Huawei";
        if (ua.includes("lenovo")) return "Lenovo";

        return "Desconhecido";
      }


      function abrirChamadaDeVideo(){
        
        const api = new JitsiMeetExternalAPI("8x8.vc", {
              roomName: "vpaas-magic-cookie-99e1f2c24e7b4ec9a7a157ab0126c6b8/" + rua,
              parentNode: document.querySelector('#jaas-container'),
              userInfo: {
                displayName: rua
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

          // message
          alert("Chamada finalizada!");
        });

      }



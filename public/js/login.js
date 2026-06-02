  async function verificarLogin(){

    const sessionStorage = localStorage.getItem("usuarioLogado");

    if(!sessionStorage){

        console.log("Nenhuma sessão encontrada, redirecionando para login...");

        return;

    }

    const session = JSON.parse(sessionStorage);

    // verifica expiração
    const agora = Math.floor(Date.now() / 1000);

    if(session.expires_at < agora){

        localStorage.removeItem("usuarioLogado");

        window.location.href = "/login";;

        return;

    } else {
        
        window.location.href = "/mapa/lapa1";
        return 
        
    }

  }

   verificarLogin();

const formLogin = document.getElementById("formLogin");

formLogin.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {

    const { data, error } = await supabaseGet.auth.signInWithPassword({
      email,
      password: senha
    });

    if(error){
      alert(error.message);
      return;
    }

    const perfil = await pegarPerfilUsuario(data);

    console.log("perfil", perfil);

    if(perfil.status == "ativo"){

      // salva sessão
        localStorage.setItem("usuarioLogado", JSON.stringify({
          email: data.user.email,
          nome: data.user.user_metadata.nome || "",
          id: data.user.id,
          perfil: perfil.perfil || {},
        }));

        alert("Login realizado!");

    } else if(perfil.status == "inativo"){
      alert("Seu acesso está inativo. Por favor, entre em contato com o suporte.");
    }

      

    // redireciona
    window.location.href = "/dashboard/lapa1";

  } catch(err){
    console.log(err);
    alert("Erro ao realizar login");
  }

});


async function pegarPerfilUsuario(data){
    const { data: usuario } =
    await supabaseGet
    .from("usuarios")
    .select("*")
    .eq("id", data.user.id)
    .single();

    console.log("usuario", usuario);

    return usuario;
}
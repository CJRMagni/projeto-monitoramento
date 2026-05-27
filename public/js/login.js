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

      // salva sessão
        localStorage.setItem("usuarioLogado", JSON.stringify({
          email: data.user.email,
          nome: data.user.user_metadata.nome || "",
          id: data.user.id
        }));

    alert("Login realizado!");

    // redireciona
    window.location.href = "/dashboard/lapa1";

  } catch(err){
    console.log(err);
    alert("Erro ao realizar login");
  }

});
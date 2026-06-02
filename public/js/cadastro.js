document
.getElementById("formCadastro")
.addEventListener(
   "submit",
   cadastrarUsuario
);

async function cadastrarUsuario(e){

   e.preventDefault();

   const nome =
   document.getElementById("nome").value;

   const email =
   document.getElementById("email").value;

   const senha =
   document.getElementById("senha").value;

   const confirmarSenha =
   document.getElementById(
      "confirmarSenha"
   ).value;

   if(senha !== confirmarSenha){

      alert(
         "As senhas não conferem"
      );

      return;

   }

   const { data, error } =
   await supabaseGet.auth.signUp({

      email,
      password: senha

   });

   if(error){

      alert(error.message);

      return;

   }

   alert(
      "Cadastro realizado com sucesso!"
   );

   window.location.href =
      "/login";

}
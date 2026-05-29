const express = require('express')
const path = require('path')

const supabase = require('./src/config/supabase')

const app = express()

app.use(express.json())



console.log("AAAAAAAAAAAA INDEX CERTO")

// TESTE
app.get('/rua/:rua', (req, res) => {

   console.log("ROTA DINAMICA")

   res.send("FUNCIONOU")

})

// LOGIN
app.get('/login', (req, res) => {

   console.log("login OK")

   res.sendFile(
      path.join(__dirname, 'public', 'login.html')
   )

})

// configuracoes
app.get('/configuracoes', (req, res) => {

    console.log("configuracoes OK")

   res.sendFile(
      path.join(__dirname, 'public', 'configuracoes.html')
   )

})

// historico
app.get('/historico', (req, res) => {

    console.log("HISTORICO OK")

   res.sendFile(
      path.join(__dirname, 'public', 'historico.html')
   )

})

// mapa
app.get('/mapa/:conjunto', (req, res) => {

    console.log("MAPA OK")

   res.sendFile(
      path.join(__dirname, 'public', 'mapa.html')
   )

})



// DASHBOARD
app.get('/dashboard/:conjunto', (req, res) => {

   console.log("dashboard OK")

   res.sendFile(
      path.join(__dirname, 'public', 'dashboard.html')
   )

})

// CLIENTE
app.get('/painel-cliente/:rua', (req, res) => {

   res.sendFile(
      path.join(__dirname, 'public', 'painel-cliente.html')
   )

})

// API CLIENTES
app.get('/api/clientes', async (req, res) => {

   const { data, error } = await supabase
      .from('clientes')
      .select('*')

   if(error){
      return res.status(500).json(error)
   }

   res.json(data)

})

// FINALIZAR VIDEO
app.post('/api/finalizar-video', async (req,res)=>{

   const { data, error } = await supabase
      .from("mensagens_alertas")
      .insert({
         tipo_servico:"VIDEO_FINALIZADO"
      })

   if(error){
      return res.status(500).json(error)
   }

   res.json(data)

})

// ARQUIVOS PUBLICOS
app.use(express.static(path.join(__dirname, 'public')))

// SERVIDOR
app.listen(3000, () => {
   console.log('Servidor rodando na porta 3000')
})
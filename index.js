const express = require('express')
const path = require('path')

const supabase = require('./src/config/supabase')

const app = express()

app.use(express.json())

console.log("INDEX CERTO")

app.get('/rua/:rua', (req, res) => {

   console.log("ROTA DINAMICA")

   res.send("FUNCIONOU")

})

// =========================
// ROTAS DINÂMICAS PRIMEIRO
// =========================

// ROTA DINÂMICA
app.get('/painel-cliente/:rua', (req, res) => {

   res.sendFile(
      path.join(__dirname, 'public', 'painel-cliente.html')
   )

})

// ROTA DINÂMICA
app.get('/dashboard/:conjunto', (req, res) => {

   res.sendFile(
      path.join(__dirname, 'public', 'dashboard.html')
   )

})


// SERVIDOR
app.listen(3000, () => {
   console.log('Servidor rodando')
})

app.use(express.static(path.join(__dirname, 'public')))

// TESTE CLIENTES
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


// SERVIDOR
app.listen(3000, () => {
   console.log('Servidor rodando')
})
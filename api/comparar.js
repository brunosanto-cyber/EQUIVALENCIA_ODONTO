export default async function handler(req, res) {
  // 1. Configuração de CORS (Libera o acesso do seu GitHub Pages)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 2. Responde à requisição de pré-verificação (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Bloqueia o que não for POST
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const { operadora, modelo, plano } = req.body;

  if (!operadora || !modelo || !plano) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  // 4. Prompt Estruturado
  const promptEspecialista = `
    Você é um especialista em planos odontológicos no Brasil. 
    Sua tarefa é analisar o plano "${plano}" da operadora "${operadora}" (Modalidade: ${modelo}) 
    e compará-lo com o portfólio de planos da Unimed Odonto (ex: Essencial, Pleno, Prumo, Prático, etc).
    
    Identifique qual é o plano da Unimed Odonto que mais se aproxima ou equipara ao plano concorrente informado.
    
    Retorne a sua resposta ÚNICA E EXCLUSIVAMENTE no formato JSON abaixo, sem textos adicionais antes ou depois:
    {
      "plano_concorrente": "${plano}",
      "plano_unimed": "Nome do Plano Unimed Equivalente",
      "percentual_equiparacao": 85, 
      "coberturas_iguais": ["cobertura 1", "cobertura 2", "cobertura 3"],
      "coberturas_diferentes": ["cobertura A (Concorrente tem, Unimed não)", "cobertura B (Unimed tem, Concorrente não)"],
      "resumo_estrategico": "Breve argumento de vendas de por que a Unimed Odonto é a melhor escolha neste caso."
    }
  `;

  try {
    // 5. Chamada ao OpenRouter usando a chave com modelo gratuito e ativo
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": [
          { "role": "user", "content": promptEspecialista }
        ],
        "temperature": 0.2 
      })
    });

    const data = await response.json();

    // Captura erros retornado pelo OpenRouter
    if (data.error) {
      console.error("MOTIVO DO ERRO NO OPENROUTER:", data.error);
      return res.status(500).json({ erro: 'Bloqueio na IA: ' + data.error.message });
    }

    // 6. Tratamento de resposta
    let textoResposta = data.choices[0].message.content;
    textoResposta = textoResposta.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analiseJSON = JSON.parse(textoResposta);
    res.status(200).json(analiseJSON);

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ erro: 'Não foi possível realizar a equiparação no momento.' });
  }
}

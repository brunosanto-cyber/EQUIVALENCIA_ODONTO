export default async function handler(req, res) {
  // 1. Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const { operadora, modelo, plano } = req.body;

  if (!operadora || !modelo || !plano) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  // 4. Prompt Estruturado (Treinado com os Planos Oficiais)
  const promptEspecialista = `
    Você é um especialista em planos odontológicos no Brasil. 
    Sua tarefa é analisar o plano "${plano}" da operadora "${operadora}" (Modalidade: ${modelo}) 
    e encontrar a melhor equivalência comercial e de coberturas na Unimed Odonto.
    
    ATENÇÃO: Os ÚNICOS planos disponíveis na Unimed Odonto são estes abaixo:
    - Essencial
    - Essencial Plus
    - Essencial Plus DOC
    - Pleno
    - Pleno Plus
    - Pleno Plus DOC
    - Pleno Orto
    - Pleno Top
    - Plano Alinhador
    
    Identifique qual DESSES PLANOS ACIMA mais se aproxima ou equipara ao plano concorrente informado.
    NÃO invente nomes de planos, escolha estritamente um da lista.
    
    Retorne a sua resposta ÚNICA E EXCLUSIVAMENTE no formato JSON abaixo, sem textos adicionais antes ou depois:
    {
      "plano_concorrente": "${plano}",
      "plano_unimed": "Coloque aqui APENAS o nome de um dos planos da lista",
      "percentual_equiparacao": 85, 
      "coberturas_iguais": ["cobertura 1", "cobertura 2", "cobertura 3"],
      "coberturas_diferentes": ["cobertura A (Concorrente tem, Unimed não)", "cobertura B (Unimed tem, Concorrente não)"],
      "resumo_estrategico": "Breve argumento de vendas de por que a Unimed Odonto é a melhor escolha neste caso."
    }
  `;

  try {
    // 5. Chamada ao Roteador Gratuito Permanente do OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openrouter/free", 
        "messages": [
          { "role": "user", "content": promptEspecialista }
        ],
        "temperature": 0.2 
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("MOTIVO DO ERRO NO OPENROUTER:", data.error);
      return res.status(500).json({ erro: 'Bloqueio na IA: ' + data.error.message });
    }

    // 6. Tratamento da resposta para converter em JSON limpo e seguro
    let textoResposta = data.choices[0].message.content;
    textoResposta = textoResposta.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const jsonInicio = textoResposta.indexOf('{');
    const jsonFim = textoResposta.lastIndexOf('}') + 1;
    if (jsonInicio !== -1 && jsonFim !== -1) {
        textoResposta = textoResposta.substring(jsonInicio, jsonFim);
    }
    
    const analiseJSON = JSON.parse(textoResposta);
    res.status(200).json(analiseJSON);

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ erro: 'Não foi possível realizar a equiparação no momento.' });
  }
}
